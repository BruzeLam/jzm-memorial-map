/** 随缘打赏 · 爱发电 / Creem / Stripe Payment Link */

import { TIP_TIERS } from './tipTiers';

export {
  TIP_TIERS,
  formatTipCny,
  formatTipHkd,
  formatTipUsd,
  formatTierPrice,
  getTierById,
} from './tipTiers';

function readEnv(key) {
  return (process.env[key] || '').trim();
}

/** 显式开启：REACT_APP_TIP_ENABLED=true；未设或为 false 时不展示打赏入口 */
function isTipExplicitlyEnabled() {
  return readEnv('REACT_APP_TIP_ENABLED').toLowerCase() === 'true';
}

function disabledTipConfig(overrides = {}) {
  return {
    enabled: false,
    provider: null,
    tiers: [],
    testMode: false,
    stripeTestMode: false,
    embedCheckout: false,
    ...overrides,
  };
}

function isCreemTestUrl(url) {
  const u = url.toLowerCase();
  return u.includes('/test/') || u.includes('test.creem');
}

function isStripeTestUrl(url) {
  const u = url.toLowerCase();
  return u.includes('/test_') || u.includes('mode=test');
}

function afdianTierUrl(tier) {
  return readEnv(tier.afdianEnv) || readEnv('REACT_APP_AFDIAN_TIP_URL');
}

function stripeTierUrl(tier) {
  const url = readEnv(tier.stripeEnv);
  if (url) return url;
  if (tier.id === 'plus1s') return readEnv('REACT_APP_STRIPE_TIP_URL_001');
  return readEnv('REACT_APP_STRIPE_TIP_URL');
}

function creemTierUrl(tier) {
  return readEnv(tier.creemEnv) || readEnv('REACT_APP_CREEM_TIP_URL');
}

function hasAfdianConfig() {
  if (readEnv('REACT_APP_AFDIAN_TIP_URL')) return true;
  return TIP_TIERS.some((tier) => readEnv(tier.afdianEnv));
}

function hasCreemConfig() {
  if (readEnv('REACT_APP_CREEM_TIP_URL')) return true;
  return TIP_TIERS.some((tier) => readEnv(tier.creemEnv));
}

function hasStripeConfig() {
  if (readEnv('REACT_APP_STRIPE_TIP_URL')) return true;
  if (readEnv('REACT_APP_STRIPE_TIP_URL_001')) return true;
  return TIP_TIERS.some((tier) => readEnv(tier.stripeEnv));
}

const TIER_URL_RESOLVERS = {
  afdian: afdianTierUrl,
  creem: creemTierUrl,
  stripe: stripeTierUrl,
};

function buildTierUrls(provider) {
  const resolver = TIER_URL_RESOLVERS[provider];
  if (!resolver) return [];
  return TIP_TIERS.map((tier) => {
    const paymentUrl = resolver(tier);
    if (!paymentUrl) return null;
    return { ...tier, paymentUrl };
  }).filter(Boolean);
}

function resolveProvider() {
  if (hasAfdianConfig()) return 'afdian';
  if (hasCreemConfig()) return 'creem';
  if (hasStripeConfig()) return 'stripe';
  return null;
}

/** @deprecated 使用 getTipConfig */
export function getStripeTierUrls() {
  return buildTierUrls(resolveProvider() || 'stripe');
}

export function getTipConfig() {
  if (!isTipExplicitlyEnabled()) {
    return disabledTipConfig();
  }

  const provider = resolveProvider();
  if (!provider) {
    return disabledTipConfig();
  }

  const tiers = buildTierUrls(provider);
  if (!tiers.length) {
    return disabledTipConfig({ provider });
  }

  const sample = tiers[0].paymentUrl;
  const testMode =
    provider === 'creem'
      ? isCreemTestUrl(sample)
      : provider === 'stripe'
        ? isStripeTestUrl(sample)
        : false;

  return {
    enabled: true,
    provider,
    tiers,
    testMode,
    stripeTestMode: testMode,
    embedCheckout: provider === 'stripe',
  };
}

export function isTipEnabled() {
  return getTipConfig().enabled;
}
