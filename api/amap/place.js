/** Vercel Serverless：高德 POI 搜索（隐藏 Web 服务 Key） */

import { gcj02ToWgs84 } from '../../src/utils/coordTransform';

function normalizePoi(poi) {
  const [gcjLng, gcjLat] = (poi.location || '').split(',').map(Number);
  const { lng, lat } = gcj02ToWgs84(gcjLng, gcjLat);
  return {
    id: `amap_${poi.id || poi.name}_${gcjLng}_${gcjLat}`,
    name: poi.name,
    display_name: [poi.pname, poi.cityname, poi.adname, poi.address].filter(Boolean).join(' · '),
    lat,
    lng,
    lon: lng,
    address: {
      country: '中国',
      state: poi.pname || '',
      province: poi.pname || '',
      city: poi.cityname || '',
      county: poi.adname || '',
      road: poi.address || '',
    },
    source: 'amap',
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const key = process.env.AMAP_WEB_SERVICE_KEY || process.env.REACT_APP_AMAP_KEY;
  if (!key) {
    res.status(503).json({ error: 'AMAP_WEB_SERVICE_KEY not configured' });
    return;
  }

  const keywords = (req.query.keywords || '').trim();
  if (!keywords || keywords.length < 2) {
    res.status(400).json({ error: 'keywords required' });
    return;
  }

  const params = new URLSearchParams({
    keywords,
    key,
    offset: '10',
    page: '1',
    extensions: 'base',
  });

  try {
    const upstream = await fetch(`https://restapi.amap.com/v3/place/text?${params}`);
    const data = await upstream.json();
    if (data.status !== '1') {
      res.status(502).json({ error: data.info || 'Amap error' });
      return;
    }
    const results = (data.pois || []).map(normalizePoi);
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.status(200).json({ results });
  } catch (err) {
    res.status(502).json({ error: err.message || 'Upstream failed' });
  }
}
