/** 赞赏档位 · 国内扫码推荐金额（CNY） */

export const TIP_TIERS = [
  {
    id: 'toosimple',
    suggestCny: 0.01,
    label: '图样图森破',
    subtitle: 'Too young, too simple · 略表心意',
  },
  {
    id: 'plus1s',
    suggestCny: 8.17,
    label: '续一秒 (+1s)',
    subtitle: '8·17 · 为服务器续命',
  },
  {
    id: 'talk',
    suggestCny: 19.26,
    label: '谈笑风生',
    subtitle: '1926 · 经验丰富的一杯茶',
  },
];

export function formatTipCny(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '¥—';
  if (n < 1) return `¥${n.toFixed(2)}`;
  const s = n.toFixed(2);
  return `¥${s.replace(/\.?0+$/, '')}`;
}

export function getTierById(tierId) {
  return TIP_TIERS.find((t) => t.id === tierId) || null;
}
