/** 赞赏档位 · 爱发电（CNY）或 Creem（USD）/ Stripe（HKD） */

export const TIP_TIERS = [
  {
    id: 'plus1s',
    priceCny: 5,
    priceHkd: 4,
    priceUsd: 1,
    label: '续一秒',
    subtitle: '+1s · 略表心意',
    afdianEnv: 'REACT_APP_AFDIAN_TIP_URL_4',
    stripeEnv: 'REACT_APP_STRIPE_TIP_URL_4',
    creemEnv: 'REACT_APP_CREEM_TIP_URL_4',
  },
  {
    id: 'small',
    priceCny: 8.17,
    priceHkd: 8.17,
    priceUsd: 2,
    label: '微小的贡献',
    subtitle: '8·17 · 为服务器续命',
    afdianEnv: 'REACT_APP_AFDIAN_TIP_URL_817',
    stripeEnv: 'REACT_APP_STRIPE_TIP_URL_817',
    creemEnv: 'REACT_APP_CREEM_TIP_URL_817',
  },
  {
    id: 'talk',
    priceCny: 19.26,
    priceHkd: 19.26,
    priceUsd: 5,
    label: '谈笑风生',
    subtitle: '1926 · 经验丰富的一杯茶',
    afdianEnv: 'REACT_APP_AFDIAN_TIP_URL_1926',
    stripeEnv: 'REACT_APP_STRIPE_TIP_URL_1926',
    creemEnv: 'REACT_APP_CREEM_TIP_URL_1926',
  },
];

export function formatTipCny(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '¥—';
  const fixed = n.toFixed(2).replace(/\.?0+$/, '');
  return `¥${fixed}`;
}

export function formatTipHkd(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return 'HK$—';
  const fixed = n.toFixed(2).replace(/\.?0+$/, '');
  return `HK$${fixed}`;
}

export function formatTipUsd(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '$—';
  const fixed = n.toFixed(2).replace(/\.?0+$/, '');
  return `$${fixed}`;
}

export function formatTierPrice(tier, provider = 'afdian') {
  if (provider === 'afdian' && tier.priceCny != null) {
    return formatTipCny(tier.priceCny);
  }
  if (provider === 'creem' && tier.priceUsd != null) {
    return formatTipUsd(tier.priceUsd);
  }
  return formatTipHkd(tier.priceHkd);
}

export function getTierById(tierId) {
  return TIP_TIERS.find((t) => t.id === tierId) || null;
}
