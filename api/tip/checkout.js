/** POST · BagelPay Checkout Session（弹窗 iframe） */

import { resolveTipProduct } from '../lib/tipProducts.js';

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
  const amountCny = Number(body?.amountCny);
  if (!tierId && (!Number.isFinite(amountCny) || amountCny < 0.01 || amountCny > 9999)) {
    res.status(400).json({ error: 'invalid_amount', message: '金额需在 ¥0.01 – ¥9999 之间' });
    return;
  }

  const resolved = resolveTipProduct({
    tierId,
    amountCny: tierId ? undefined : Math.round(amountCny * 100) / 100,
  });

  if (!resolved) {
    res.status(503).json({
      error: 'not_configured',
      message: '未配置档位产品。运行 npm run setup:tip 或设置 BAGELPAY_TIP_PRODUCT_*',
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
      amount_cny: String(resolved.tier?.amountCny ?? amountCny),
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
      testMode: getApiBase().includes('test.'),
    });
  } catch (err) {
    res.status(502).json({
      error: 'upstream_error',
      message: err?.message || '支付服务暂不可用',
    });
  }
}
