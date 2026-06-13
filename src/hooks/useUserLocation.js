import { useEffect, useState } from 'react';

let cachedLocation = null;
let cachedError = null;
let requested = false;
const listeners = new Set();

function notify() {
  const snapshot = { location: cachedLocation, error: cachedError };
  listeners.forEach((fn) => fn(snapshot));
}

function ensureRequest() {
  if (requested) return;
  requested = true;

  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    cachedError = 'unsupported';
    notify();
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      cachedLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      cachedError = null;
      notify();
    },
    (err) => {
      cachedError = err.message || 'denied';
      notify();
    },
    { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
  );
}

/** 全站共享一次浏览器定位，供地图弹窗与标点详情显示直线距离 */
export function useUserLocation() {
  const [state, setState] = useState({ location: cachedLocation, error: cachedError });

  useEffect(() => {
    ensureRequest();
    const listener = setState;
    listeners.add(listener);
    setState({ location: cachedLocation, error: cachedError });
    return () => listeners.delete(listener);
  }, []);

  return state;
}
