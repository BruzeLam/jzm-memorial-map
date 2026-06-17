/** 赞赏档位 · Stripe HKD */

export const TIP_TIERS = [
  {
    id: 'plus1s',
    priceHkd: 4,
    label: '续一秒',
    subtitle: '+1s · 略表心意',
    stripeEnv: 'REACT_APP_STRIPE_TIP_URL_4',
  },
  {
    id: 'small',
    priceHkd: 8.17,
    label: '微小的贡献',
    subtitle: '8·17 · 为服务器续命',
    stripeEnv: 'REACT_APP_STRIPE_TIP_URL_817',
  },
  {
    id: 'talk',
    priceHkd: 19.26,
    label: '谈笑风生',
    subtitle: '1926 · 经验丰富的一杯茶',
    stripeEnv: 'REACT_APP_STRIPE_TIP_URL_1926',
  },
];

export function formatTipHkd(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return 'HK$—';
  const fixed = n.toFixed(2).replace(/\.?0+$/, '');
  return `HK$${fixed}`;
}

export function getTierById(tierId) {
  return TIP_TIERS.find((t) => t.id === tierId) || null;
}
