import React, { useCallback, useState } from 'react';
import { useAdminAuth } from './useAdminAuth';

const STEP_LABELS = {
  env: '环境变量',
  builtInCatalog: 'Git 内置标点',
  markerCatalog: '全量 catalog（云 + 内置）',
  deepseekPing: 'DeepSeek 连通',
  pipelineSearch: '样例检索',
  pipelineGenerate: '样例生成',
};

function formatStepDetail(step) {
  if (!step.ok) return step.error || '失败';
  const { name, ok, ms, error, ...rest } = step;
  const parts = [];
  if (rest.deepseekKey != null) {
    parts.push(`DEEPSEEK_API_KEY ${rest.deepseekKey ? '✓' : '✗'}`);
    parts.push(`Supabase URL ${rest.supabaseUrl ? '✓' : '✗'}`);
    parts.push(`Supabase Key ${rest.supabaseKey ? '✓' : '✗'}`);
  }
  if (rest.fullCount != null) {
    parts.push(`核心 ${rest.coreCount} · 扩展 ${rest.extendedCount} · 合计 ${rest.fullCount}`);
  }
  if (rest.catalogSize != null && name !== 'builtInCatalog') {
    parts.push(`${rest.catalogSize} 条`);
  }
  if (rest.model) parts.push(`模型 ${rest.model}`);
  if (rest.replyPreview) parts.push(`回复预览：${rest.replyPreview}`);
  if (rest.promptTokens != null) {
    parts.push(`tokens in/out ${rest.promptTokens ?? '?'}/${rest.completionTokens ?? '?'}`);
  }
  if (rest.matchCount != null) {
    parts.push(`命中 ${rest.matchCount} · catalog ${rest.catalogSize}`);
  }
  if (rest.foreignCountries != null) {
    parts.push(`出访国家数 ${rest.foreignCountries}`);
  }
  if (rest.usedLlmPlanner) parts.push('已用 LLM 规划器');
  return parts.join(' · ') || '正常';
}

export default function AdminAgent() {
  const { session, isEditor } = useAdminAuth();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const runDiagnostics = useCallback(
    async (runPipeline = false) => {
      if (!session?.access_token) {
        setError('请先登录协作者账号');
        return;
      }
      setBusy(true);
      setError('');
      setResult(null);
      try {
        const res = await fetch('/api/agent-health', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ runPipeline }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok && !data.steps) {
          throw new Error(data.message || data.error || `HTTP ${res.status}`);
        }
        setResult(data);
      } catch (err) {
        setError(err.message || '诊断请求失败');
      } finally {
        setBusy(false);
      }
    },
    [session?.access_token]
  );

  if (!isEditor) {
    return <p className="text-sm text-memorial-muted">需要协作者权限。</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-memorial-navy">智能问诊断</h1>
        <p className="text-sm text-memorial-muted mt-1">
          分步检测导览 Agent 链路：环境变量、标点加载、DeepSeek 调用。完整链路会额外跑样例问题「他到过哪些国家？」。
        </p>
      </div>

      <div className="admin-card p-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => runDiagnostics(false)}
          className="px-4 py-2 rounded-lg bg-memorial-navy hover:bg-[#162d4a] text-white text-sm font-medium disabled:opacity-50"
        >
          {busy ? '检测中…' : '快速检测'}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => runDiagnostics(true)}
          className="px-4 py-2 rounded-lg bg-violet-700 hover:bg-violet-800 text-white text-sm font-medium disabled:opacity-50"
        >
          {busy ? '检测中…' : '完整链路（含 LLM）'}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      {result && (
        <div className="space-y-3">
          <div
            className={`text-sm font-medium px-3 py-2 rounded-lg border ${
              result.ok
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            {result.ok ? '全部通过' : '存在失败项'} · {result.checkedAt}
          </div>

          <div className="admin-card divide-y divide-memorial-border/60">
            {(result.steps || []).map((step) => (
              <div key={step.name} className="px-4 py-3 flex items-start gap-3">
                <span
                  className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 ${
                    step.ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}
                >
                  {step.ok ? '✓' : '✗'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-memorial-navy">
                    {STEP_LABELS[step.name] || step.name}
                    <span className="text-memorial-muted/70 font-normal ml-2">{step.ms}ms</span>
                  </p>
                  <p className="text-xs text-memorial-muted mt-0.5 break-words">{formatStepDetail(step)}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-memorial-muted">
            若 DeepSeek 或 Function 超时，请到 Vercel → Logs 查看 <code className="text-memorial-ink">[agent/chat]</code>{' '}
            分步耗时。Hobby 计划 Function 上限 10s，Pro 可配置 60s。
          </p>
        </div>
      )}
    </div>
  );
}
