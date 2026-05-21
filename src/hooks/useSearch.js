import { useState, useMemo, useCallback } from 'react';

export function useSearch(markers) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    spot: true,
    event: true,
    inscription: true,
  });

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
      if (!query) return true;
      return (
        marker.name.toLowerCase().includes(query) ||
        marker.title.toLowerCase().includes(query) ||
        marker.description.toLowerCase().includes(query) ||
        (marker.date && marker.date.toLowerCase().includes(query))
      );
    });
  }, [markers, searchQuery, activeFilters]);

  return {
    searchQuery,
    setSearchQuery,
    activeFilters,
    toggleFilter,
    clearSearch,
    filteredMarkers,
  };
}
