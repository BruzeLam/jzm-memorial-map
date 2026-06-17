/** 随缘打赏 · Stripe Payment Link（三档 HKD） */

import { TIP_TIERS } from './tipTiers';

export { TIP_TIERS, formatTipHkd, getTierById } from './tipTiers';

function readEnv(key) {
  return (process.env[key] || '').trim();
}

/** 兼容旧变量名（曾用 _001 表示最低档） */
function tierPaymentUrl(tier) {
  const url = readEnv(tier.stripeEnv);
  if (url) return url;
  if (tier.id === 'plus1s') return readEnv('REACT_APP_STRIPE_TIP_URL_001');
  return '';
}

export function getStripeTierUrls() {
  const defaultUrl = readEnv('REACT_APP_STRIPE_TIP_URL');
  return TIP_TIERS.map((tier) => {
    const url = tierPaymentUrl(tier) || defaultUrl;
    return { ...tier, paymentUrl: url };
  }).filter((t) => t.paymentUrl);
}

export function getTipConfig() {
  const tiers = getStripeTierUrls();
  if (!tiers.length) {
    return { enabled: false, tiers: [], stripeTestMode: false };
  }
  const sample = tiers[0].paymentUrl.toLowerCase();
  return {
    enabled: true,
    tiers,
    stripeTestMode: sample.includes('/test_') || sample.includes('mode=test'),
  };
}

export function isTipEnabled() {
  return getTipConfig().enabled;
}
