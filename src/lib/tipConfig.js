/** 随缘打赏 Payment Link（BagelPay / Stripe 等 · 见 .env.example） */

export function getTipUrl() {
  return (
    (process.env.REACT_APP_TIP_URL || '').trim() ||
    (process.env.REACT_APP_BAGELPAY_TIP_URL || '').trim() ||
    (process.env.REACT_APP_STRIPE_TIP_URL || '').trim()
  );
}

export function isTipEnabled() {
  return Boolean(getTipUrl());
}

/** @returns {'bagelpay'|'stripe'|'kofi'|'afdian'|'link'|null} */
export function getTipProvider() {
  const url = getTipUrl().toLowerCase();
  if (!url) return null;
  if (url.includes('bagelpay.io')) return 'bagelpay';
  if (url.includes('stripe.com')) return 'stripe';
  if (url.includes('ko-fi.com')) return 'kofi';
  if (url.includes('afdian.net')) return 'afdian';
  return 'link';
}

export function isTipTestMode() {
  const url = getTipUrl().toLowerCase();
  if (!url) return false;
  if (url.includes('test.bagelpay.io')) return true;
  if (url.includes('/test_') || url.includes('mode=test')) return true;
  return false;
}

/** @deprecated 使用 getTipUrl */
export const getStripeTipUrl = getTipUrl;
/** @deprecated 使用 isTipEnabled */
export const isStripeTipEnabled = isTipEnabled;
/** @deprecated 使用 isTipTestMode */
export const isStripeTipTestMode = isTipTestMode;
