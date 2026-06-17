/** 随缘打赏 · Stripe Payment Link（三档 USD） */

import { TIP_TIERS } from './tipTiers';

export { TIP_TIERS, formatTipUsd, getTierById } from './tipTiers';

function readEnv(key) {
  return (process.env[key] || '').trim();
}

export function getStripeTierUrls() {
  return TIP_TIERS.map((tier) => ({
    ...tier,
    paymentUrl: readEnv(tier.stripeEnv),
  })).filter((t) => t.paymentUrl);
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
