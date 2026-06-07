import { ARCHIVES } from '../data/archives';
import { PORTFOLIO_ARCHIVES } from '../data/portfolio/archives';
import { isPortfolioDemoData, getStorageKeys, getBranding } from '../config/branding';
import { downloadFile } from './dataExport';
import {
  normalizeTagList,
  collectAllTags,
  registerTags,
} from './archiveTags';

const _sk = getStorageKeys();
export const ARCHIVES_STORAGE_KEY = _sk.archives;
export const ARCHIVES_MIGRATED_KEY = _sk.archivesMigrated;
export const ARCHIVES_TAGS_SEED_KEY = _sk.archivesTagsSeed;
export const ARCHIVES_CACHE_KEY = _sk.archivesCache;

const BUILTIN_SOURCE = isPortfolioDemoData() ? PORTFOLIO_ARCHIVES : ARCHIVES;
const BUILTIN_IDS = new Set(BUILTIN_SOURCE.map((a) => a.id));

export function isBuiltinArchiveId(id) {
  return BUILTIN_IDS.has(id) || (typeof id === 'string' && id.startsWith('archive_') && BUILTIN_IDS.has(id));
}

export function normalizeArchiveRecord(item, index = 0) {
  let tags = normalizeTagList(item.tags);
  if (!tags.length && item.context?.trim()) {
    tags = normalizeTagList([item.context]);
  }
  const id = item.id || `archive_${index}`;
  return {
    id,
    title: item.title || '',
    text: (item.text || '').trim(),
    source: item.source || null,
    tags,
    links: Array.isArray(item.links) ? item.links : [],
    images: Array.isArray(item.images) ? item.images : [],
    isUserAdded: item.isUserAdded ?? !BUILTIN_IDS.has(id),
  };
}

function seedBuiltinTags(list) {
  if (localStorage.getItem(ARCHIVES_TAGS_SEED_KEY)) return list;
  const seedById = Object.fromEntries(
    BUILTIN_SOURCE.filter((a) => a.tags?.length).map((a) => [a.id, a.tags])
  );
  const updated = list.map((item) => {
    const seedTags = seedById[item.id];
    if (!seedTags?.length) return item;
    const merged = normalizeTagList([...(item.tags || []), ...seedTags]);
    return merged.length ? { ...item, tags: merged } : item;
  });
  localStorage.setItem(ARCHIVES_TAGS_SEED_KEY, 'true');
  return updated;
}

export function classifyArchives(archives) {
  const list = Array.isArray(archives) ? archives : [];
  const builtin = list.filter((a) => !a.isUserAdded);
  const userAdded = list.filter((a) => a.isUserAdded);
  return {
    total: list.length,
    builtin: builtin.length,
    userAdded: userAdded.length,
  };
}

export function loadLocalArchives() {
  try {
    const migrated = localStorage.getItem(ARCHIVES_MIGRATED_KEY);
    if (!migrated) {
      let all = BUILTIN_SOURCE.map(normalizeArchiveRecord).filter((a) => a.text);
      all = seedBuiltinTags(all);
      registerTags(collectAllTags(all));
      localStorage.setItem(ARCHIVES_STORAGE_KEY, JSON.stringify(all));
      localStorage.setItem(ARCHIVES_MIGRATED_KEY, 'true');
      return all;
    }
    const raw = localStorage.getItem(ARCHIVES_STORAGE_KEY);
    if (!raw) return BUILTIN_SOURCE.map(normalizeArchiveRecord).filter((a) => a.text);
    let list = JSON.parse(raw).map((a, i) => normalizeArchiveRecord(a, i));
    const beforeSeed = JSON.stringify(list);
    list = seedBuiltinTags(list);
    if (JSON.stringify(list) !== beforeSeed) {
      saveLocalArchives(list);
      registerTags(collectAllTags(list));
    }
    return list.filter((a) => a.text);
  } catch (e) {
    console.error('Failed to load archives from localStorage:', e);
    return BUILTIN_SOURCE.map(normalizeArchiveRecord).filter((a) => a.text);
  }
}

export function saveLocalArchives(archives) {
  localStorage.setItem(ARCHIVES_STORAGE_KEY, JSON.stringify(archives));
}

export function loadLegacyLocalArchives() {
  return loadLocalArchives();
}

export function exportArchivesBackup(archives, filenamePrefix) {
  const prefix = filenamePrefix || `${getBranding().exportFilePrefix}-archives`;
  const timestamp = new Date().toISOString().slice(0, 10);
  const stats = classifyArchives(archives);
  const payload = {
    title: `${getBranding().siteTitle} · 档案馆备份`,
    exportedAt: new Date().toISOString(),
    stats,
    archives,
  };
  downloadFile(JSON.stringify(payload, null, 2), `${prefix}-${timestamp}.json`, 'application/json');
}

export function parseArchivesImport(raw) {
  const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
  let list = [];
  if (Array.isArray(data)) list = data;
  else if (Array.isArray(data?.archives)) list = data.archives;
  else throw new Error('无法识别档案馆 JSON 格式');

  return list
    .map((item, i) =>
      normalizeArchiveRecord(
        {
          ...item,
          isUserAdded: item.isUserAdded ?? !BUILTIN_IDS.has(item.id),
        },
        i
      )
    )
    .filter((a) => a.text);
}

export { BUILTIN_SOURCE as BUILTIN_ARCHIVES };
