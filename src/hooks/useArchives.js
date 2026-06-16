import { useState, useEffect, useCallback, useMemo } from 'react';
import { isCloudEnabled } from '../lib/cloudConfig';
import {
  fetchCloudArchives,
  upsertCloudArchive,
  deleteCloudArchive,
} from '../services/cloudData';
import {
  loadLocalArchives,
  saveLocalArchives,
  classifyArchives,
  normalizeArchiveRecord,
  ARCHIVES_CACHE_KEY,
  BUILTIN_ARCHIVES,
} from '../utils/archivesStorage';
import { collectAllTags, registerTags } from '../utils/archiveTags';
import { readJsonCache } from '../utils/storageCache';

function loadArchivesCache() {
  const cached = readJsonCache(ARCHIVES_CACHE_KEY);
  return Array.isArray(cached) && cached.length > 0 ? cached : null;
}

export function useArchives({ isEditor = false, cloudFetchEnabled = false } = {}) {
  const cloudMode = isCloudEnabled();
  const [archives, setArchives] = useState(() => {
    if (!cloudMode) return loadLocalArchives();
    return loadArchivesCache() || loadLocalArchives();
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const readOnly = cloudMode && !isEditor;

  const stats = useMemo(() => classifyArchives(archives), [archives]);

  useEffect(() => {
    registerTags(collectAllTags(archives));
  }, [archives]);

  useEffect(() => {
    if (!cloudMode) {
      saveLocalArchives(archives);
    }
  }, [archives, cloudMode]);

  const loadCloudArchives = useCallback(() => {
    if (!cloudMode) return Promise.resolve();

    setLoading(true);
    return fetchCloudArchives()
      .then((rows) => {
        if (rows?.length) {
          setArchives(rows);
          try {
            localStorage.setItem(ARCHIVES_CACHE_KEY, JSON.stringify(rows));
          } catch (_) {}
        } else {
          setArchives(loadLocalArchives());
        }
        setError(null);
      })
      .catch((err) => {
        console.error('Cloud archives fetch failed:', err);
        setError(err.message);
        const cached = loadArchivesCache();
        if (cached) setArchives(cached);
        else setArchives(loadLocalArchives());
      })
      .finally(() => {
        setLoading(false);
      });
  }, [cloudMode]);

  useEffect(() => {
    if (!cloudMode || !cloudFetchEnabled) return undefined;
    let cancelled = false;
    loadCloudArchives().then(() => {
      if (cancelled) return;
    });
    return () => {
      cancelled = true;
    };
  }, [cloudMode, cloudFetchEnabled, loadCloudArchives]);

  const addArchive = useCallback(
    async (item) => {
      if (readOnly) return null;
      const normalized = normalizeArchiveRecord({ ...item, isUserAdded: true });
      if (cloudMode) {
        await upsertCloudArchive(normalized);
      }
      setArchives((prev) => [...prev, normalized]);
      return normalized;
    },
    [readOnly, cloudMode]
  );

  const updateArchive = useCallback(
    async (item) => {
      if (readOnly) return;
      const normalized = normalizeArchiveRecord(item);
      if (cloudMode) {
        await upsertCloudArchive(normalized);
      }
      setArchives((prev) => prev.map((a) => (a.id === normalized.id ? normalized : a)));
    },
    [readOnly, cloudMode]
  );

  const deleteArchive = useCallback(
    async (id) => {
      if (readOnly) return;
      if (cloudMode) {
        await deleteCloudArchive(id);
      }
      setArchives((prev) => prev.filter((a) => a.id !== id));
    },
    [readOnly, cloudMode]
  );

  return {
    archives,
    stats,
    loading,
    error,
    readOnly,
    builtinCount: BUILTIN_ARCHIVES.length,
    addArchive,
    updateArchive,
    deleteArchive,
    ensureCloudLoaded: loadCloudArchives,
  };
}
