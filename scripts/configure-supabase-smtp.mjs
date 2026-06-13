#!/usr/bin/env node
/**
 * 通过 Management API 配置 Supabase 自定义 SMTP（Resend）+ 调高 Auth 发信频率
 * 适用于 Dashboard 网页打不开（如国内网络）的情况。
 *
 * 用法：
 *   1. 在 https://supabase.com/dashboard/account/tokens 创建 Personal Access Token（需能访问，可开 VPN）
 *   2. 在 Resend 复制 API Key（re_...）
 *   3. 在本机终端执行（不要把 Key 写进代码或提交 Git）：
 *
 *      SUPABASE_ACCESS_TOKEN=sbp_xxx \
 *      RESEND_API_KEY=re_xxx \
 *      node scripts/configure-supabase-smtp.mjs
 *
 * 可选环境变量：
 *   SMTP_SENDER=onboarding@resend.dev
 *   SMTP_SENDER_NAME=江泽民同志生平纪念地图
 *   RATE_LIMIT_EMAIL=50
 *   RATE_LIMIT_OTP=50
 */

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'zcakddlhhuqefuuxtgwa';

const token = process.env.SUPABASE_ACCESS_TOKEN;
const resendKey = process.env.RESEND_API_KEY;

if (!token || !resendKey) {
  console.error(`
缺少环境变量。

请在本机终端执行（替换为你的 token / key，勿提交到 Git）：

  SUPABASE_ACCESS_TOKEN=sbp_你的Supabase个人Token \\
  RESEND_API_KEY=re_你的ResendKey \\
  node scripts/configure-supabase-smtp.mjs

Supabase Token 获取（需能打开 supabase.com，可开 VPN）：
  https://supabase.com/dashboard/account/tokens

Resend API Key：
  Resend 控制台 → API keys

若 supabase.com 完全打不开，可尝试：
  - 手机热点 + VPN
  - 改 DNS 为 1.1.1.1 / 8.8.8.8 后再试
`);
  process.exit(1);
}

const senderEmail = process.env.SMTP_SENDER || 'onboarding@resend.dev';
const senderName = process.env.SMTP_SENDER_NAME || '江泽民同志生平纪念地图';
const rateLimitEmail = Number(process.env.RATE_LIMIT_EMAIL || 50);
const rateLimitOtp = Number(process.env.RATE_LIMIT_OTP || 50);

const body = {
  external_email_enabled: true,
  smtp_host: 'smtp.resend.com',
  smtp_port: '587',
  smtp_user: 'resend',
  smtp_pass: resendKey,
  smtp_admin_email: senderEmail,
  smtp_sender_name: senderName,
  rate_limit_email_sent: rateLimitEmail,
  rate_limit_otp: rateLimitOtp,
};

console.log('正在配置 Supabase Auth SMTP（Resend）…');
console.log('  Project:', PROJECT_REF);
console.log('  Sender:', senderEmail);

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
  if (res.status === 401) {
    console.error('\n提示：SUPABASE_ACCESS_TOKEN 无效或过期，请重新创建。');
  }
  process.exit(1);
}

let parsed;
try {
  parsed = JSON.parse(text);
} catch {
  parsed = null;
}

console.log('✅ SMTP 与 Rate Limits 已更新');
console.log('   smtp_host:', parsed?.smtp_host || 'smtp.resend.com');
console.log('   smtp_admin_email:', parsed?.smtp_admin_email || senderEmail);
console.log('   rate_limit_email_sent:', parsed?.rate_limit_email_sent ?? rateLimitEmail);
console.log('   rate_limit_otp:', parsed?.rate_limit_otp ?? rateLimitOtp);
console.log('\n请到首页试一次「发送登录链接」，并在 Resend → Logs 查看是否发信成功。');
if (senderEmail === 'onboarding@resend.dev') {
  console.log(
    '\n⚠️  当前发件人为 onboarding@resend.dev：只能发到 Resend 注册邮箱，朋友无法收信。'
  );
  console.log('   验证自有域名后请设置：SMTP_SENDER=no-reply@你的域名.com');
}
