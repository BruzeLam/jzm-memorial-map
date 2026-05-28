import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEY, VERSION_KEY, DATA_VERSION, SAMPLE_MARKERS, REMOVED_MARKER_IDS } from '../utils/constants';
import { migrateAllMarkerRegions } from '../utils/regionFormat';
import { normalizeMarkerTagList, registerMarkerTags, collectAllMarkerTags } from '../utils/markerTags';

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

export function useMarkers() {
  const [markers, setMarkers] = useState(() => loadFromStorage());
  const [selectedMarkerId, setSelectedMarkerId] = useState(null);

  useEffect(() => {
    saveToStorage(markers);
  }, [markers]);

  const addMarker = useCallback((markerData) => {
    const normalized = normalizeMarkerFields(migrateAllMarkerRegions([markerData])[0]);
    const newMarker = {
      ...normalized,
      id: `${markerData.type}_${Date.now()}`,
    };
    registerMarkerTags(newMarker.tags);
    setMarkers((prev) => [...prev, newMarker]);
    return newMarker.id;
  }, []);

  const updateMarker = useCallback((id, updates) => {
    setMarkers((prev) => {
      const next = prev.map((m) => {
        if (m.id !== id) return m;
        const merged = normalizeMarkerFields(migrateAllMarkerRegions([{ ...m, ...updates }])[0]);
        return merged;
      });
      registerMarkerTags(collectAllMarkerTags(next));
      return next;
    });
  }, []);

  const deleteMarker = useCallback((id) => {
    setMarkers((prev) => prev.filter((m) => m.id !== id));
    setSelectedMarkerId((prev) => (prev === id ? null : prev));
  }, []);

  const resetToSample = useCallback(() => {
    setMarkers(SAMPLE_MARKERS);
    setSelectedMarkerId(null);
  }, []);

  const clearAll = useCallback(() => {
    setMarkers([]);
    setSelectedMarkerId(null);
  }, []);

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
  };
}
