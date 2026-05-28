/** 同一行程（标签）内多足迹的展示与检索辅助 */

export function getSharedTags(marker) {
  return Array.isArray(marker?.tags) ? marker.tags.filter(Boolean) : [];
}

/** 与当前标点共享任一标签的其它足迹 */
export function getTripSiblings(markers, marker) {
  if (!marker) return [];
  const tags = new Set(getSharedTags(marker));
  if (!tags.size) return [];
  return markers.filter((m) => {
    if (m.id === marker.id) return false;
    return (m.tags || []).some((t) => tags.has(t));
  });
}

/** 本点行程总述：优先本点 tripSummary，否则同标签其它点 */
export function resolveTripSummary(marker, markers) {
  const own = marker.tripSummary?.trim();
  if (own) return own;
  for (const sib of getTripSiblings(markers, marker)) {
    const peer = sib.tripSummary?.trim();
    if (peer) return peer;
  }
  return null;
}

/** 本点说明：有 description 用本点，否则不冒充行程总述（总述单独展示） */
export function resolveLocalDescription(marker) {
  const d = marker.description?.trim();
  return d || null;
}

export function getTripMateIds(markers, selectedMarker) {
  const ids = new Set();
  if (!selectedMarker) return ids;
  for (const sib of getTripSiblings(markers, selectedMarker)) {
    ids.add(sib.id);
  }
  return ids;
}
