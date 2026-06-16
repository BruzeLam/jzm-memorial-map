// Cache fix: 2026-05-25 - Force Vercel rebuild
import React, { useState, useRef, useEffect, useMemo, Suspense, lazy } from 'react';
import { useMarkers } from './hooks/useMarkers';
import { useSearch } from './hooks/useSearch';
import { useGallery } from './hooks/useGallery';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MapView from './components/Map';
import MapFloatingCard from './components/MapFloatingCard';
import ImageViewer from './components/ImageViewer';
import OnThisDayModal from './components/OnThisDayModal';
import { getOnThisDayMarkers } from './utils/onThisDay';
import { LanguageProvider } from './i18n/LanguageContext';
import { QuotesProvider } from './context/QuotesContext';
import { ArchivesProvider } from './context/ArchivesContext';
import { useMediaQuery } from './hooks/useMediaQuery';
import { useAuth } from './context/AuthContext';
import { getBranding } from './config/branding';
import { isCloudEnabled } from './lib/cloudConfig';
import { submitMarkerForReview } from './services/submissions';
import { flyToLatLng, normalizeLng } from './utils/mapWrap';

const QuotesPanel = lazy(() => import('./components/QuotesPanel'));
const ArchivePanel = lazy(() => import('./components/ArchivePanel'));
const DetailPanel = lazy(() => import('./components/DetailPanel'));
const GalleryPanel = lazy(() => import('./components/GalleryPanel'));
const ChangeLog = lazy(() => import('./components/ChangeLog'));
const EditorLoginModal = lazy(() => import('./components/EditorLoginModal'));
const SubmissionSuccessModal = lazy(() => import('./components/SubmissionSuccessModal'));
const AgentPanel = lazy(() => import('./components/AgentPanel'));

function ModalFallback() {
  return null;
}

