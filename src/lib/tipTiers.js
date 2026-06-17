/** 赞赏档位 · Stripe USD */

export const TIP_TIERS = [
  {
    id: 'toosimple',
    priceUsd: 1,
    label: '图样图森破',
    subtitle: 'Too young, too simple · 略表心意',
    stripeEnv: 'REACT_APP_STRIPE_TIP_URL_001',
  },
  {
    id: 'plus1s',
    priceUsd: 8.17,
    label: '续一秒 (+1s)',
    subtitle: '8·17 · 为服务器续命',
    stripeEnv: 'REACT_APP_STRIPE_TIP_URL_817',
  },
  {
    id: 'talk',
    priceUsd: 19.26,
    label: '谈笑风生',
    subtitle: '1926 · 经验丰富的一杯茶',
    stripeEnv: 'REACT_APP_STRIPE_TIP_URL_1926',
  },
];

export function formatTipUsd(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '$—';
  return `$${n.toFixed(2).replace(/\.?0+$/, '')}`;
}

export function getTierById(tierId) {
  return TIP_TIERS.find((t) => t.id === tierId) || null;
}
