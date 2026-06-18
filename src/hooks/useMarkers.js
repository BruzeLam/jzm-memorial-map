import { useState, useEffect, useCallback, useMemo } from 'react';
import { STORAGE_KEY, VERSION_KEY, DATA_VERSION, SAMPLE_MARKERS } from '../utils/constants';
import { migrateAllMarkerRegions } from '../utils/regionFormat';
import { normalizeMarkerTagList, registerMarkerTags, collectAllMarkerTags } from '../utils/markerTags';
import { combineRemovedMarkerIds } from '../utils/removedMarkers';
import { isCloudEnabled } from '../lib/cloudConfig';
import { getStorageKeys } from '../config/branding';
import {
  fetchCloudMarkers,
  fetchCloudRemovedMarkerIds,
  upsertCloudMarker,
  deleteCloudMarker,
  addCloudRemovedMarkerId,
} from '../services/cloudData';
import { readJsonCache, runWhenIdle } from '../utils/storageCache';
import { mergeMarkerCatalog } from '../utils/markerCatalog';

const { markersCache: CACHE_KEY, removedMarkerIdsCache: REMOVED_CACHE_KEY } = getStorageKeys();

function normalizeMarkerFields(marker) {
  return {
    ...marker,
    tags: normalizeMarkerTagList(marker.tags),
    tripSummary: marker.tripSummary?.trim() || null,
    images: marker.images || [],
    sources: marker.sources || [],
  };
}

/** 云端记录优先，内置样本补全缺口；已删 ID 永不复活 */
function finalizeMarkers(markers, removedIds) {
  const removed = new Set(removedIds);
  const withoutRemoved = (markers || []).filter((m) => m?.id && !removed.has(m.id));
  const migrated = migrateAllMarkerRegions(withoutRemoved).map(normalizeMarkerFields);
  registerMarkerTags(collectAllMarkerTags(migrated));
  return migrated;
}

function mergeCatalogMarkers(remoteMarkers, removedIds) {
  return finalizeMarkers(
    mergeMarkerCatalog(remoteMarkers, SAMPLE_MARKERS, removedIds),
    removedIds
  );
}

function loadCloudCacheMarkers(removedIds) {
  const cached = readJsonCache(CACHE_KEY);
  if (Array.isArray(cached) && cached.length > 0) {
    return mergeCatalogMarkers(cached, removedIds);
  }
  return null;
}

function loadFromStorage() {
  try {
    const storedVersion = parseInt(localStorage.getItem(VERSION_KEY) || '0', 10);
    const raw = localStorage.getItem(STORAGE_KEY);
    const stored = raw ? JSON.parse(raw) : null;
    const dynamicRemoved = readJsonCache(REMOVED_CACHE_KEY) || [];
    const removedIds = combineRemovedMarkerIds(dynamicRemoved);

    if (Array.isArray(stored) && stored.length > 0) {
      if (storedVersion < DATA_VERSION) {
        const storedIds = new Set(stored.map((m) => m.id));
        const newItems = SAMPLE_MARKERS.filter((m) => !storedIds.has(m.id) && !removedIds.includes(m.id));
        const merged = mergeCatalogMarkers([...stored, ...newItems], removedIds);
        localStorage.setItem(VERSION_KEY, String(DATA_VERSION));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        return merged;
      }
      return finalizeMarkers(stored, removedIds);
    }
  } catch (e) {
    console.error('Failed to load markers from localStorage:', e);
  }

  localStorage.setItem(VERSION_KEY, String(DATA_VERSION));
  return mergeCatalogMarkers([], combineRemovedMarkerIds(readJsonCache(REMOVED_CACHE_KEY)));
}

function saveToStorage(markers) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(markers));
  } catch (e) {
    console.error('Failed to save markers to localStorage:', e);
  }
}

function persistRemovedCache(ids) {
  try {
    localStorage.setItem(REMOVED_CACHE_KEY, JSON.stringify(ids));
  } catch (_) {}
}

function persistMarkersCache(markers) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(markers));
  } catch (_) {}
}

