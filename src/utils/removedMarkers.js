import { REMOVED_MARKER_IDS } from './constants';

export const SITE_META_REMOVED_MARKER_IDS_KEY = 'removed_marker_ids';

/** 内置硬编码 + 云端/本地记录的已删 ID */
export function combineRemovedMarkerIds(dynamicIds = []) {
  return [...new Set([...REMOVED_MARKER_IDS, ...(dynamicIds || [])])];
}

export function isMarkerRemoved(id, dynamicIds = []) {
  if (!id) return false;
  return combineRemovedMarkerIds(dynamicIds).includes(id);
}
