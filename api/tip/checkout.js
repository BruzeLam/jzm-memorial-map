/** POST · BagelPay Checkout Session（弹窗 iframe） */

const UNIT_PRODUCT_NAME = 'memorial-map-tip-unit';

function getApiBase() {
  return (process.env.BAGELPAY_API_BASE || 'https://test.bagelpay.io').replace(/\/$/, '');
}

function resolveUnits(amountCny) {
  const units = Math.round(amountCny * 100);
  if (units < 1) return null;
  return units;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const apiKey = process.env.BAGELPAY_API_KEY;
  const productId = (process.env.BAGELPAY_TIP_PRODUCT_ID || '').trim();
  if (!apiKey || !productId) {
    res.status(503).json({
      error: 'not_configured',
      message: '赞赏尚未配置。运行：BAGELPAY_API_KEY=xxx node scripts/setup-bagelpay-tip.mjs',
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

  const amountCny = Number(body?.amountCny);
  if (!Number.isFinite(amountCny) || amountCny < 0.01 || amountCny > 9999) {
    res.status(400).json({ error: 'invalid_amount', message: '金额需在 ¥0.01 – ¥9999 之间' });
    return;
  }

  const rounded = Math.round(amountCny * 100) / 100;
  const units = resolveUnits(rounded);
  if (!units) {
    res.status(400).json({ error: 'invalid_amount', message: '金额无效' });
    return;
  }

  const email = typeof body?.email === 'string' ? body.email.trim().slice(0, 200) : '';
  const payload = {
    product_id: productId,
    units,
    metadata: {
      source: 'memorial-map',
      amount_cny: String(rounded),
      product_ref: UNIT_PRODUCT_NAME,
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
