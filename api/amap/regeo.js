/** Vercel Serverless：高德逆地理（WGS-84 入参） */

import { wgs84ToGcj02 } from '../../src/utils/coordTransform';

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

  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    res.status(400).json({ error: 'lat/lng required' });
    return;
  }

  const gcj = wgs84ToGcj02(lng, lat);
  const params = new URLSearchParams({
    key,
    location: `${gcj.lng},${gcj.lat}`,
    extensions: 'base',
  });

  try {
    const upstream = await fetch(`https://restapi.amap.com/v3/geocode/regeo?${params}`);
    const data = await upstream.json();
    if (data.status !== '1') {
      res.status(502).json({ error: data.info || 'Amap error' });
      return;
    }
    const comp = data.regeocode?.addressComponent || {};
    const address = {
      country: comp.country || '中国',
      state: comp.province || '',
      province: comp.province || '',
      city: comp.city || comp.district || '',
      county: comp.district || '',
      suburb: comp.township || '',
    };
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.status(200).json({ address });
  } catch (err) {
    res.status(502).json({ error: err.message || 'Upstream failed' });
  }
}
