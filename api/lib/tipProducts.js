/** 赞赏档位 · 服务端 product 映射 */

import { TIP_TIERS, TIP_CUSTOM_UNIT_USD, getTierById } from '../../src/lib/tipTiers.js';

export { TIP_TIERS, getTierById };

export function resolveTipProduct({ tierId, amountUsd }) {
  const tier = tierId ? getTierById(tierId) : null;
  if (tier) {
    const productId = (process.env[tier.envKey] || '').trim();
    if (productId) return { productId, units: 1, tier, chargeUsd: tier.priceUsd };
  }

  const unitId = (process.env.BAGELPAY_TIP_PRODUCT_UNIT || '').trim();
  const unitUsd = Number(process.env.BAGELPAY_TIP_UNIT_USD || String(TIP_CUSTOM_UNIT_USD));
  const amount = Number(amountUsd);
  if (!unitId || !Number.isFinite(unitUsd) || unitUsd <= 0 || !Number.isFinite(amount) || amount < unitUsd) {
    return null;
  }

  const units = Math.max(1, Math.round(amount / unitUsd));
  return { productId: unitId, units, tier: null, chargeUsd: units * unitUsd };
}

export function isTipConfigured() {
  if (!process.env.BAGELPAY_API_KEY) return false;
  if (TIP_TIERS.some((t) => process.env[t.envKey])) return true;
  return Boolean(process.env.BAGELPAY_TIP_PRODUCT_UNIT);
}
