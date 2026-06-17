/** GET · 赞赏是否可用（前端无需 REACT_APP_TIP_*） */

function getApiBase() {
  return (process.env.BAGELPAY_API_BASE || 'https://test.bagelpay.io').replace(/\/$/, '');
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const enabled = Boolean(
    process.env.BAGELPAY_API_KEY && process.env.BAGELPAY_TIP_PRODUCT_ID
  );

  res.status(200).json({
    enabled,
    testMode: getApiBase().includes('test.'),
  });
}
