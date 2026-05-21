import { useState, useMemo, useCallback } from 'react';

export function useSearch(markers) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    spot: true,
    event: true,
    inscription: true,
  });
  const [activeRegionFilters, setActiveRegionFilters] = useState({
    country: null,
    provinces: [],
  });

  const toggleFilter = useCallback((type) => {
    setActiveFilters((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  }, []);

  const setCountryFilter = useCallback((country) => {
    setActiveRegionFilters((prev) => ({
      ...prev,
      country: prev.country === country ? null : country,
      provinces: [],
    }));
  }, []);

  const toggleProvinceFilter = useCallback((province) => {
    setActiveRegionFilters((prev) => ({
      ...prev,
      provinces: prev.provinces.includes(province)
        ? prev.provinces.filter((p) => p !== province)
        : [...prev.provinces, province],
    }));
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const getRegionStats = useMemo(() => {
    const stats = {};
    markers.forEach((marker) => {
      const country = marker.country || '其他';
      if (!stats[country]) {
        stats[country] = { count: 0, provinces: {} };
      }
      stats[country].count++;
      const province = marker.province || '其他';
      stats[country].provinces[province] = (stats[country].provinces[province] || 0) + 1;
    });
    return stats;
  }, [markers]);

  const filteredMarkers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return markers.filter((marker) => {
      if (!activeFilters[marker.type]) return false;

      if (activeRegionFilters.country) {
        if (marker.country !== activeRegionFilters.country) return false;
        if (activeRegionFilters.provinces.length > 0) {
          if (!activeRegionFilters.provinces.includes(marker.province)) return false;
        }
      }

      if (!query) return true;
      return (
        marker.name.toLowerCase().includes(query) ||
        marker.title.toLowerCase().includes(query) ||
        marker.description.toLowerCase().includes(query) ||
        (marker.date && marker.date.toLowerCase().includes(query))
      );
    });
  }, [markers, searchQuery, activeFilters, activeRegionFilters]);

  return {
    searchQuery,
    setSearchQuery,
    activeFilters,
    toggleFilter,
    activeRegionFilters,
    setCountryFilter,
    toggleProvinceFilter,
    clearSearch,
    filteredMarkers,
    getRegionStats,
  };
}
