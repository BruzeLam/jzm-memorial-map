/** GET · 赞赏是否可用 */

import { isTipConfigured } from '../lib/tipProducts.js';

function getApiBase() {
  return (process.env.BAGELPAY_API_BASE || 'https://test.bagelpay.io').replace(/\/$/, '');
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  res.status(200).json({
    enabled: isTipConfigured(),
    testMode: getApiBase().includes('test.'),
  });
}
