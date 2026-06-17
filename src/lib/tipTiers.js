/**
 * 赞赏档位 · 国内扫码推荐金额（CNY）与 BagelPay 备用档（USD）
 */

export const TIP_TIERS = [
  {
    id: 'toosimple',
    suggestCny: 0.01,
    priceUsd: 0.69,
    label: '图样图森破',
    subtitle: 'Too young, too simple · 略表心意',
    envKey: 'BAGELPAY_TIP_PRODUCT_001',
    setupName: 'memorial-tip-toosimple',
  },
  {
    id: 'plus1s',
    suggestCny: 8.17,
    priceUsd: 1.0,
    label: '续一秒 (+1s)',
    subtitle: '8·17 · 为服务器续命',
    envKey: 'BAGELPAY_TIP_PRODUCT_817',
    setupName: 'memorial-tip-plus1s',
  },
  {
    id: 'talk',
    suggestCny: 19.26,
    priceUsd: 2.69,
    label: '谈笑风生',
    subtitle: '1926 · 经验丰富的一杯茶',
    envKey: 'BAGELPAY_TIP_PRODUCT_1926',
    setupName: 'memorial-tip-talk',
  },
];

export const TIP_CUSTOM_UNIT_USD = 1;

export function formatTipCny(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '¥—';
  if (n < 1) return `¥${n.toFixed(2)}`;
  const s = n.toFixed(2);
  return `¥${s.replace(/\.?0+$/, '')}`;
}

export function formatTipUsd(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '$—';
  return `$${n.toFixed(2).replace(/\.?0+$/, '')}`;
}

export function getTierById(tierId) {
  return TIP_TIERS.find((t) => t.id === tierId) || null;
}
