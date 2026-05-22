import { useState, useEffect } from 'react';

const DIRECT_MUNICIPALITIES = new Set(['北京市', '上海市', '天津市', '重庆市']);

export function extractAdminInfo(address) {
  if (!address) return { country: '', province: '', city: '' };

  const country = address.country || '';
  const state = address.state || address.province || '';

  if (DIRECT_MUNICIPALITIES.has(state)) {
    const city = address.city || address.city_district || address.suburb || address.county || '';
    return { country, province: state, city };
  }

  const candidates = [
    address.city,
    address.municipality,
    address.county,
    address.town,
  ].filter(Boolean);

  let city = candidates.find(c => c.endsWith('市')) || '';
  if (!city) {
    city = candidates.find(c => !c.endsWith('区') && !c.endsWith('县') && !c.endsWith('旗')) || '';
  }
  if (!city) city = candidates[0] || '';

  return { country, province: state, city };
}

export function formatRegion(address) {
  if (!address) return '';
  const parts = [];
  if (address.country) parts.push(address.country);
  if (address.state || address.province) parts.push(address.state || address.province);
  if (address.city || address.county || address.town)
    parts.push(address.city || address.county || address.town);
  return parts.slice(0, 3).join(' / ');
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
