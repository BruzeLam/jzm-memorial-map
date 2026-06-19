import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from './useAdminAuth';
import { getTipConfig } from '../lib/tipConfig';
import { isCloudEnabled } from '../lib/cloudConfig';

const PLATFORM_LINKS = {
  supabase: 'https://supabase.com/dashboard',
  deepseek: 'https://platform.deepseek.com/',
  stripe: 'https://dashboard.stripe.com/',
  amap: 'https://console.amap.com/',
};

function StatusBadge({ configured, ok }) {
  if (!configured) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">未配置</span>
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
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{platform.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{platform.role}</p>
        </div>
        <StatusBadge configured={platform.configured} ok={platform.ok} />
      </div>

      <p className={`text-sm ${platform.ok ? 'text-gray-700' : 'text-red-700'}`}>
        {platform.detail || platform.error || '—'}
        {platform.ms != null && platform.configured && (
          <span className="text-gray-400 ml-1">({platform.ms}ms)</span>
        )}
      </p>

      {platform.counts && (
        <p className="text-xs text-gray-500">
          云端：地点 {platform.counts.markers} · 语录 {platform.counts.quotes} · 档案{' '}
          {platform.counts.archives}
          {platform.adminEmailConfigured != null && (
            <> · 超管邮箱 {platform.adminEmailConfigured ? '✓' : '✗'}</>
          )}
        </p>
      )}

      {platform.tiers?.length > 0 && (
        <ul className="text-xs text-gray-600 space-y-1">
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
            <code key={key} className="text-[10px] bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 text-gray-600">
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
            className="text-xs text-blue-600 hover:text-blue-800"
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

export default function AdminIntegrations() {
  const { session, isEditor } = useAdminAuth();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const clientTip = getTipConfig();
  const cloudClient = isCloudEnabled();

  const refresh = useCallback(async () => {
    if (!session?.access_token) {
      setError('请先登录协作者账号');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/integrations-health', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || data.error || `HTTP ${res.status}`);
      }
      setResult(data);
    } catch (err) {
      setError(err.message || '检测失败');
    } finally {
      setBusy(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    if (session?.access_token && isEditor) {
      refresh();
    }
  }, [session?.access_token, isEditor, refresh]);

  if (!isEditor) {
    return <p className="text-sm text-gray-600">需要协作者权限。</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900">外接服务</h1>
          <p className="text-sm text-gray-600 mt-1">
            检测 Vercel 环境变量对应的平台连通性。密钥仅存于服务端，此处只显示是否配置与探测结果。
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={refresh}
          className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium disabled:opacity-50 shrink-0"
        >
          {busy ? '检测中…' : '重新检测'}
        </button>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-700 space-y-1">
        <p>
          <strong>浏览器侧（构建时注入）：</strong>
          Supabase {cloudClient ? '✓ 已启用' : '✗ 未配'} · Stripe 打赏{' '}
          {clientTip.enabled ? `✓ ${clientTip.tiers.length} 档` : '✗ 未配'}
          {clientTip.stripeTestMode ? '（测试链接）' : ''}
        </p>
        <p className="text-slate-500">
          修改环境变量后需在 Vercel 重新部署；Stripe / Supabase 的 REACT_APP_* 变量还要触发一次 build 才会反映到前端。
        </p>
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
            {result.totalMs != null && (
              <span className="text-gray-500 font-normal ml-2">总耗时 {result.totalMs}ms</span>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {(result.platforms || []).map((platform) => (
              <PlatformCard key={platform.id} platform={platform} />
            ))}
          </div>

          {result.note && <p className="text-xs text-gray-500">{result.note}</p>}
        </>
      )}
    </div>
  );
}
