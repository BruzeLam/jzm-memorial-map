/** 随缘打赏 · 前端配置 */

export {
  TIP_TIERS,
  TIP_CUSTOM_UNIT_USD,
  formatTipCny,
  formatTipUsd,
  getTierById,
} from './tipTiers';

function publicAssetUrl(path) {
  const trimmed = (path || '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const base = (process.env.PUBLIC_URL || '').replace(/\/$/, '');
  const rel = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${base}${rel}`;
}

/** 国内扫码赞赏（微信 / 支付宝收款码） */
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

export function isDomesticTipEnabled() {
  return getDomesticTipConfig().enabled;
}
