/** 高德 Web 服务 Key（地点搜索）。生产建议用 Vercel 环境变量 AMAP_WEB_SERVICE_KEY + /api/amap 代理 */

export function getAmapClientKey() {
  return (process.env.REACT_APP_AMAP_KEY || '').trim();
}

export function isAmapSearchEnabled() {
  return Boolean(getAmapClientKey());
}

/** 含中文时优先走高德 POI 搜索 */
export function prefersAmapSearch(query) {
  return /[\u4e00-\u9fff]/.test(query || '');
}
