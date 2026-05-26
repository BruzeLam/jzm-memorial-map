import { useState, useMemo, useCallback } from 'react';
import {
  formatRegionPath,
  buildRegionTree,
  markerMatchesRegionFilter,
} from '../utils/regionFormat';

export function useSearch(markers) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegionKeys, setSelectedRegionKeys] = useState(() => new Set());
  const [activeFilters, setActiveFilters] = useState({
    spot: true,
    event: true,
    inscription: true,
  });

  const regionTree = useMemo(() => buildRegionTree(markers), [markers]);

  const toggleRegionKey = useCallback((key) => {
    setSelectedRegionKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const clearRegionFilter = useCallback(() => {
    setSelectedRegionKeys(new Set());
  }, []);

  const toggleFilter = useCallback((type) => {
    setActiveFilters((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const filteredMarkers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return markers.filter((marker) => {
      if (!activeFilters[marker.type]) return false;
      if (!markerMatchesRegionFilter(marker, selectedRegionKeys)) return false;
      if (!query) return true;
      const regionText = formatRegionPath(marker).toLowerCase();
      return (
        marker.name.toLowerCase().includes(query) ||
        marker.title.toLowerCase().includes(query) ||
        marker.description.toLowerCase().includes(query) ||
        (marker.date && marker.date.toLowerCase().includes(query)) ||
        regionText.includes(query) ||
        (marker.province && marker.province.toLowerCase().includes(query)) ||
        (marker.city && marker.city.toLowerCase().includes(query))
      );
    });
  }, [markers, searchQuery, activeFilters, selectedRegionKeys]);

  return {
    searchQuery,
    setSearchQuery,
    activeFilters,
    toggleFilter,
    clearSearch,
    filteredMarkers,
    regionTree,
    selectedRegionKeys,
    toggleRegionKey,
    clearRegionFilter,
  };
}
