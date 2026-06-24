/**
 * 随缘打赏三档文案（仅保留 copy，打赏 UI 已移除）。
 * 日后若恢复爱发电等接入，可从此处读取 label / subtitle / 参考价。
 */
export const TIP_TIERS = [
  {
    id: 'plus1s',
    priceCny: 5,
    priceHkd: 4,
    label: '续一秒',
    subtitle: '+1s · 略表心意',
  },
  {
    id: 'small',
    priceCny: 8.17,
    priceHkd: 8.17,
    label: '微小的贡献',
    subtitle: '8·17 · 为服务器续命',
  },
  {
    id: 'talk',
    priceCny: 19.26,
    priceHkd: 19.26,
    label: '谈笑风生',
    subtitle: '1926 · 经验丰富的一杯茶',
  },
];

export function getTierById(tierId) {
  return TIP_TIERS.find((t) => t.id === tierId) || null;
}
