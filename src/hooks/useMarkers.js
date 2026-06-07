import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEY, VERSION_KEY, DATA_VERSION, SAMPLE_MARKERS, REMOVED_MARKER_IDS } from '../utils/constants';
import { migrateAllMarkerRegions } from '../utils/regionFormat';
import { normalizeMarkerTagList, registerMarkerTags, collectAllMarkerTags } from '../utils/markerTags';
import { isCloudEnabled } from '../lib/cloudConfig';
import { getStorageKeys } from '../config/branding';
import { fetchCloudMarkers, upsertCloudMarker, deleteCloudMarker } from '../services/cloudData';

const CACHE_KEY = getStorageKeys().markersCache;

const removedIdSet = new Set(REMOVED_MARKER_IDS);

function normalizeMarkerFields(marker) {
  return {
    ...marker,
    tags: normalizeMarkerTagList(marker.tags),
    tripSummary: marker.tripSummary?.trim() || null,
    images: marker.images || [],
    sources: marker.sources || [],
  };
}

function applyMarkerMigrations(markers) {
  const withoutRemoved = markers.filter((m) => !removedIdSet.has(m.id));
  const migrated = migrateAllMarkerRegions(withoutRemoved).map(normalizeMarkerFields);
  registerMarkerTags(collectAllMarkerTags(migrated));
  return migrated;
}

function loadFromStorage() {
  try {
    const storedVersion = parseInt(localStorage.getItem(VERSION_KEY) || '0', 10);
    const raw = localStorage.getItem(STORAGE_KEY);
    const stored = raw ? JSON.parse(raw) : null;

    if (Array.isArray(stored) && stored.length > 0) {
      if (storedVersion < DATA_VERSION) {
        const storedIds = new Set(stored.map((m) => m.id));
        const newItems = SAMPLE_MARKERS.filter((m) => !storedIds.has(m.id));
        const merged = applyMarkerMigrations([...stored, ...newItems]);
        localStorage.setItem(VERSION_KEY, String(DATA_VERSION));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        return merged;
      }
      return stored;
    }
  } catch (e) {
    console.error('Failed to load markers from localStorage:', e);
  }

  // 首次访问：存入初始数据和版本号
  localStorage.setItem(VERSION_KEY, String(DATA_VERSION));
  return applyMarkerMigrations(SAMPLE_MARKERS);
}

function saveToStorage(markers) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(markers));
  } catch (e) {
    console.error('Failed to save markers to localStorage:', e);
  }
}

export function useMarkers({ isEditor = false } = {}) {
  const cloudMode = isCloudEnabled();
  const [markers, setMarkers] = useState(() => (cloudMode ? [] : loadFromStorage()));
  const [selectedMarkerId, setSelectedMarkerId] = useState(null);
  const [cloudLoading, setCloudLoading] = useState(cloudMode);
  const [cloudError, setCloudError] = useState(null);

  useEffect(() => {
    if (!cloudMode) {
      saveToStorage(markers);
    }
  }, [markers, cloudMode]);

  useEffect(() => {
    if (!cloudMode) return undefined;

    let cancelled = false;
    setCloudLoading(true);
    fetchCloudMarkers()
      .then((rows) => {
        if (cancelled) return;
        if (rows?.length) {
          setMarkers(rows);
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(rows));
          } catch (_) {}
        } else {
          const fallback = applyMarkerMigrations(SAMPLE_MARKERS);
          setMarkers(fallback);
        }
        setCloudError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Cloud markers fetch failed:', err);
        setCloudError(err.message);
        try {
          const cached = localStorage.getItem(CACHE_KEY);
          if (cached) setMarkers(JSON.parse(cached));
          else setMarkers(applyMarkerMigrations(SAMPLE_MARKERS));
        } catch (_) {
          setMarkers(applyMarkerMigrations(SAMPLE_MARKERS));
        }
      })
      .finally(() => {
        if (!cancelled) setCloudLoading(false);
      });

    return () => {
      cancelled = true;
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
    setMarkers((prev) => [...prev, newMarker]);
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
      return next;
    });
  }, [readOnly, cloudMode, isEditor]);

  const deleteMarker = useCallback((id) => {
    if (readOnly) return;
    setMarkers((prev) => prev.filter((m) => m.id !== id));
    setSelectedMarkerId((prev) => (prev === id ? null : prev));
    if (cloudMode && isEditor) {
      deleteCloudMarker(id).catch((err) => console.error('Cloud marker delete failed:', err));
    }
  }, [readOnly, cloudMode, isEditor]);

  const resetToSample = useCallback(() => {
    if (readOnly) return;
    setMarkers(SAMPLE_MARKERS);
    setSelectedMarkerId(null);
  }, [readOnly]);

  const clearAll = useCallback(() => {
    if (readOnly) return;
    setMarkers([]);
    setSelectedMarkerId(null);
  }, [readOnly]);

  const selectedMarker = markers.find((m) => m.id === selectedMarkerId) || null;

  const selectMarker = useCallback((id) => {
    setSelectedMarkerId((prev) => (prev === id ? null : id));
  }, []);

  const deselectMarker = useCallback(() => {
    setSelectedMarkerId(null);
  }, []);

  const stats = {
    total: markers.length,
    spot: markers.filter((m) => m.type === 'spot').length,
    event: markers.filter((m) => m.type === 'event').length,
    inscription: markers.filter((m) => m.type === 'inscription').length,
  };

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
