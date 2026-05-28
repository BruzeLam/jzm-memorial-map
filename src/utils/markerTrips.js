/** 同一行程（标签）内多标记的展示与检索辅助（足迹 / 事件 / 题字等均可） */

export function formatTripSiblingCount(count) {
  if (!count || count < 1) return '';
  return `同行程还有 ${count} 处相关标记`;
}

export function formatTripSiblingHeading(count) {
  return `同行程相关标记（${count}）`;
}

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

/** 从已有同标签足迹取可复用的行程信息（用于新建/编辑时自动补全） */
export function findTripTemplateFromTag(markers, tag, excludeId = null) {
  if (!tag || !Array.isArray(markers)) return null;
  const peer = markers.find(
    (m) =>
      m.id !== excludeId &&
      (m.tags || []).includes(tag) &&
      (m.tripSummary?.trim() || m.date || m.endDate || m.title?.trim())
  );
  if (!peer) return null;
  return {
    tag,
    fromName: peer.name,
    tripSummary: peer.tripSummary?.trim() || '',
    date: peer.date || '',
    endDate: peer.endDate || '',
    title: peer.title?.trim() || '',
  };
}

/** 新增标签时，从已有足迹合并可补全字段（仅填空字段，不覆盖已填内容） */
export function applyTripTemplateToForm(prev, template) {
  if (!template) return { form: prev, filled: [] };
  const filled = [];
  const next = { ...prev };
  if (!prev.tripSummary.trim() && template.tripSummary) {
    next.tripSummary = template.tripSummary;
    filled.push('行程总述');
  }
  if (!prev.date && template.date) {
    next.date = template.date;
    filled.push('开始日期');
  }
  if (!prev.endDate && template.endDate) {
    next.endDate = template.endDate;
    filled.push('结束日期');
  }
  if (!prev.title.trim() && template.title) {
    next.title = template.title;
    filled.push('小标题');
  }
  return { form: next, filled };
}
