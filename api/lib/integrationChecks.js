/** 外接平台连通性检测（仅返回状态，不暴露密钥） */

import { createClient } from '@supabase/supabase-js';
import { generateText } from 'ai';
import { createDeepSeek } from '@ai-sdk/deepseek';

const TIP_TIER_ENVS = [
  { id: 'plus1s', label: '续一秒 HK$4', keys: ['REACT_APP_STRIPE_TIP_URL_4', 'REACT_APP_STRIPE_TIP_URL_001'] },
  { id: 'small', label: '微小的贡献 HK$8.17', keys: ['REACT_APP_STRIPE_TIP_URL_817'] },
  { id: 'talk', label: '谈笑风生 HK$19.26', keys: ['REACT_APP_STRIPE_TIP_URL_1926'] },
];

function envPresent(...keys) {
  return keys.some((k) => Boolean((process.env[k] || '').trim()));
}

function readEnv(key) {
  return (process.env[key] || '').trim();
}

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;
  return { url, anonKey };
}

async function checkUrlReachable(url, { timeoutMs = 8000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal });
    return { ok: res.ok || res.status === 405, status: res.status };
  } catch (err) {
    if (err.name === 'AbortError') return { ok: false, status: 0, error: '请求超时' };
    return { ok: false, status: 0, error: err.message || '无法访问' };
  } finally {
    clearTimeout(timer);
  }
}

export async function checkSupabase() {
  const envKeys = ['REACT_APP_SUPABASE_URL', 'REACT_APP_SUPABASE_ANON_KEY'];
  const { url, anonKey } = getSupabaseConfig();
  const configured = Boolean(url && anonKey);

  if (!configured) {
    return {
      id: 'supabase',
      name: 'Supabase',
      role: '云端数据 · 登录 · 影像存储',
      configured: false,
      ok: false,
      envKeys,
      detail: '缺少 URL 或 Anon Key',
    };
  }

  const started = Date.now();
  try {
    const supabase = createClient(url, anonKey);
    const [markersRes, quotesRes, archivesRes] = await Promise.all([
      supabase.from('markers').select('id', { count: 'exact', head: true }),
      supabase.from('quotes').select('id', { count: 'exact', head: true }),
      supabase.from('archives').select('id', { count: 'exact', head: true }),
    ]);

    const errors = [markersRes.error, quotesRes.error, archivesRes.error].filter(Boolean);
    if (errors.length) {
      throw new Error(errors[0].message);
    }

    return {
      id: 'supabase',
      name: 'Supabase',
      role: '云端数据 · 登录 · 影像存储',
      configured: true,
      ok: true,
      ms: Date.now() - started,
      envKeys: [...envKeys, 'REACT_APP_ADMIN_EMAIL'],
      adminEmailConfigured: envPresent('REACT_APP_ADMIN_EMAIL', 'ADMIN_EMAIL'),
      counts: {
        markers: markersRes.count ?? 0,
        quotes: quotesRes.count ?? 0,
        archives: archivesRes.count ?? 0,
      },
      detail: `地点 ${markersRes.count ?? 0} · 语录 ${quotesRes.count ?? 0} · 档案 ${archivesRes.count ?? 0}`,
    };
  } catch (err) {
    return {
      id: 'supabase',
      name: 'Supabase',
      role: '云端数据 · 登录 · 影像存储',
      configured: true,
      ok: false,
      ms: Date.now() - started,
      envKeys,
      error: err.message || String(err),
      detail: err.message || '连接失败',
    };
  }
}

