/**
 * 统一模糊搜索：实时过滤 + 数字边界
 *
 * 纯数字关键词不会在更长数字「内部」误匹配：
 * - "14" 不匹配 "1947"
 * - "19" 可匹配 "1947"（位于数字段开头）
 *
 * 含中文或混排的关键词仍用子串匹配。
 */

export function normalizeSearchQuery(query) {
  return (query ?? '').trim().toLowerCase();
}

function isAsciiDigit(ch) {
  return ch >= '0' && ch <= '9';
}

function isNumericQuery(query) {
  return /^\d+$/.test(query);
}

/**
 * @param {string} haystack
 * @param {string} query 已 normalize
 */
export function matchesBoundedSearch(haystack, query) {
  const q = normalizeSearchQuery(query);
  if (!q) return true;

  const h = (haystack ?? '').toString().toLowerCase();
  if (!h) return false;

  if (!isNumericQuery(q)) {
    return h.includes(q);
  }

  let from = 0;
  while (from <= h.length - q.length) {
    const pos = h.indexOf(q, from);
    if (pos === -1) return false;
    const before = pos > 0 ? h[pos - 1] : '';
    if (pos === 0 || !isAsciiDigit(before)) {
      return true;
    }
    from = pos + 1;
  }
  return false;
}

/** 任一字段命中即算匹配 */
export function matchesAnyField(fields, query) {
  const q = normalizeSearchQuery(query);
  if (!q) return true;
  return fields
    .filter((f) => f != null && String(f).trim() !== '')
    .some((f) => matchesBoundedSearch(String(f), q));
}

/**
 * @template T
 * @param {T[]} items
 * @param {string} query
 * @param {(item: T) => (string|number|null|undefined)[]} getFields
 */
export function filterBySearch(items, query, getFields) {
  const q = normalizeSearchQuery(query);
  if (!q) return items;
  return items.filter((item) => matchesAnyField(getFields(item), q));
}

/** 影像馆：标题 + 关联地点 + 时间等 */
export function getGallerySearchFields(img, markers = []) {
  const fields = [img.title, img.description, img.name];

  const marker = img.relatedMarker
    ? markers.find((m) => m.id === img.relatedMarker)
    : null;

  if (marker) {
    fields.push(
      marker.name,
      marker.title,
      marker.description,
      marker.date,
      marker.province,
      marker.city,
      marker.country
    );
  }

  if (img.location) {
    fields.push(
      img.location.address,
      img.location.city,
      img.location.province,
      img.location.country
    );
  }

  return fields;
}

export function filterGalleryBySearch(gallery, query, markers = []) {
  return filterBySearch(gallery, query, (img) => getGallerySearchFields(img, markers));
}

/** 地点列表侧边栏（含行程标签） */
export function getMarkerSearchFields(marker, regionPath = '') {
  const tagFields = (marker.tags || []).flatMap((t) => [t, `#${t}`]);
  return [
    marker.name,
    marker.title,
    marker.description,
    marker.tripSummary,
    marker.date,
    marker.endDate,
    marker.province,
    marker.city,
    marker.country,
    ...tagFields,
    regionPath,
  ];
}

/** 语录文献 */
export function getQuoteSearchFields(quote) {
  return [quote.text, quote.source, quote.context];
}

/** 档案馆（含标签，支持 #标签 检索） */
export function getArchiveSearchFields(item) {
  const tagFields = (item.tags || []).flatMap((t) => [t, `#${t}`]);
  return [
    item.title,
    item.text,
    item.source,
    ...tagFields,
    ...(item.links || []).map((l) => `${l.label} ${l.url}`),
  ];
}

/** 地区树节点标签 */
export function getRegionNodeSearchFields(node) {
  return [node.label, node.fullPath];
}
