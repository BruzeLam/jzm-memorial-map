import { useState, useEffect } from 'react';
import {
  DIRECT_MUNICIPALITIES,
  normalizeAdminRegion,
  formatRegionPath,
  pickChinesePlaceName,
  isChina,
} from '../utils/regionFormat';

export function extractAdminInfo(address) {
  if (!address) return { country: '', province: '', city: '' };

  const country = pickChinesePlaceName(address.country);
  const state = pickChinesePlaceName(address.state || address.province || '');

  if (
    isChina(country) &&
    (DIRECT_MUNICIPALITIES.has(state) ||
      ['北京市', '上海市', '天津市', '重庆市', '北京', '上海', '天津', '重庆'].includes(state))
  ) {
    const municipality = state.endsWith('市') ? state : `${state.replace(/市$/, '')}市`;
    const district = pickChinesePlaceName(
      address.city_district ||
        address.suburb ||
        (address.city && (address.city.endsWith('区') || address.city.endsWith('县'))
          ? address.city
          : '') ||
        address.county ||
        ''
    );
    return normalizeAdminRegion({
      country: '中国',
      province: municipality,
      city: district,
    });
  }

  if (isChina(country)) {
    const prefecture = pickChinesePlaceName(
      [address.city, address.municipality].find((c) => c && c.endsWith('市')) ||
        [address.city, address.municipality].find(
          (c) => c && !c.endsWith('区') && !c.endsWith('县') && !c.endsWith('旗')
        ) ||
        ''
    );

    return normalizeAdminRegion({
      country: '中国',
      province: state,
      city: prefecture,
    });
  }

  const city = pickChinesePlaceName(
    address.city || address.town || address.municipality || address.county || ''
  );

  return normalizeAdminRegion({
    country,
    province: state,
    city,
  });
}

export function formatRegion(address) {
  if (!address) return '';
  return formatRegionPath(extractAdminInfo(address));
}

export function useReverseGeocoding(lat, lng) {
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!lat || !lng) {
      setAddress(null);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=zh-CN`,
          { headers: { 'Accept-Language': 'zh-CN,zh;q=0.9' } }
        );
        const data = await res.json();
        setAddress(data.address || null);
      } catch (e) {
        setAddress(null);
      } finally {
        setLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [lat, lng]);

  return { address, loading };
}

export function useLocationSearch(query) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&addressdetails=1&accept-language=zh-CN`,
          { headers: { 'Accept-Language': 'zh-CN,zh;q=0.9' } }
        );
        const data = await res.json();
        setResults(data);
      } catch (e) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  return { results, loading };
}
