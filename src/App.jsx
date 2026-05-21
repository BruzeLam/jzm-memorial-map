import React, { useState, useRef } from 'react';
import { useMarkers } from './hooks/useMarkers';
import { useSearch } from './hooks/useSearch';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MapView from './components/Map';

export default function App() {
  const {
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
  } = useMarkers();

  const { searchQuery, setSearchQuery, activeFilters, toggleFilter, clearSearch, filteredMarkers } =
    useSearch(markers);

  const [isAddingMode, setIsAddingMode] = useState(false);
  const [pendingCoords, setPendingCoords] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMarker, setEditingMarker] = useState(null);
  const mapRef = useRef(null);

  const handleMarkerSelect = (id) => {
    selectMarker(id);
    const marker = markers.find((m) => m.id === id);
    if (marker && mapRef.current) {
      mapRef.current.flyTo([marker.latitude, marker.longitude], 8, { duration: 1 });
    }
  };

  const handleMapClick = (latlng) => {
    if (isAddingMode) {
      setPendingCoords(latlng);
      setShowAddForm(true);
      setIsAddingMode(false);
    }
  };

  const handleAddMarker = (data) => {
    const newId = addMarker(data);
    setShowAddForm(false);
    setPendingCoords(null);
    setEditingMarker(null);
    selectMarker(newId);
  };

  const handleEditMarker = (marker) => {
    setEditingMarker(marker);
    setShowAddForm(true);
  };

  const handleUpdateMarker = (data) => {
    updateMarker(editingMarker.id, data);
    setShowAddForm(false);
    setEditingMarker(null);
  };

  const handleDeleteMarker = (id) => {
    if (window.confirm('确定要删除这个标记吗？')) {
      deleteMarker(id);
    }
  };

  const handleStartAddMode = () => {
    setIsAddingMode(true);
    setShowAddForm(false);
    setPendingCoords(null);
    deselectMarker();
  };

  const handleCancelAdd = () => {
    setIsAddingMode(false);
    setShowAddForm(false);
    setPendingCoords(null);
    setEditingMarker(null);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Header />
      <div className="flex flex-1 overflow-hidden app-layout">
        <Sidebar
          markers={markers}
          filteredMarkers={filteredMarkers}
          selectedMarkerId={selectedMarkerId}
          selectedMarker={selectedMarker}
          stats={stats}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeFilters={activeFilters}
          toggleFilter={toggleFilter}
          clearSearch={clearSearch}
          onMarkerSelect={handleMarkerSelect}
          onEditMarker={handleEditMarker}
          onDeleteMarker={handleDeleteMarker}
          onStartAddMode={handleStartAddMode}
          isAddingMode={isAddingMode}
          showAddForm={showAddForm}
          editingMarker={editingMarker}
          pendingCoords={pendingCoords}
          onAddMarker={handleAddMarker}
          onUpdateMarker={handleUpdateMarker}
          onCancelAdd={handleCancelAdd}
          onResetToSample={resetToSample}
          onClearAll={clearAll}
        />
        <div className="flex-1 relative map-panel">
          {isAddingMode && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium">
              点击地图选择位置
            </div>
          )}
          <MapView
            mapRef={mapRef}
            markers={filteredMarkers}
            selectedMarkerId={selectedMarkerId}
            onMarkerSelect={handleMarkerSelect}
            onMapClick={handleMapClick}
            isAddingMode={isAddingMode}
          />
        </div>
      </div>
    </div>
  );
}
