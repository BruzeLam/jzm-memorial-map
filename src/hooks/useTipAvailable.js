import { getDomesticTipConfig } from '../lib/tipConfig';

/** 赞赏是否已配置（微信 / 支付宝收款码） */
export function useTipAvailable() {
  const { enabled, channels } = getDomesticTipConfig();
  return {
    loading: false,
    enabled,
    channels,
  };
}
