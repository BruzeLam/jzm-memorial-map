import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from './useAdminAuth';
import { isCloudEnabled } from '../lib/cloudConfig';
import {
  fetchCloudMarkers,
  fetchCloudQuotes,
  fetchCloudArchives,
} from '../services/cloudData';

const PLATFORM_LINKS = {
  supabase: 'https://supabase.com/dashboard',
  deepseek: 'https://platform.deepseek.com/',
  amap: 'https://console.amap.com/',
};

function StatusBadge({ configured, ok }) {
  if (!configured) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-memorial-cream-dark text-memorial-muted">未配置</span>
    );
  }
  if (ok) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">正常</span>
    );
  }
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800">异常</span>
  );
}

function PlatformCard({ platform }) {
  const dashboard = PLATFORM_LINKS[platform.id];

  return (
    <div className="admin-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-memorial-navy">{platform.name}</h3>
          <p className="text-xs text-memorial-muted mt-0.5">{platform.role}</p>
        </div>
        <StatusBadge configured={platform.configured} ok={platform.ok} />
      </div>

      <p className={`text-sm ${platform.ok || !platform.configured ? 'text-memorial-ink' : 'text-red-700'}`}>
        {platform.detail || platform.error || '—'}
        {platform.ms != null && platform.configured && (
          <span className="text-memorial-muted/70 ml-1">({platform.ms}ms)</span>
        )}
      </p>

      {platform.tiers?.length > 0 && (
        <ul className="text-xs text-memorial-muted space-y-1">
          {platform.tiers.map((tier) => (
            <li key={tier.id} className="flex items-center gap-2">
              <span className={tier.ok ? 'text-green-600' : 'text-red-600'}>
                {tier.ok ? '✓' : '✗'}
              </span>
              {tier.label}
              {tier.testMode && <span className="text-amber-600">（测试）</span>}
            </li>
          ))}
        </ul>
      )}

      {platform.envKeys?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {platform.envKeys.map((key) => (
            <code
              key={key}
              className="text-[10px] bg-memorial-cream border border-memorial-border rounded px-1.5 py-0.5 text-memorial-muted"
            >
              {key}
            </code>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        {dashboard && (
          <a
            href={dashboard}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-memorial-navy hover:text-memorial-ink"
          >
            打开 {platform.name} 控制台 →
          </a>
        )}
        {platform.adminPath && (
          <Link to={platform.adminPath} className="text-xs text-violet-700 hover:text-violet-900">
            详细诊断 →
          </Link>
        )}
      </div>
    </div>
  );
}

async function timed(label, fn) {
  const started = Date.now();
  try {
    const result = await fn();
    return { ok: true, ms: Date.now() - started, result };
  } catch (err) {
    return { ok: false, ms: Date.now() - started, error: err.message || String(err) };
  }
}

async function runClientIntegrationChecks(sessionToken) {
  const platforms = [];

  const supabase = await timed('supabase', async () => {
    if (!isCloudEnabled()) throw new Error('REACT_APP_SUPABASE_URL / ANON_KEY 未配置');
    const [markers, quotes, archives] = await Promise.all([
      fetchCloudMarkers(),
      fetchCloudQuotes(),
      fetchCloudArchives(),
    ]);
    return {
      markers: markers?.length ?? 0,
      quotes: quotes?.length ?? 0,
      archives: archives?.length ?? 0,
    };
  });

  platforms.push({
    id: 'supabase',
    name: 'Supabase',
    role: '云端数据 · 登录 · 影像存储',
    configured: isCloudEnabled(),
    ok: supabase.ok,
    ms: supabase.ms,
    envKeys: ['REACT_APP_SUPABASE_URL', 'REACT_APP_SUPABASE_ANON_KEY', 'REACT_APP_ADMIN_EMAIL'],
    detail: supabase.ok
      ? `地点 ${supabase.result.markers} · 语录 ${supabase.result.quotes} · 档案 ${supabase.result.archives}`
      : supabase.error,
    error: supabase.error,
  });

  const deepseek = await timed('deepseek', async () => {
    if (!sessionToken) throw new Error('需要协作者登录');
    const res = await fetch('/api/agent-health', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || data.error || `HTTP ${res.status}`);
    const envStep = (data.steps || []).find((s) => s.name === 'env');
    const ping = (data.steps || []).find((s) => s.name === 'deepseekPing');
    if (!envStep?.deepseekKey) throw new Error('DEEPSEEK_API_KEY 未配置');
    if (!ping?.ok) throw new Error(ping?.error || 'DeepSeek 检测失败');
    return { configured: true, ping };
  });

  platforms.push({
    id: 'deepseek',
    name: 'DeepSeek',
    role: '智能问 · 导览 Agent',
    configured: deepseek.ok || (deepseek.error && !/未配置/.test(deepseek.error)),
    ok: deepseek.ok,
    ms: deepseek.ms,
    envKeys: ['DEEPSEEK_API_KEY'],
    detail: deepseek.ok
      ? `模型 ${deepseek.result.ping.model} · ${deepseek.result.ping.replyPreview || 'ok'}`
      : deepseek.error,
    error: deepseek.error,
    adminPath: '/admin/agent',
  });

  const amap = await timed('amap', async () => {
    const res = await fetch('/api/amap/place?keywords=北京');
    if (res.status === 503) throw new Error('高德 Key 未配置');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { hits: data.results?.length ?? 0 };
  });

  platforms.push({
    id: 'amap',
    name: '高德地图',
    role: '国内 POI 地点搜索',
    configured: amap.ok || !/未配置/.test(amap.error || ''),
    ok: amap.ok,
    ms: amap.ms,
    envKeys: ['AMAP_WEB_SERVICE_KEY', 'REACT_APP_AMAP_KEY'],
    detail: amap.ok ? `POI 检索正常 · ${amap.result.hits} 条样例` : amap.error,
    error: amap.error,
  });

  return {
    ok: platforms.every((p) => !p.configured || p.ok),
    platforms,
    note: 'Supabase / DeepSeek 为核心服务；高德为可选。DeepSeek 通过服务端 agent-health 探测。',
  };
}

export default function AdminIntegrations() {
  const { session, isEditor } = useAdminAuth();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      const data = await runClientIntegrationChecks(session?.access_token);
      setResult({ ...data, checkedAt: new Date().toISOString() });
    } catch (err) {
      setError(err.message || '检测失败');
    } finally {
      setBusy(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    if (isEditor) refresh();
  }, [isEditor, refresh]);

  if (!isEditor) {
    return <p className="text-sm text-memorial-muted">需要协作者权限。</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-memorial-navy">外接服务</h1>
          <p className="text-sm text-memorial-muted mt-1">
            检测各平台连通性。Supabase 前端变量在构建时注入；DeepSeek 仅存在于 Vercel 服务端。
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={refresh}
          className="px-4 py-2 rounded-lg bg-memorial-navy hover:bg-[#162d4a] text-white text-sm font-medium disabled:opacity-50 shrink-0"
        >
          {busy ? '检测中…' : '重新检测'}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      {result && (
        <>
          <div
            className={`text-sm font-medium px-3 py-2 rounded-lg border ${
              result.ok
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            {result.ok ? '已配置的服务均正常' : '部分服务需关注'} · {result.checkedAt}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {(result.platforms || []).map((platform) => (
              <PlatformCard key={platform.id} platform={platform} />
            ))}
          </div>

          {result.note && <p className="text-xs text-memorial-muted">{result.note}</p>}
        </>
      )}
    </div>
  );
}
