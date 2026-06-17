/** 随缘打赏 · 微信 / 支付宝收款码 + Stripe Payment Link */

export { TIP_TIERS, formatTipCny, getTierById } from './tipTiers';

function publicAssetUrl(path) {
  const trimmed = (path || '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const base = (process.env.PUBLIC_URL || '').replace(/\/$/, '');
  const rel = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${base}${rel}`;
}

export function getDomesticTipConfig() {
  const wechatQr = publicAssetUrl(process.env.REACT_APP_TIP_WECHAT_QR);
  const alipayQr = publicAssetUrl(process.env.REACT_APP_TIP_ALIPAY_QR);
  const channels = [];
  if (wechatQr) channels.push({ id: 'wechat', label: '微信支付', qrUrl: wechatQr });
  if (alipayQr) channels.push({ id: 'alipay', label: '支付宝', qrUrl: alipayQr });
  return {
    enabled: channels.length > 0,
    channels,
  };
}

export function getStripeTipConfig() {
  const paymentUrl = (process.env.REACT_APP_STRIPE_TIP_URL || '').trim();
  if (!paymentUrl) return { enabled: false, paymentUrl: '', testMode: false };
  const lower = paymentUrl.toLowerCase();
  return {
    enabled: true,
    paymentUrl,
    testMode: lower.includes('/test_') || lower.includes('mode=test'),
  };
}

/** @returns {{ enabled: boolean, methods: Array, stripeTestMode: boolean }} */
export function getTipConfig() {
  const domestic = getDomesticTipConfig();
  const stripe = getStripeTipConfig();
  const methods = [
    ...domestic.channels.map((ch) => ({ type: 'qr', ...ch })),
    ...(stripe.enabled
      ? [{ type: 'stripe', id: 'stripe', label: 'Stripe', paymentUrl: stripe.paymentUrl }]
      : []),
  ];
  return {
    enabled: methods.length > 0,
    methods,
    stripeTestMode: stripe.testMode,
  };
}

export function isTipEnabled() {
  return getTipConfig().enabled;
}