export async function checkDeepSeek() {
  const envKeys = ['DEEPSEEK_API_KEY'];
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    return {
      id: 'deepseek',
      name: 'DeepSeek',
      role: '智能问 · 导览 Agent',
      configured: false,
      ok: false,
      envKeys,
      detail: 'DEEPSEEK_API_KEY 未配置（仅 Vercel 服务端，勿加 REACT_APP_ 前缀）',
      adminPath: '/admin/agent',
    };
  }

  const started = Date.now();
  try {
    const deepseek = createDeepSeek({ apiKey });
    const { text, usage } = await generateText({
      model: deepseek('deepseek-chat'),
      prompt: '回复 exactly: ok',
      maxTokens: 8,
      temperature: 0,
    });
    return {
      id: 'deepseek',
      name: 'DeepSeek',
      role: '智能问 · 导览 Agent',
      configured: true,
      ok: true,
      ms: Date.now() - started,
      envKeys,
      model: 'deepseek-chat',
      replyPreview: (text || '').trim().slice(0, 20),
      promptTokens: usage?.promptTokens ?? null,
      completionTokens: usage?.completionTokens ?? null,
      detail: `模型 deepseek-chat 正常 · ${Date.now() - started}ms`,
      adminPath: '/admin/agent',
    };
  } catch (err) {
    const msg = err?.message || String(err);
    let detail = msg;
    if (/insufficient balance/i.test(msg)) detail = '账户余额不足';
    if (/invalid.*api.*key|authentication/i.test(msg)) detail = 'API Key 无效';

    return {
      id: 'deepseek',
      name: 'DeepSeek',
      role: '智能问 · 导览 Agent',
      configured: true,
      ok: false,
      ms: Date.now() - started,
      envKeys,
      error: msg,
      detail,
      adminPath: '/admin/agent',
    };
  }
}

export async function checkStripe() {
  const defaultKey = 'REACT_APP_STRIPE_TIP_URL';
  const envKeys = [defaultKey, ...TIP_TIER_ENVS.flatMap((t) => t.keys)];

  const defaultUrl = readEnv(defaultKey);
  const tiers = TIP_TIER_ENVS.map((tier) => {
    const url = tier.keys.map(readEnv).find(Boolean) || defaultUrl;
    return { ...tier, url };
  }).filter((t) => t.url);

  if (!tiers.length) {
    return {
      id: 'stripe',
      name: 'Stripe',
      role: '随缘打赏 · Payment Link',
      configured: false,
      ok: false,
      envKeys,
      detail: '未配置 Payment Link URL（REACT_APP_STRIPE_TIP_URL 或分档 URL）',
    };
  }

  const started = Date.now();
  const checks = await Promise.all(
    tiers.map(async (tier) => {
      const reach = await checkUrlReachable(tier.url);
      return {
        id: tier.id,
        label: tier.label,
        configured: true,
        ok: reach.ok,
        status: reach.status,
        testMode: /\/test_/.test(tier.url),
      };
    })
  );

  const allOk = checks.every((c) => c.ok);
  const testMode = checks.some((c) => c.testMode);

  return {
    id: 'stripe',
    name: 'Stripe',
    role: '随缘打赏 · Payment Link',
    configured: true,
    ok: allOk,
    ms: Date.now() - started,
    envKeys,
    testMode,
    tiers: checks,
    detail: allOk
      ? `${checks.length} 档 Payment Link 可访问${testMode ? '（测试模式）' : ''}`
      : `${checks.filter((c) => !c.ok).length} 档链接无法访问`,
  };
}

export async function checkAmap() {
  const envKeys = ['AMAP_WEB_SERVICE_KEY', 'REACT_APP_AMAP_KEY'];
  const key = process.env.AMAP_WEB_SERVICE_KEY || process.env.REACT_APP_AMAP_KEY;

  if (!key) {
    return {
      id: 'amap',
      name: '高德地图',
      role: '国内 POI 地点搜索',
      configured: false,
      ok: false,
      envKeys,
      detail: '未配置 Web 服务 Key（生产推荐 AMAP_WEB_SERVICE_KEY）',
    };
  }

  const started = Date.now();
  try {
    const params = new URLSearchParams({
      keywords: '北京',
      key,
      offset: '1',
      page: '1',
      extensions: 'base',
    });
    const res = await fetch(`https://restapi.amap.com/v3/place/text?${params}`);
    const data = await res.json();
    if (data.status !== '1') {
      throw new Error(data.info || '高德 API 返回错误');
    }
    return {
      id: 'amap',
      name: '高德地图',
      role: '国内 POI 地点搜索',
      configured: true,
      ok: true,
      ms: Date.now() - started,
      envKeys,
      sampleHits: (data.pois || []).length,
      detail: `POI 检索正常 · ${Date.now() - started}ms`,
    };
  } catch (err) {
    return {
      id: 'amap',
      name: '高德地图',
      role: '国内 POI 地点搜索',
      configured: true,
      ok: false,
      ms: Date.now() - started,
      envKeys,
      error: err.message || String(err),
      detail: err.message || 'API 调用失败',
    };
  }
}

export async function runAllIntegrationChecks() {
  return Promise.all([checkSupabase(), checkDeepSeek(), checkStripe(), checkAmap()]);
}
