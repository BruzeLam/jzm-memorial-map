export function normalizeLng(lng) {
  let x = lng;
  while (x > 180) x -= 360;
  while (x < -180) x += 360;
  return x;
}

/**
 * 将目标经度调整为距当前地图中心最近的「世界副本」，
 * 便于在可横向循环的地图上 shortest-path flyTo。
 */
export function wrapLngNear(centerLng, targetLng) {
  let lng = targetLng;
  while (lng - centerLng > 180) lng -= 360;
  while (lng - centerLng < -180) lng += 360;
  return lng;
}

export function flyToLatLng(map, lat, lng, zoom, options) {
  const centerLng = map.getCenter().lng;
  map.flyTo([lat, wrapLngNear(centerLng, lng)], zoom, options);
}
