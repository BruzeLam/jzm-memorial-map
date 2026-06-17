import { useEffect, useState } from 'react';

/** 从 /api/tip/status 探测赞赏是否已配置 */
export function useTipAvailable() {
  const [state, setState] = useState({
    loading: true,
    enabled: false,
    testMode: false,
    customUnitUsd: 1,
  });

  useEffect(() => {
    let cancelled = false;
    fetch('/api/tip/status')
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setState({
            loading: false,
            enabled: Boolean(data.enabled),
            testMode: Boolean(data.testMode),
            customUnitUsd: Number(data.customUnitUsd) || 1,
          });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ loading: false, enabled: false, testMode: false, customUnitUsd: 1 });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