export function useMarkers({ isEditor = false } = {}) {
  const cloudMode = isCloudEnabled();
  const [, setRemovedMarkerIds] = useState(
    () => readJsonCache(REMOVED_CACHE_KEY) || []
  );

  const [markers, setMarkers] = useState(() => {
    if (!cloudMode) return loadFromStorage();
    const removed = combineRemovedMarkerIds(readJsonCache(REMOVED_CACHE_KEY) || []);
    return loadCloudCacheMarkers(removed) ?? mergeCatalogMarkers([], removed);
  });
  const [selectedMarkerId, setSelectedMarkerId] = useState(null);
  const [cloudLoading, setCloudLoading] = useState(false);
  const [cloudError, setCloudError] = useState(null);

  useEffect(() => {
    if (!cloudMode) {
      saveToStorage(markers);
    }
  }, [markers, cloudMode]);

  useEffect(() => {
    if (!cloudMode) return undefined;

    let cancelled = false;

    const syncFromCloud = () => {
      if (cancelled) return;
      setCloudLoading(true);

      Promise.all([fetchCloudMarkers(), fetchCloudRemovedMarkerIds()])
        .then(([rows, removed]) => {
          if (cancelled) return;
          const combinedRemoved = combineRemovedMarkerIds(removed);
          setRemovedMarkerIds(removed);
          persistRemovedCache(removed);
          const next = mergeCatalogMarkers(rows || [], combinedRemoved);
          setMarkers(next);
          persistMarkersCache(next);
          setCloudError(null);
        })
        .catch((err) => {
          if (cancelled) return;
          console.error('Cloud markers fetch failed:', err);
          setCloudError(err.message);
          const cachedRemoved = readJsonCache(REMOVED_CACHE_KEY) || [];
          const combinedRemoved = combineRemovedMarkerIds(cachedRemoved);
          const cached = readJsonCache(CACHE_KEY);
          setMarkers(mergeCatalogMarkers(Array.isArray(cached) ? cached : [], combinedRemoved));
        })
        .finally(() => {
          if (!cancelled) setCloudLoading(false);
        });
    };

    const cancelIdle = runWhenIdle(syncFromCloud, 400);

    return () => {
      cancelled = true;
      cancelIdle();
    };
  }, [cloudMode]);

  const readOnly = cloudMode && !isEditor;

  const addMarker = useCallback((markerData) => {
    if (readOnly) return null;
    const normalized = normalizeMarkerFields(migrateAllMarkerRegions([markerData])[0]);
    const newMarker = {
      ...normalized,
      id: `${markerData.type}_${Date.now()}`,
    };
    registerMarkerTags(newMarker.tags);
    setMarkers((prev) => {
      const next = [...prev, newMarker];
      if (cloudMode) persistMarkersCache(next);
      return next;
    });
    if (cloudMode && isEditor) {
      upsertCloudMarker(newMarker).catch((err) => console.error('Cloud marker save failed:', err));
    }
    return newMarker.id;
  }, [readOnly, cloudMode, isEditor]);

  const updateMarker = useCallback((id, updates) => {
    if (readOnly) return;
    setMarkers((prev) => {
      const next = prev.map((m) => {
        if (m.id !== id) return m;
        const merged = normalizeMarkerFields(migrateAllMarkerRegions([{ ...m, ...updates }])[0]);
        if (cloudMode && isEditor) {
          upsertCloudMarker(merged).catch((err) => console.error('Cloud marker save failed:', err));
        }
        return merged;
      });
      registerMarkerTags(collectAllMarkerTags(next));
      if (cloudMode) persistMarkersCache(next);
      return next;
    });
  }, [readOnly, cloudMode, isEditor]);

  const deleteMarker = useCallback((id) => {
    if (readOnly) return;

    setMarkers((prev) => {
      const next = prev.filter((m) => m.id !== id);
      if (cloudMode) persistMarkersCache(next);
      return next;
    });
    setRemovedMarkerIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      persistRemovedCache(next);
      return next;
    });
    setSelectedMarkerId((prev) => (prev === id ? null : prev));

    if (cloudMode && isEditor) {
      Promise.all([deleteCloudMarker(id), addCloudRemovedMarkerId(id)]).catch((err) =>
        console.error('Cloud marker delete failed:', err)
      );
    }
  }, [readOnly, cloudMode, isEditor]);

  const resetToSample = useCallback(() => {
    if (readOnly || cloudMode) return;
    setMarkers(SAMPLE_MARKERS);
    setSelectedMarkerId(null);
  }, [readOnly, cloudMode]);

  const clearAll = useCallback(() => {
    if (readOnly || cloudMode) return;
    setMarkers([]);
    setSelectedMarkerId(null);
  }, [readOnly, cloudMode]);

  const selectedMarker = markers.find((m) => m.id === selectedMarkerId) || null;

  const selectMarker = useCallback((id) => {
    setSelectedMarkerId((prev) => (prev === id ? null : id));
  }, []);

  const deselectMarker = useCallback(() => {
    setSelectedMarkerId(null);
  }, []);

  const stats = useMemo(
    () => ({
      total: markers.length,
      spot: markers.filter((m) => m.type === 'spot').length,
      event: markers.filter((m) => m.type === 'event').length,
      inscription: markers.filter((m) => m.type === 'inscription').length,
    }),
    [markers]
  );

  return {
    markers,
    selectedMarkerId,
    selectedMarker,
    stats,
    addMarker,
    updateMarker,
    deleteMarker,
    selectMarker,
    deselectMarker,
    resetToSample,
    clearAll,
    cloudLoading,
    cloudError,
    readOnly,
  };
}
