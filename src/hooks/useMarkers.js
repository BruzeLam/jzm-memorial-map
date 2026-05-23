import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEY, VERSION_KEY, DATA_VERSION, SAMPLE_MARKERS } from '../utils/constants';

function loadFromStorage() {
  try {
    const storedVersion = parseInt(localStorage.getItem(VERSION_KEY) || '0', 10);
    const raw = localStorage.getItem(STORAGE_KEY);
    const stored = raw ? JSON.parse(raw) : null;

    if (Array.isArray(stored) && stored.length > 0) {
      if (storedVersion < DATA_VERSION) {
        // 版本升级：把 SAMPLE_MARKERS 中新增的 id 合并进来，不覆盖用户已有的标记
        const storedIds = new Set(stored.map((m) => m.id));
        const newItems = SAMPLE_MARKERS.filter((m) => !storedIds.has(m.id));
        const merged = [...stored, ...newItems];
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
  return SAMPLE_MARKERS;
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
    const newMarker = {
      ...markerData,
      id: `${markerData.type}_${Date.now()}`,
      images: markerData.images || [],
      sources: markerData.sources || [],
      visits: markerData.visits || [],
    };
    setMarkers((prev) => [...prev, newMarker]);
    return newMarker.id;
  }, []);

  const updateMarker = useCallback((id, updates) => {
    setMarkers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
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

  const addVisit = useCallback((markerId, visitData) => {
    setMarkers((prev) =>
      prev.map((m) => {
        if (m.id === markerId) {
          const newVisit = {
            ...visitData,
            id: `visit_${Date.now()}`,
          };
          return {
            ...m,
            visits: [...(m.visits || []), newVisit],
          };
        }
        return m;
      })
    );
  }, []);

  const updateVisit = useCallback((markerId, visitId, updates) => {
    setMarkers((prev) =>
      prev.map((m) => {
        if (m.id === markerId) {
          return {
            ...m,
            visits: (m.visits || []).map((v) =>
              v.id === visitId ? { ...v, ...updates } : v
            ),
          };
        }
        return m;
      })
    );
  }, []);

  const deleteVisit = useCallback((markerId, visitId) => {
    setMarkers((prev) =>
      prev.map((m) => {
        if (m.id === markerId) {
          return {
            ...m,
            visits: (m.visits || []).filter((v) => v.id !== visitId),
          };
        }
        return m;
      })
    );
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
    addVisit,
    updateVisit,
    deleteVisit,
    resetToSample,
    clearAll,
  };
}
