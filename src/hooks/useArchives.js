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

export function useArchives({ isEditor = false } = {}) {
  const cloudMode = isCloudEnabled();
  const [archives, setArchives] = useState(() => (cloudMode ? [] : loadLocalArchives()));
  const [loading, setLoading] = useState(cloudMode);
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

  useEffect(() => {
    if (!cloudMode) return undefined;

    let cancelled = false;
    setLoading(true);

    fetchCloudArchives()
      .then((rows) => {
        if (cancelled) return;
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
        if (cancelled) return;
        console.error('Cloud archives fetch failed:', err);
        setError(err.message);
        try {
          const cached = localStorage.getItem(ARCHIVES_CACHE_KEY);
          if (cached) setArchives(JSON.parse(cached));
          else setArchives(loadLocalArchives());
        } catch (_) {
          setArchives(loadLocalArchives());
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [cloudMode]);

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
  };
}
