import { useState, useMemo, useCallback } from 'react';
import {
  formatRegionPath,
  buildRegionTree,
  markerMatchesRegionFilter,
} from '../utils/regionFormat';
import { filterBySearch, getMarkerSearchFields } from '../utils/textSearch';

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
    const byTypeAndRegion = markers.filter((marker) => {
      if (!activeFilters[marker.type]) return false;
      if (!markerMatchesRegionFilter(marker, selectedRegionKeys)) return false;
      return true;
    });
    return filterBySearch(byTypeAndRegion, searchQuery, (marker) =>
      getMarkerSearchFields(marker, formatRegionPath(marker))
    );
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
