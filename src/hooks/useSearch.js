import { useState, useMemo, useCallback } from 'react';
import {
  formatRegionPath,
  buildRegionTree,
  markerMatchesRegionFilter,
} from '../utils/regionFormat';
import { filterBySearch, getMarkerSearchFields } from '../utils/textSearch';
import { markerMatchesOnThisDay } from '../utils/onThisDay';

export function useSearch(markers) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegionKeys, setSelectedRegionKeys] = useState(() => new Set());
  const [onThisDayActive, setOnThisDayActive] = useState(false);
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

  const toggleOnThisDay = useCallback(() => {
    setOnThisDayActive((prev) => !prev);
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
      if (onThisDayActive && !markerMatchesOnThisDay(marker)) return false;
      return true;
    });
    return filterBySearch(byTypeAndRegion, searchQuery, (marker) =>
      getMarkerSearchFields(marker, formatRegionPath(marker))
    );
  }, [markers, searchQuery, activeFilters, selectedRegionKeys, onThisDayActive]);

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
    onThisDayActive,
    toggleOnThisDay,
  };
}
