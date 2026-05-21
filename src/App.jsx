import React, { useState, useRef } from 'react';
import { useMarkers } from './hooks/useMarkers';
import { useSearch } from './hooks/useSearch';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MapView from './components/Map';
import MapFloatingCard from './components/MapFloatingCard';
import QuotesPanel from './components/QuotesPanel';
import DetailPanel from './components/DetailPanel';

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
  // 'map' | 'manual' | null
  const [addInputMode, setAddInputMode] = useState(null);
  // show the mode-picker popup
  const [showModePicker, setShowModePicker] = useState(false);

  const [pendingCoords, setPendingCoords] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMarker, setEditingMarker] = useState(null);
  // prefill data for "more details" flow from floating card
  const [formPrefill, setFormPrefill] = useState(null);

  // Floating card state: { coords: {lat,lng}, pixelPos: {x,y} }
  const [mapFloatingCard, setMapFloatingCard] = useState(null);

  const [showQuotes, setShowQuotes] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showDetailPanel, setShowDetailPanel] = useState(false);

  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);

  const handleMarkerSelect = (id) => {
    selectMarker(id);
    const marker = markers.find((m) => m.id === id);
    if (marker && mapRef.current) {
      mapRef.current.flyTo([marker.latitude, marker.longitude], 8, { duration: 1 });
    }
  };

  const handleMapClick = (latlng) => {
    if (!isAddingMode) return;

    if (addInputMode === 'map') {
      // Convert lat/lng to pixel position
      let pixelPos = { x: 200, y: 200 };
      if (mapRef.current) {
        try {
          const point = mapRef.current.latLngToContainerPoint([latlng.lat, latlng.lng]);
          pixelPos = { x: point.x, y: point.y };
        } catch (_) {}
      }
      setMapFloatingCard({ coords: latlng, pixelPos });
      setIsAddingMode(false);
    } else {
      // Legacy single-mode (shouldn't be reached in new flow, but kept for safety)
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
    setFormPrefill(null);
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

  // Called when "➕ 添加" button is clicked — show mode picker
  const handleStartAddMode = () => {
    setShowModePicker(true);
    setShowAddForm(false);
    setPendingCoords(null);
    setEditingMarker(null);
    setFormPrefill(null);
    setMapFloatingCard(null);
  };

  // User chose "地图标点"
  const handlePickMapMode = () => {
    setShowModePicker(false);
    setAddInputMode('map');
    setIsAddingMode(true);
    deselectMarker();
  };

  // User chose "手动输入"
  const handlePickManualMode = () => {
    setShowModePicker(false);
    setAddInputMode('manual');
    setIsAddingMode(false);
    setShowAddForm(true);
    deselectMarker();
  };

  const handleCancelAdd = () => {
    setIsAddingMode(false);
    setShowAddForm(false);
    setPendingCoords(null);
    setEditingMarker(null);
    setFormPrefill(null);
    setAddInputMode(null);
    setShowModePicker(false);
    setMapFloatingCard(null);
  };

  // Floating card: quick save
  const handleFloatingQuickSave = (data) => {
    const newId = addMarker(data);
    setMapFloatingCard(null);
    setAddInputMode(null);
    selectMarker(newId);
  };

  // Floating card: more details → open sidebar form pre-filled
  const handleFloatingMoreDetails = (partial) => {
    setMapFloatingCard(null);
    setAddInputMode(null);
    setFormPrefill(partial);
    setPendingCoords(null);
    setShowAddForm(true);
  };

  // Container size for clamping floating card
  const getContainerSize = () => {
    if (mapContainerRef.current) {
      return {
        width: mapContainerRef.current.offsetWidth,
        height: mapContainerRef.current.offsetHeight,
      };
    }
    return { width: 800, height: 600 };
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Header onOpenQuotes={() => setShowQuotes(true)} />
      {showQuotes && <QuotesPanel onClose={() => setShowQuotes(false)} />}
      {showDetailPanel && (
        <DetailPanel
          marker={selectedMarker}
          onClose={() => setShowDetailPanel(false)}
        />
      )}
      <div className="flex flex-1 overflow-hidden app-layout relative">
        {/* Full-width Map - Base Layer (z-0) */}
        <div className="absolute inset-0 map-panel" ref={mapContainerRef}>
          {isAddingMode && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium pointer-events-none">
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
          {mapFloatingCard && (
            <MapFloatingCard
              coords={mapFloatingCard.coords}
              pixelPos={mapFloatingCard.pixelPos}
              containerSize={getContainerSize()}
              onQuickSave={handleFloatingQuickSave}
              onMoreDetails={handleFloatingMoreDetails}
              onCancel={() => { setMapFloatingCard(null); setAddInputMode(null); }}
            />
          )}
        </div>

        {/* Floating Sidebar - Above Map (z-40) */}
        {!sidebarCollapsed && (
          <div className="absolute top-0 left-0 bottom-0 w-80 z-40 shadow-lg animate-slide-in">
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
              showModePicker={showModePicker}
              editingMarker={editingMarker}
              pendingCoords={pendingCoords}
              formPrefill={formPrefill}
              onAddMarker={handleAddMarker}
              onUpdateMarker={handleUpdateMarker}
              onCancelAdd={handleCancelAdd}
              onPickMapMode={handlePickMapMode}
              onPickManualMode={handlePickManualMode}
              onResetToSample={resetToSample}
              onClearAll={clearAll}
              onToggleCollapse={() => setSidebarCollapsed(true)}
              onOpenDetail={() => setShowDetailPanel(true)}
            />
          </div>
        )}

        {/* Expand Button - Above Map (z-30) */}
        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="absolute top-4 left-4 z-30 bg-white rounded-lg shadow-md p-3 hover:shadow-lg hover:scale-105 transition-all group border border-gray-200"
            title="展开侧边栏"
          >
            <span className="text-xl group-hover:text-blue-600 transition-colors">▶️</span>
          </button>
        )}
      </div>
    </div>
  );
}
