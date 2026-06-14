/** Stripe Payment Link · 赞赏（见 .env.example） */

export function getStripeTipUrl() {
  return (process.env.REACT_APP_STRIPE_TIP_URL || '').trim();
}

export function isStripeTipEnabled() {
  return Boolean(getStripeTipUrl());
}

/** buy.stripe.com/test_… 或含 test 的链接 */
export function isStripeTipTestMode() {
  const url = getStripeTipUrl().toLowerCase();
  return url.includes('/test_') || url.includes('mode=test');
}
