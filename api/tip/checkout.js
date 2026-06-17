/** POST · BagelPay Checkout Session */

import { resolveTipProduct } from '../lib/tipProducts.js';
import { TIP_CUSTOM_UNIT_USD } from '../../src/lib/tipTiers.js';

function getApiBase() {
  return (process.env.BAGELPAY_API_BASE || 'https://test.bagelpay.io').replace(/\/$/, '');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const apiKey = process.env.BAGELPAY_API_KEY;
  if (!apiKey) {
    res.status(503).json({
      error: 'not_configured',
      message: '赞赏尚未配置。运行：BAGELPAY_API_KEY=xxx npm run setup:tip -- --vercel',
    });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      res.status(400).json({ error: 'invalid_json', message: '请求格式无效' });
      return;
    }
  }

  const tierId = typeof body?.tierId === 'string' ? body.tierId.trim() : '';
  const amountUsd = tierId ? undefined : Number(body?.amountUsd);
  const minCustom = Number(process.env.BAGELPAY_TIP_UNIT_USD || TIP_CUSTOM_UNIT_USD);

  if (!tierId && (!Number.isFinite(amountUsd) || amountUsd < minCustom || amountUsd > 9999)) {
    res.status(400).json({
      error: 'invalid_amount',
      message: `自定义金额需在 $${minCustom} – $9999 之间`,
    });
    return;
  }

  const resolved = resolveTipProduct({
    tierId,
    amountUsd: tierId ? undefined : Math.round(amountUsd * 100) / 100,
  });

  if (!resolved) {
    res.status(503).json({
      error: 'not_configured',
      message: '未配置档位产品。运行 npm run setup:tip',
    });
    return;
  }

  const email = typeof body?.email === 'string' ? body.email.trim().slice(0, 200) : '';
  const payload = {
    product_id: resolved.productId,
    units: resolved.units,
    metadata: {
      source: 'memorial-map',
      tier_id: resolved.tier?.id || 'custom',
      charge_usd: String(resolved.chargeUsd),
    },
  };
  if (email) payload.customer = { email };

  try {
    const upstream = await fetch(`${getApiBase()}/api/payments/checkouts`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok || !data?.data?.checkout_url) {
      res.status(upstream.status >= 400 ? upstream.status : 502).json({
        error: 'checkout_failed',
        message: data?.msg || data?.message || '创建支付会话失败',
      });
      return;
    }

    res.status(200).json({
      checkoutUrl: data.data.checkout_url,
      chargeUsd: resolved.chargeUsd,
      testMode: getApiBase().includes('test.'),
    });
  } catch (err) {
    res.status(502).json({
      error: 'upstream_error',
      message: err?.message || '支付服务暂不可用',
    });
  }
}
