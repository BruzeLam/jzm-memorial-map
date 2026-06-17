/**
 * 赞赏档位 · 单一数据源（前后端共用）
 * 界面展示 priceUsd，与 BagelPay 产品定价一致，避免货不对版。
 */

export const TIP_TIERS = [
  {
    id: 'toosimple',
    priceUsd: 0.69,
    label: '图样图森破',
    subtitle: 'Too young, too simple · 略表心意',
    envKey: 'BAGELPAY_TIP_PRODUCT_001',
    setupName: 'memorial-tip-toosimple',
  },
  {
    id: 'plus1s',
    priceUsd: 1.0,
    label: '续一秒 (+1s)',
    subtitle: '8·17 梗 · 为服务器续命',
    envKey: 'BAGELPAY_TIP_PRODUCT_817',
    setupName: 'memorial-tip-plus1s',
  },
  {
    id: 'talk',
    priceUsd: 2.69,
    label: '谈笑风生',
    subtitle: '1926 梗 · 经验丰富的一杯茶',
    envKey: 'BAGELPAY_TIP_PRODUCT_1926',
    setupName: 'memorial-tip-talk',
  },
];

export const TIP_CUSTOM_UNIT_USD = 1;

export function formatTipUsd(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '$—';
  return `$${n.toFixed(2).replace(/\.?0+$/, '')}`;
}

export function getTierById(tierId) {
  return TIP_TIERS.find((t) => t.id === tierId) || null;
}
