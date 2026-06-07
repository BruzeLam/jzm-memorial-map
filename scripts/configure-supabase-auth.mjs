#!/usr/bin/env node
/**
 * 一键配置 Supabase Auth 回调 URL（需 Personal Access Token）
 *
 * 用法：
 *   1. 打开 https://supabase.com/dashboard/account/tokens 创建 token
 *   2. SUPABASE_ACCESS_TOKEN=xxx node scripts/configure-supabase-auth.mjs
 */

const PROJECT_REF = 'zcakddlhhuqefuuxtgwa';
const SITE_URL = 'https://jzm-memorial-map.vercel.app';
const REDIRECT_URLS = [
  `${SITE_URL}/`,
  `${SITE_URL}/admin`,
  `${SITE_URL}/admin/login`,
  'http://localhost:3000/',
  'http://localhost:3000/admin',
  'http://localhost:3000/admin/login',
];

const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) {
  console.error(`
缺少 SUPABASE_ACCESS_TOKEN。

请执行：
  1. 打开 https://supabase.com/dashboard/account/tokens 创建 Access Token
  2. SUPABASE_ACCESS_TOKEN=你的token node scripts/configure-supabase-auth.mjs

或手动在 Supabase Dashboard → Authentication → URL Configuration 填入：
  Site URL: ${SITE_URL}
  Redirect URLs（每行一个）:
${REDIRECT_URLS.map((u) => `    ${u}`).join('\n')}
`);
  process.exit(1);
}

const body = {
  site_url: SITE_URL,
  uri_allow_list: REDIRECT_URLS.join(','),
};

const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
});

const text = await res.text();
if (!res.ok) {
  console.error('配置失败:', res.status, text);
  process.exit(1);
}

console.log('✅ Supabase Auth 已更新');
console.log('   Site URL:', SITE_URL);
console.log('   Redirect URLs:', REDIRECT_URLS.join(', '));
if (text) console.log(text);
