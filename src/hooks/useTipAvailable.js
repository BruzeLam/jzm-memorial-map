import { useEffect, useState } from 'react';
import { getDomesticTipConfig } from '../lib/tipConfig';

/** 探测赞赏：优先国内扫码，否则 BagelPay */
export function useTipAvailable() {
  const domestic = getDomesticTipConfig();

  const [state, setState] = useState(() =>
    domestic.enabled
      ? {
          loading: false,
          enabled: true,
          mode: 'domestic',
          testMode: false,
          customUnitUsd: 1,
          channels: domestic.channels,
        }
      : {
          loading: true,
          enabled: false,
          mode: 'none',
          testMode: false,
          customUnitUsd: 1,
          channels: [],
        }
  );

  useEffect(() => {
    if (domestic.enabled) return undefined;

    let cancelled = false;
    fetch('/api/tip/status')
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setState({
            loading: false,
            enabled: Boolean(data.enabled),
            mode: data.enabled ? 'bagelpay' : 'none',
            testMode: Boolean(data.testMode),
            customUnitUsd: Number(data.customUnitUsd) || 1,
            channels: [],
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({
            loading: false,
            enabled: false,
            mode: 'none',
            testMode: false,
            customUnitUsd: 1,
            channels: [],
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [domestic.enabled]);

  return state;
}
