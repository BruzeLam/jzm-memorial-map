/** 将 Supabase Auth 发信/登录错误转为用户可读文案 */

const ZH = {
  'editorLogin.rateLimitExceeded':
    '登录邮件发送过于频繁（Supabase 限制）。请稍等 30～60 分钟再试，或查收邮箱中尚未过期的登录链接；长期可配置自定义 SMTP，见 docs/ADMIN_SETUP.md。',
  'editorLogin.emailNotAuthorized':
    '该邮箱暂无法收信。请在 Supabase 配置自定义 SMTP，或将收件人加入 Supabase 组织成员（仅适合测试）。',
  'editorLogin.sendFailed': '发送失败',
};

export function formatAuthEmailError(err, t) {
  const raw = err?.message || '';
  const lower = raw.toLowerCase();

  if (
    lower.includes('rate limit') ||
    lower.includes('over_email_send_rate_limit') ||
    lower.includes('429')
  ) {
    return t('editorLogin.rateLimitExceeded');
  }

  if (lower.includes('email address not authorized') || lower.includes('not authorized')) {
    return t('editorLogin.emailNotAuthorized');
  }

  return raw || t('editorLogin.sendFailed');
}

/** 后台页等未接入 i18n 时使用 */
export function formatAuthEmailErrorZh(err) {
  return formatAuthEmailError(err, (key) => ZH[key] || key);
}
