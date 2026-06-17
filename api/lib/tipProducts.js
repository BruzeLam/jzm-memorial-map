/** 赞赏档位 · 服务端 product 映射（BagelPay 仅 USD，无 $0.01 时用固定档产品） */

export const TIP_TIER_DEFS = [
  {
    id: 'toosimple',
    amountCny: 0.01,
    envKey: 'BAGELPAY_TIP_PRODUCT_001',
    setupName: 'memorial-tip-toosimple',
    setupPriceUsd: 0.69,
    setupDesc: '图样图森破 · 略表心意',
  },
  {
    id: 'plus1s',
    amountCny: 8.17,
    envKey: 'BAGELPAY_TIP_PRODUCT_817',
    setupName: 'memorial-tip-plus1s',
    setupPriceUsd: 1.0,
    setupDesc: '续一秒 (+1s) · 8·17',
  },
  {
    id: 'talk',
    amountCny: 19.26,
    envKey: 'BAGELPAY_TIP_PRODUCT_1926',
    setupName: 'memorial-tip-talk',
    setupPriceUsd: 2.69,
    setupDesc: '谈笑风生 · 1926',
  },
];

export function getTierById(tierId) {
  return TIP_TIER_DEFS.find((t) => t.id === tierId) || null;
}

export function getTierByAmountCny(amountCny) {
  const key = Number(amountCny).toFixed(2);
  return TIP_TIER_DEFS.find((t) => t.amountCny.toFixed(2) === key) || null;
}

export function resolveTipProduct({ tierId, amountCny }) {
  const tier = tierId ? getTierById(tierId) : getTierByAmountCny(amountCny);
  if (tier) {
    const productId = (process.env[tier.envKey] || '').trim();
    if (productId) return { productId, units: 1, tier };
  }

  const unitId = (process.env.BAGELPAY_TIP_PRODUCT_UNIT || process.env.BAGELPAY_TIP_PRODUCT_ID || '').trim();
  const unitUsd = Number(process.env.BAGELPAY_TIP_UNIT_USD || '1');
  if (!unitId || !Number.isFinite(unitUsd) || unitUsd <= 0) return null;

  const amount = Number(amountCny);
  const units = Math.max(1, Math.round((amount / unitUsd) * 100) / 100);
  const roundedUnits = Math.max(1, Math.round(units));
  return { productId: unitId, units: roundedUnits, tier: null };
}

export function isTipConfigured() {
  if (!process.env.BAGELPAY_API_KEY) return false;
  if (TIP_TIER_DEFS.some((t) => process.env[t.envKey])) return true;
  return Boolean(process.env.BAGELPAY_TIP_PRODUCT_UNIT || process.env.BAGELPAY_TIP_PRODUCT_ID);
}
