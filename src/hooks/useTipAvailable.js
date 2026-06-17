import { getTipConfig } from '../lib/tipConfig';

/** 赞赏 · Stripe Payment Link 三档（USD） */
export function useTipAvailable() {
  const { enabled, tiers, stripeTestMode } = getTipConfig();
  return {
    loading: false,
    enabled,
    tiers,
    stripeTestMode,
  };
}
