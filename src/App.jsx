import React, { useState, useRef, useEffect } from 'react';
import { useMarkers } from './hooks/useMarkers';
import { useSearch } from './hooks/useSearch';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MapView from './components/Map';
import MapFloatingCard from './components/MapFloatingCard';
import QuotesPanel from './components/QuotesPanel';
import DetailPanel from './components/DetailPanel';
import ChangelogPanel from './components/ChangelogPanel';

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
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);

  const mapRef = useRef(null);
  const resizeStartXRef = useRef(null);
  const resizeStartWidthRef = useRef(null);

  // Auto-focus on first search result when search query changes
  useEffect(() => {
    if (searchQuery && filteredMarkers.length > 0) {
      const firstResult = filteredMarkers[0];
      selectMarker(firstResult.id);
      if (mapRef.current) {
        mapRef.current.flyTo(
          [firstResult.latitude, firstResult.longitude],
          8,
          { duration: 1 }
        );
      }
    }
  }, [searchQuery, filteredMarkers, selectMarker]);

  // Handle sidebar resize
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      const delta = e.clientX - resizeStartXRef.current;
      const newWidth = Math.max(320, Math.min(resizeStartWidthRef.current + delta, window.innerWidth / 3));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleResizeStart = (e) => {
    setIsResizing(true);
    resizeStartXRef.current = e.clientX;
    resizeStartWidthRef.current = sidebarWidth;
  };

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


  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Header
        onOpenQuotes={() => setShowQuotes(true)}
        onOpenChangelog={() => setShowChangelog(true)}
      />
      {showQuotes && <QuotesPanel onClose={() => setShowQuotes(false)} />}
      {showDetailPanel && (
        <DetailPanel
          marker={selectedMarker}
          onClose={() => setShowDetailPanel(false)}
        />
      )}
      {showChangelog && (
        <ChangelogPanel onClose={() => setShowChangelog(false)} />
      )}
      <div className="flex flex-1 overflow-hidden app-layout relative">
        <div className="flex-1 map-panel relative">
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
              containerSize={{ width: 800, height: 600 }}
              onQuickSave={handleFloatingQuickSave}
              onMoreDetails={handleFloatingMoreDetails}
              onCancel={() => { setMapFloatingCard(null); setAddInputMode(null); }}
            />
          )}
        </div>

        <div
          className="absolute left-0 top-0 bottom-0 bg-white border-r border-gray-200 z-50 flex flex-col shadow-lg"
          style={{ width: sidebarWidth }}
        >
          <Sidebar
            mapRef={mapRef}
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
            onOpenDetail={() => setShowDetailPanel(true)}
            onShowChangelog={() => setShowChangelog(true)}
          />
        </div>

        <div
          className="absolute left-0 top-0 bottom-0 w-1 bg-gray-200 hover:bg-blue-400 cursor-col-resize transition-colors z-50"
          style={{ left: sidebarWidth }}
          onMouseDown={handleResizeStart}
        />
      </div>
    </div>
  );
}
