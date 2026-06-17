import { getTipConfig } from '../lib/tipConfig';

/** 赞赏渠道：国内收款码 + Stripe Payment Link（可选） */
export function useTipAvailable() {
  const { enabled, methods, stripeTestMode } = getTipConfig();
  return {
    loading: false,
    enabled,
    methods,
    stripeTestMode,
  };
}
