/**
 * 影像馆工具：搜索、去重、与地点图片的单向同步约定
 * - 地点 → 影像馆：自动同步
 * - 影像馆 → 地点：仅关联元数据，不写入 marker.images
 */

export function imageDataFingerprint(data) {
  if (!data || typeof data !== 'string') return '';
  if (data.length <= 256) return data;
  return `${data.length}:${data.slice(0, 128)}:${data.slice(-128)}`;
}

export function isSameImageData(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  return imageDataFingerprint(a) === imageDataFingerprint(b);
}

/** 按图片数据去重，保留较早一条，合并关联地点信息 */
export function dedupeGallery(gallery) {
  const seen = new Map();
  const result = [];

  for (const img of gallery) {
    const fp = imageDataFingerprint(img.data);
    if (!fp) {
      result.push(img);
      continue;
    }
    const existingIdx = seen.get(fp);
    if (existingIdx === undefined) {
      seen.set(fp, result.length);
      result.push(img);
      continue;
    }
    const existing = result[existingIdx];
    result[existingIdx] = {
      ...existing,
      title: existing.title || img.title,
      description: existing.description || img.description,
      relatedMarker: existing.relatedMarker || img.relatedMarker,
      name: existing.name || img.name,
    };
  }

  return result;
}

export function markerImageAlreadyInGallery(gallery, imageData, markerId) {
  return gallery.some(
    (g) =>
      isSameImageData(g.data, imageData) &&
      (g.relatedMarker === markerId || g.relatedMarker == null)
  );
}
