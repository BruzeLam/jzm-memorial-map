import { gcj02ToWgs84, wgs84ToGcj02 } from '../utils/coordTransform';
import { getAmapClientKey, prefersAmapSearch } from '../lib/amapConfig';

const NOMINATIM_HEADERS = {
  Accept: 'application/json',
  'Accept-Language': 'zh-CN,zh;q=0.9',
  'User-Agent': 'jzm-memorial-map/1.0 (https://github.com/BruzeLam/jzm-memorial-map)',
};

function amapAddressFromPoi(poi) {
  return {
    country: '中国',
    state: poi.pname || '',
    province: poi.pname || '',
    city: poi.cityname || '',
    county: poi.adname || '',
    road: poi.address || '',
  };
}

function normalizeAmapPoi(poi) {
  const [gcjLng, gcjLat] = (poi.location || '').split(',').map(Number);
  const { lng, lat } = gcj02ToWgs84(gcjLng, gcjLat);
  const address = amapAddressFromPoi(poi);
  const subtitle = [poi.pname, poi.cityname, poi.adname, poi.address].filter(Boolean).join(' · ');
  return {
    id: `amap_${poi.id || poi.name}_${gcjLng}_${gcjLat}`,
    name: poi.name || subtitle,
    display_name: subtitle || poi.name,
    lat,
    lng,
    lon: lng,
    address,
    source: 'amap',
  };
}

async function fetchAmapPlaceDirect(query, key) {
  const params = new URLSearchParams({
    keywords: query,
    key,
    offset: '10',
    page: '1',
    extensions: 'base',
  });
  const res = await fetch(`https://restapi.amap.com/v3/place/text?${params}`);
  const data = await res.json();
  if (data.status !== '1' || !Array.isArray(data.pois)) return [];
  return data.pois.map(normalizeAmapPoi);
}

async function fetchAmapPlaceProxy(query) {
  const params = new URLSearchParams({ keywords: query });
  const res = await fetch(`/api/amap/place?${params}`);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data.results) ? data.results : [];
}

async function searchAmap(query) {
  const clientKey = getAmapClientKey();
  if (clientKey) {
    try {
      return await fetchAmapPlaceDirect(query, clientKey);
    } catch {
      /* fall through */
    }
  }
  try {
    return await fetchAmapPlaceProxy(query);
  } catch {
    return [];
  }
}

async function searchNominatim(query) {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '8',
    addressdetails: '1',
    'accept-language': 'zh-CN',
  });
  if (prefersAmapSearch(query)) {
    params.set('countrycodes', 'cn');
  }

  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: NOMINATIM_HEADERS,
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data || []).map((item, index) => ({
    id: `osm_${item.place_id || index}`,
    name: item.name || item.display_name.split(',')[0].trim(),
    display_name: item.display_name,
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    lon: parseFloat(item.lon),
    address: item.address || {},
    source: 'nominatim',
  }));
}

/** 地点搜索：国内中文优先高德 POI，并补充 OSM 结果 */
export async function searchPlaces(query) {
  const trimmed = (query || '').trim();
  if (trimmed.length < 2) return [];

  const useAmap = prefersAmapSearch(trimmed);
  const [amapResults, osmResults] = await Promise.all([
    useAmap ? searchAmap(trimmed) : Promise.resolve([]),
    searchNominatim(trimmed).catch(() => []),
  ]);

  if (amapResults.length) {
    return [...amapResults, ...osmResults].slice(0, 10);
  }
  return osmResults.slice(0, 10);
}

function nominatimAddressFromRegeo(regeocode) {
  const comp = regeocode?.addressComponent || {};
  return {
    country: comp.country || '中国',
    state: comp.province || '',
    province: comp.province || '',
    city: comp.city || comp.district || '',
    county: comp.district || '',
    suburb: comp.township || '',
  };
}

async function reverseAmap(lat, lng) {
  const clientKey = getAmapClientKey();
  const gcj = wgs84ToGcj02(lng, lat);
  const location = `${gcj.lng},${gcj.lat}`;

  const load = async (url) => {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== '1') return null;
    return nominatimAddressFromRegeo(data.regeocode);
  };

  if (clientKey) {
    const params = new URLSearchParams({
      key: clientKey,
      location,
      extensions: 'base',
    });
    const addr = await load(`https://restapi.amap.com/v3/geocode/regeo?${params}`);
    if (addr) return addr;
  }

  const proxyParams = new URLSearchParams({ lat: String(lat), lng: String(lng) });
  try {
    const res = await fetch(`/api/amap/regeo?${proxyParams}`);
    if (res.ok) {
      const data = await res.json();
      if (data.address) return data.address;
    }
  } catch {
    /* ignore */
  }
  return null;
}

async function reverseNominatim(lat, lng) {
  const params = new URLSearchParams({
    format: 'json',
    lat: String(lat),
    lon: String(lng),
    addressdetails: '1',
    'accept-language': 'zh-CN',
  });
  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
    headers: NOMINATIM_HEADERS,
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.address || null;
}

/** 逆地理：国内优先高德，失败则 OSM */
export async function reversePlace(lat, lng) {
  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  if (Number.isNaN(latNum) || Number.isNaN(lngNum)) return null;

  const inChina = lngNum >= 73 && lngNum <= 135 && latNum >= 18 && latNum <= 54;
  if (inChina) {
    const amapAddr = await reverseAmap(latNum, lngNum).catch(() => null);
    if (amapAddr) return amapAddr;
  }
  return reverseNominatim(latNum, lngNum).catch(() => null);
}
