/** 随缘打赏 · Stripe Payment Link（三档 USD） */

import { TIP_TIERS } from './tipTiers';

export { TIP_TIERS, formatTipUsd, getTierById } from './tipTiers';

function readEnv(key) {
  return (process.env[key] || '').trim();
}

export function getStripeTierUrls() {
  const legacy = readEnv('REACT_APP_STRIPE_TIP_URL') || readEnv('REACT_APP_TIP_URL');
  return TIP_TIERS.map((tier) => {
    let url = readEnv(tier.stripeEnv);
    if (!url && tier.id === 'toosimple' && legacy) url = legacy;
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