export default function App() {
  const { isEditor, user } = useAuth();
  const branding = getBranding();
  const isContributor = Boolean(user && isCloudEnabled() && !isEditor);

  useEffect(() => {
    document.title = branding.siteTitle;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', branding.siteDescription);
  }, [branding.siteTitle, branding.siteDescription]);
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
    readOnly: dataReadOnly,
  } = useMarkers({ isEditor: isEditor });

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

  const [showQuotes, setShowQuotes] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [viewingImageIndex, setViewingImageIndex] = useState(null);
  const [showGallery, setShowGallery] = useState(false);
  const [showChangeLog, setShowChangeLog] = useState(false);
  const [showAgent, setShowAgent] = useState(false);

  const {
    gallery,
    addImage,
    syncImagesFromMarker,
    updateImage,
    deleteImage,
    removeMarkerRelation,
    readOnly: galleryReadOnly,
    reloadGallery,
  } = useGallery(markers, {
    isEditor: isEditor,
    cloudFetchEnabled: showGallery || isEditor,
  });

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

  const [showOnThisDayModal, setShowOnThisDayModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showEditorLogin, setShowEditorLogin] = useState(false);
  const [showSubmissionSuccess, setShowSubmissionSuccess] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
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
        flyToLatLng(
          mapRef.current,
          firstResult.latitude,
          firstResult.longitude,
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
      flyToLatLng(map, marker.latitude, marker.longitude, constrainedZoom, {
        duration: 0.8,
        easeLinearity: 0.5, // 使动画更流畅
      });
    }
  };

  const handleMapClick = (latlng) => {
    if (mapPickForForm) {
      setMapPickCoords({ lat: latlng.lat, lng: normalizeLng(latlng.lng) });
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
      setMapFloatingCard({ coords: { lat: latlng.lat, lng: normalizeLng(latlng.lng) }, pixelPos });
      setIsAddingMode(false);
    } else {
      // Legacy single-mode (shouldn't be reached in new flow, but kept for safety)
      setPendingCoords({ lat: latlng.lat, lng: normalizeLng(latlng.lng) });
      setShowAddForm(true);
      setIsAddingMode(false);
    }
  };

  const finishAddFlow = () => {
    setShowAddForm(false);
    setPendingCoords(null);
    setEditingMarker(null);
    setFormPrefill(null);
    setIsAddingMode(false);
    setAddInputMode(null);
    setShowModePicker(false);
    setMapFloatingCard(null);
    setMapPickForForm(false);
    setMapPickCoords(null);
  };

  const handleAddMarker = async (data) => {
    if (isContributor) {
      try {
        await submitMarkerForReview(data);
        finishAddFlow();
        setShowSubmissionSuccess(true);
      } catch (err) {
        window.alert(err.message || '提交失败，请稍后重试');
      }
      return;
    }

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
  const handleFloatingQuickSave = async (data) => {
    if (isContributor) {
      try {
        await submitMarkerForReview(data);
        handleCloseFloatingCard();
        setShowSubmissionSuccess(true);
      } catch (err) {
        window.alert(err.message || '提交失败，请稍后重试');
      }
      return;
    }

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

  const handleAddWhenReadOnly = () => {
    if (isEditor || isContributor) {
      handleStartAddMode();
      return;
    }
    setShowEditorLogin(true);
  };

  const sidebarProps = {
    mapRef,
    markers,
    filteredMarkers,
    selectedMarkerId,
    selectedMarker,
    stats,
    searchQuery,
    setSearchQuery,
    activeFilters,
    toggleFilter,
    clearSearch,
    onMarkerSelect: handleMarkerSelect,
    onEditMarker: handleEditMarker,
    onDeleteMarker: handleDeleteMarker,
    onStartAddMode: handleStartAddMode,
    isAddingMode,
    showAddForm,
    showModePicker,
    editingMarker,
    pendingCoords,
    formPrefill,
    onAddMarker: handleAddMarker,
    onUpdateMarker: handleUpdateMarker,
    onCancelAdd: handleCancelAdd,
    onPickMapMode: handlePickMapMode,
    onPickManualMode: handlePickManualMode,
    mapPickForForm,
    onToggleMapPickForForm: handleToggleMapPickForForm,
    mapPickCoords,
    onMapPickConsumed: handleMapPickConsumed,
    onResetToSample: resetToSample,
    onClearAll: clearAll,
    onOpenDetail: () => setShowDetailPanel(true),
    onViewImage: (index) => setViewingImageIndex(index),
    regionTree,
    selectedRegionKeys,
    onToggleRegion: toggleRegionKey,
    onClearRegions: clearRegionFilter,
    onThisDayActive,
    onToggleOnThisDay: toggleOnThisDay,
    dataReadOnly,
    onAddWhenReadOnly: handleAddWhenReadOnly,
    onLoginClick: () => setShowEditorLogin(true),
    onGalleryUpdated: reloadGallery,
  };

  const mobileSidebarExpanded = isMobile && (showAddForm || showModePicker);

  return (
    <LanguageProvider>
    <QuotesProvider isEditor={isEditor}>
    <ArchivesProvider isEditor={isEditor}>
    <div className="flex flex-col h-screen bg-gray-100">
      <Header
        onOpenQuotes={() => setShowQuotes(true)}
        onOpenArchive={() => setShowArchive(true)}
        onOpenGallery={() => setShowGallery(true)}
        onOpenChangeLog={() => setShowChangeLog(true)}
        onOpenAgent={() => setShowAgent(true)}
        onLoginClick={() => setShowEditorLogin(true)}
        dataReadOnly={dataReadOnly}
        onResetToSample={resetToSample}
        onClearAll={clearAll}
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
      <Suspense fallback={<ModalFallback />}>
        {showQuotes && <QuotesPanel onClose={() => setShowQuotes(false)} />}
        {showArchive && <ArchivePanel onClose={() => setShowArchive(false)} />}
        {showEditorLogin && <EditorLoginModal onClose={() => setShowEditorLogin(false)} />}
        {showSubmissionSuccess && (
          <SubmissionSuccessModal onClose={() => setShowSubmissionSuccess(false)} />
        )}
        {showChangeLog && <ChangeLog onClose={() => setShowChangeLog(false)} />}
        {showAgent && (
          <AgentPanel
            onClose={() => setShowAgent(false)}
            onNavigateMarker={handleMarkerSelect}
          />
        )}
        {showGallery && (
          <GalleryPanel
            gallery={gallery}
            markers={markers}
            onAddImage={addImage}
            onUpdateImage={updateImage}
            onDeleteImage={deleteImage}
            onClose={() => setShowGallery(false)}
            readOnly={galleryReadOnly}
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
            onLoginClick={() => setShowEditorLogin(true)}
            onGalleryUpdated={reloadGallery}
          />
        )}
      </Suspense>
      {viewingImageIndex !== null && selectedMarker?.images?.length > 0 && (
        <ImageViewer
          images={selectedMarker.images}
          initialIndex={viewingImageIndex}
          onClose={() => setViewingImageIndex(null)}
        />
      )}
      <div className={`flex-1 min-h-0 overflow-hidden ${isMobile ? 'flex flex-col' : 'relative app-layout'}`}>
        {isMobile && (
          <aside
            className={`mobile-sidebar-strip ${mobileSidebarExpanded ? 'mobile-sidebar-strip--expanded' : ''}`}
          >
            <Sidebar {...sidebarProps} compactMobile />
          </aside>
        )}

        <div className={`${isMobile ? 'flex-1 min-h-0 relative' : 'absolute inset-0'} map-panel z-0`}>
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

        {!isMobile && (
          <>
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
              <Sidebar {...sidebarProps} />
              {sidebarOpen && (
                <button
                  type="button"
                  className="sidebar-collapse-btn"
                  onClick={() => setSidebarOpen(false)}
                  aria-label="收起侧边栏"
                  title="收起侧边栏"
                >
                  ‹
                </button>
              )}
            </aside>
          </>
        )}
      </div>
    </div>
    </ArchivesProvider>
    </QuotesProvider>
    </LanguageProvider>
  );
}
