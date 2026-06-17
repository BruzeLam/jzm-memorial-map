/** 随缘打赏 · 档位定义（支付配置见 scripts/setup-bagelpay-tip.mjs） */

/** 固定档位（CNY 展示 · 份数 × $0.01 基础产品） */
export const TIP_TIERS = [
  {
    id: 'toosimple',
    amountCny: 0.01,
    label: '图样图森破',
    subtitle: 'Too young, too simple · 略表心意',
  },
  {
    id: 'plus1s',
    amountCny: 8.17,
    label: '续一秒 (+1s)',
    subtitle: '8·17 专属 · 为服务器续命',
  },
  {
    id: 'talk',
    amountCny: 19.26,
    label: '谈笑风生',
    subtitle: '1926 · 经验丰富的一杯茶',
  },
];

export function formatTipCny(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '¥—';
  if (n < 1) return `¥${n.toFixed(2)}`;
  return `¥${n.toFixed(2).replace(/\.?0+$/, '')}`;
}
