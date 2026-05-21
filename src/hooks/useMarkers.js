import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEY, SAMPLE_MARKERS } from '../utils/constants';

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load markers from localStorage:', e);
  }
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
