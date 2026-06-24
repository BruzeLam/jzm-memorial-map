import { getTipConfig } from '../lib/tipConfig';

/** 赞赏 · 爱发电 / Creem / Stripe Payment Link 三档 */
export function useTipAvailable() {
  const { enabled, tiers, provider, testMode, embedCheckout } = getTipConfig();
  return {
    loading: false,
    enabled,
    tiers,
    provider,
    testMode,
    embedCheckout,
    stripeTestMode: testMode,
  };
}
