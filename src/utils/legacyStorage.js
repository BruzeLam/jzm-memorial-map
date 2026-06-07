import { STORAGE_KEY } from './constants';
import { getStorageKeys } from '../config/branding';

const GALLERY_KEY = getStorageKeys().gallery;

/** 读取上云前保存在浏览器里的地点（未被云端模式清除） */
export function loadLegacyLocalMarkers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** 读取上云前保存在浏览器里的影像馆 */
export function loadLegacyLocalGallery() {
  try {
    const raw = localStorage.getItem(GALLERY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
