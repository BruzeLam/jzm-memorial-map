// Cache fix: 2026-05-25 - Force Vercel rebuild
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useMarkers } from './hooks/useMarkers';
import { useSearch } from './hooks/useSearch';
import { useGallery } from './hooks/useGallery';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MapView from './components/Map';
import MapFloatingCard from './components/MapFloatingCard';
import QuotesPanel from './components/QuotesPanel';
import ArchivePanel from './components/ArchivePanel';
import DetailPanel from './components/DetailPanel';
import ImageViewer from './components/ImageViewer';
import GalleryPanel from './components/GalleryPanel';
import ChangeLog from './components/ChangeLog';
import OnThisDayModal from './components/OnThisDayModal';
import { getOnThisDayMarkers } from './utils/onThisDay';
import { LanguageProvider } from './i18n/LanguageContext';

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

  const {
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
  } = useSearch(markers);

  const {
    gallery,
    addImage,
    syncImagesFromMarker,
    updateImage,
    deleteImage,
    removeMarkerRelation,
  } = useGallery(markers);

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
  /** 侧边栏表单开启时，点击地图更新经纬度（添加/编辑均可） */
  const [mapPickForForm, setMapPickForForm] = useState(false);
  const [mapPickCoords, setMapPickCoords] = useState(null);

  const [showQuotes, setShowQuotes] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [viewingImageIndex, setViewingImageIndex] = useState(null);
  const [showGallery, setShowGallery] = useState(false);
  const [showChangeLog, setShowChangeLog] = useState(false);
  const [showOnThisDayModal, setShowOnThisDayModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches) {
      return false;
    }
    return true;
  });
  const [mapContainerSize, setMapContainerSize] = useState({ width: 800, height: 600 });

  const todayMarkers = useMemo(() => getOnThisDayMarkers(markers), [markers]);

  const mapRef = useRef(null);

  useEffect(() => {
    if (todayMarkers.length > 0) {
      setShowOnThisDayModal(true);
    }
  }, [todayMarkers.length]);

  // 更新地图容器大小
  useEffect(() => {
    const updateMapSize = () => {
      if (mapRef.current && mapRef.current.getContainer) {
        const container = mapRef.current.getContainer();
        if (container) {
          setMapContainerSize({
            width: container.offsetWidth,
            height: container.offsetHeight,
          });
        }
      }
    };

    // 初始化
    updateMapSize();

    // 监听窗口大小变化
    window.addEventListener('resize', updateMapSize);
    return () => window.removeEventListener('resize', updateMapSize);
  }, []);

  // 浮窗卡出现时更新容器大小（确保位置计算准确）
  useEffect(() => {
    if (mapFloatingCard && mapRef.current && mapRef.current.getContainer) {
      const container = mapRef.current.getContainer();
      if (container) {
        setMapContainerSize({
          width: container.offsetWidth,
          height: container.offsetHeight,
        });
      }
    }
  }, [mapFloatingCard]);

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

  const handleMarkerSelect = (id) => {
    // 编辑中点击其他标点：视为暂停编辑，切换到新标点详情
    if (showAddForm && editingMarker && editingMarker.id !== id) {
      setShowAddForm(false);
      setEditingMarker(null);
      setFormPrefill(null);
      setPendingCoords(null);
    }

    selectMarker(id);
    const marker = markers.find((m) => m.id === id);
    if (marker && mapRef.current) {
      const map = mapRef.current;
      const currentZoom = map.getZoom();
      // 计算目标缩放级别：如果已经足够近，保持不变；否则缩放到 10-12 范围
      const targetZoom = Math.max(currentZoom, 10);
      const constrainedZoom = Math.min(targetZoom, 12);
      map.flyTo([marker.latitude, marker.longitude], constrainedZoom, {
        duration: 0.8,
        easeLinearity: 0.5, // 使动画更流畅
      });
    }
  };

  const handleMapClick = (latlng) => {
    if (mapPickForForm) {
      setMapPickCoords({ lat: latlng.lat, lng: latlng.lng });
      setMapPickForForm(false);
      return;
    }

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
    // 地点 → 影像馆（单向同步）
    if (data.images?.length > 0) {
      syncImagesFromMarker(newId, data.name, data.images, {
        country: data.country,
        province: data.province,
        city: data.city,
        latitude: data.latitude,
        longitude: data.longitude,
      });
    }
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
    // 地点 → 影像馆：补全尚未入库的图片（按数据去重）
    if (data.images?.length > 0) {
      syncImagesFromMarker(editingMarker.id, data.name, data.images, {
        country: data.country,
        province: data.province,
        city: data.city,
        latitude: data.latitude,
        longitude: data.longitude,
      });
    }
    setShowAddForm(false);
    setEditingMarker(null);
  };

  const handleDeleteMarker = (id) => {
    if (window.confirm('确定要删除这个标记吗？')) {
      deleteMarker(id);
      removeMarkerRelation(id);
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
    setMapPickForForm(false);
    setMapPickCoords(null);
  };

  const handleToggleMapPickForForm = () => {
    setMapPickForForm((prev) => !prev);
    setMapFloatingCard(null);
    setIsAddingMode(false);
  };

  const handleMapPickConsumed = () => {
    setMapPickCoords(null);
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

  // Floating card: 关闭时缩放回去一点，方便查看周边标点
  const handleCloseFloatingCard = () => {
    setMapFloatingCard(null);
    setAddInputMode(null);
    if (mapRef.current) {
      const map = mapRef.current;
      const currentZoom = map.getZoom();
      // 缩小 2 级，但不低于 7（确保还能看到周边内容）
      const newZoom = Math.max(currentZoom - 2, 7);
      map.flyTo(map.getCenter(), newZoom, {
        duration: 0.6,
        easeLinearity: 0.5,
      });
    }
  };


  return (
    <LanguageProvider>
    <div className="flex flex-col h-screen bg-gray-100">
      <Header
        onOpenQuotes={() => setShowQuotes(true)}
        onOpenArchive={() => setShowArchive(true)}
        onOpenGallery={() => setShowGallery(true)}
        onOpenChangeLog={() => setShowChangeLog(true)}
      />
      {showOnThisDayModal && todayMarkers.length > 0 && (
        <OnThisDayModal
          markers={todayMarkers}
          onClose={() => setShowOnThisDayModal(false)}
          onViewOnMap={() => {
            if (!onThisDayActive) toggleOnThisDay();
          }}
          onSelectMarker={handleMarkerSelect}
        />
      )}
      {showQuotes && <QuotesPanel onClose={() => setShowQuotes(false)} />}
      {showArchive && <ArchivePanel onClose={() => setShowArchive(false)} />}
      {showChangeLog && <ChangeLog onClose={() => setShowChangeLog(false)} />}
      {showGallery && (
        <GalleryPanel
          gallery={gallery}
          markers={markers}
          onAddImage={addImage}
          onUpdateImage={updateImage}
          onDeleteImage={deleteImage}
          onClose={() => setShowGallery(false)}
        />
      )}
      {showDetailPanel && (
        <DetailPanel
          marker={selectedMarker}
          markers={markers}
          onClose={() => setShowDetailPanel(false)}
          onSelectMarker={(id) => {
            selectMarker(id);
            setShowDetailPanel(true);
          }}
          onTagSearch={(tag) => setSearchQuery(`#${tag}`)}
        />
      )}
      {viewingImageIndex !== null && selectedMarker?.images?.length > 0 && (
        <ImageViewer
          images={selectedMarker.images}
          initialIndex={viewingImageIndex}
          onClose={() => setViewingImageIndex(null)}
        />
      )}
      <div className="relative flex-1 overflow-hidden app-layout">
        <div className="absolute inset-0 map-panel z-0">
          {(isAddingMode || mapPickForForm) && (
            <div
              className={`absolute top-4 left-1/2 -translate-x-1/2 z-[1000] text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium pointer-events-none ${
                mapPickForForm ? 'bg-orange-600' : 'bg-blue-600'
              }`}
            >
              {mapPickForForm ? '点击地图更新标点位置' : '点击地图选择位置'}
            </div>
          )}
          <MapView
            mapRef={mapRef}
            markers={filteredMarkers}
            allMarkers={markers}
            selectedMarker={selectedMarker}
            selectedMarkerId={selectedMarkerId}
            onMarkerSelect={handleMarkerSelect}
            onMapClick={handleMapClick}
            isMapInteractive={isAddingMode || mapPickForForm}
          />
          {mapFloatingCard && (
            <MapFloatingCard
              coords={mapFloatingCard.coords}
              pixelPos={mapFloatingCard.pixelPos}
              containerSize={mapContainerSize}
              onQuickSave={handleFloatingQuickSave}
              onMoreDetails={handleFloatingMoreDetails}
              onCancel={handleCloseFloatingCard}
            />
          )}
        </div>

        {sidebarOpen && (
          <button
            type="button"
            className="sidebar-backdrop md:hidden"
            aria-hidden
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {!sidebarOpen && (
          <button
            type="button"
            className="sidebar-expand-tab"
            onClick={() => setSidebarOpen(true)}
            aria-label="展开侧边栏"
            title="展开侧边栏"
          >
            <span aria-hidden>›</span>
          </button>
        )}

        <aside
          className={`sidebar-overlay ${sidebarOpen ? 'sidebar-overlay--open' : 'sidebar-overlay--closed'}`}
          aria-hidden={!sidebarOpen}
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
            mapPickForForm={mapPickForForm}
            onToggleMapPickForForm={handleToggleMapPickForForm}
            mapPickCoords={mapPickCoords}
            onMapPickConsumed={handleMapPickConsumed}
            onResetToSample={resetToSample}
            onClearAll={clearAll}
            onOpenDetail={() => setShowDetailPanel(true)}
            onViewImage={(index) => setViewingImageIndex(index)}
            regionTree={regionTree}
            selectedRegionKeys={selectedRegionKeys}
            onToggleRegion={toggleRegionKey}
            onClearRegions={clearRegionFilter}
            onThisDayActive={onThisDayActive}
            onToggleOnThisDay={toggleOnThisDay}
          />
          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="收起侧边栏"
            title="收起侧边栏"
          >
            ‹
          </button>
        </aside>
      </div>
    </div>
    </LanguageProvider>
  );
}
