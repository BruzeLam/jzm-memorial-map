#!/usr/bin/env node
/**
 * 只读：查看 Supabase Auth 当前 SMTP 与发信频率（Management API GET）
 *
 *   SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/inspect-supabase-auth-config.mjs
 */

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'zcakddlhhuqefuuxtgwa';
const token = process.env.SUPABASE_ACCESS_TOKEN;

if (!token) {
  console.error('请设置 SUPABASE_ACCESS_TOKEN（https://supabase.com/dashboard/account/tokens）');
  process.exit(1);
}

const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`, {
  headers: { Authorization: `Bearer ${token}` },
});

const text = await res.text();
if (!res.ok) {
  console.error('查询失败:', res.status, text);
  process.exit(1);
}

const cfg = JSON.parse(text);
const customSmtp = Boolean(cfg.smtp_host && cfg.smtp_pass);

console.log('Supabase Auth 发信配置（项目', PROJECT_REF, '）\n');
console.log('自定义 SMTP:', customSmtp ? '已启用' : '未启用（内置 SMTP，约 2～4 封/小时）');
if (customSmtp) {
  console.log('  smtp_host:', cfg.smtp_host);
  console.log('  smtp_port:', cfg.smtp_port);
  console.log('  发件人:', cfg.smtp_admin_email);
  console.log('  发件人名称:', cfg.smtp_sender_name);
}
console.log('');
console.log('Supabase 频率限制（项目级，全用户合计）:');
console.log('  rate_limit_email_sent:', cfg.rate_limit_email_sent ?? '(默认)');
console.log('  rate_limit_otp:', cfg.rate_limit_otp ?? '(默认)');
console.log('  rate_limit_otp_period (秒，同邮箱两次请求间隔):', cfg.rate_limit_otp_period ?? '(默认，通常 60)');
console.log('  mailer_secure_email_change_enabled:', cfg.mailer_secure_email_change_enabled);
console.log('');
console.log('说明: 真正拦截「发送登录链接」的通常是 rate_limit_email_sent / rate_limit_otp。');
console.log('Resend 另有月/日配额，见 https://resend.com/docs/knowledge-base/what-are-the-rate-limits');
