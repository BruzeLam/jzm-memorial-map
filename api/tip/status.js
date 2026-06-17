/** GET · 档位列表（展示价与配置一致） */

import { isTipConfigured } from '../lib/tipProducts.js';
import { TIP_TIERS, TIP_CUSTOM_UNIT_USD } from '../../src/lib/tipTiers.js';

function getApiBase() {
  return (process.env.BAGELPAY_API_BASE || 'https://test.bagelpay.io').replace(/\/$/, '');
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const unitUsd = Number(process.env.BAGELPAY_TIP_UNIT_USD || TIP_CUSTOM_UNIT_USD);

  res.status(200).json({
    enabled: isTipConfigured(),
    testMode: getApiBase().includes('test.'),
    customUnitUsd: unitUsd,
    tiers: TIP_TIERS.map((t) => ({
      id: t.id,
      label: t.label,
      subtitle: t.subtitle,
      priceUsd: t.priceUsd,
      configured: Boolean(process.env[t.envKey]),
    })),
  });
}
