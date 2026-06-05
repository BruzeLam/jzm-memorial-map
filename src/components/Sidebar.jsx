import React, { useState, useMemo } from 'react';
import { collectAllMarkerTags } from '../utils/markerTags';
import { MarkerTagPills } from './MarkerTagInput';
import SearchBar from './SearchBar';
import FilterPanel from './FilterPanel';
import MarkerDetails from './MarkerDetails';
import AddMarkerForm from './AddMarkerForm';
import { MARKER_TYPES } from '../utils/constants';
import { exportMarkers } from '../utils/dataExport';
import RegionFilter from './RegionFilter';
import { useI18n } from '../i18n/LanguageContext';
import { formatOnThisDayLabel } from '../utils/onThisDay';

export default function Sidebar({
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
  onMarkerSelect,
  onEditMarker,
  onDeleteMarker,
  onStartAddMode,
  isAddingMode,
  showAddForm,
  showModePicker,
  editingMarker,
  pendingCoords,
  formPrefill,
  onAddMarker,
  onUpdateMarker,
  onCancelAdd,
  onPickMapMode,
  onPickManualMode,
  mapPickForForm,
  onToggleMapPickForForm,
  mapPickCoords,
  onMapPickConsumed,
  onResetToSample,
  onClearAll,
  onOpenDetail,
  onViewImage,
  regionTree,
  selectedRegionKeys,
  onToggleRegion,
  onClearRegions,
  onThisDayActive,
  onToggleOnThisDay,
  compactMobile = false,
}) {
  const { t, locale, setLocale, markerTypeLabel, localeOptions } = useI18n();
  const onThisDayLabel = formatOnThisDayLabel(new Date(), locale);
  const allMarkerTags = useMemo(() => collectAllMarkerTags(markers), [markers]);
  const [showSettings, setShowSettings] = useState(false);
  const [showLanguageDrawer, setShowLanguageDrawer] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [sortOrder, setSortOrder] = useState('date-asc');

  const handleExport = (format) => {
    exportMarkers(markers, format);
    setShowExportMenu(false);
  };

  const sortedMarkers = [...filteredMarkers].sort((a, b) => {
    const dateA = a.date || '';
    const dateB = b.date || '';

    // 时间为空的排最后
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;

    if (sortOrder === 'date-asc') {
      return dateA.localeCompare(dateB);
    } else {
      return dateB.localeCompare(dateA);
    }
  });

  // Determine what the add button shows
  const inActiveAddFlow = isAddingMode || showAddForm || showModePicker;

  const markerListContent = showModePicker ? (
    /* ── Mode Picker ─────────────────────────────────────── */
    <div className={compactMobile ? 'p-2' : 'p-4'}>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">{t('sidebar.chooseAddMode')}</span>
          <button
            type="button"
            onClick={onCancelAdd}
            className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600"
            aria-label={t('sidebar.cancel')}
          >
            ✕
          </button>
        </div>
        <div className="p-3 flex flex-col gap-2">
          <button
            type="button"
            onClick={onPickMapMode}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 transition-colors text-left"
          >
            <span className="text-2xl">🗺️</span>
            <div>
              <div className="text-sm font-semibold text-blue-700">{t('sidebar.mapPick')}</div>
              <div className="text-xs text-blue-500 mt-0.5">{t('sidebar.mapPickHint')}</div>
            </div>
          </button>
          <button
            type="button"
            onClick={onPickManualMode}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-400 transition-colors text-left"
          >
            <span className="text-2xl">✏️</span>
            <div>
              <div className="text-sm font-semibold text-gray-700">{t('sidebar.manualInput')}</div>
              <div className="text-xs text-gray-500 mt-0.5">{t('sidebar.manualInputHint')}</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  ) : showAddForm ? (
    /* ── Add / Edit Form ─────────────────────────────────── */
    <div className="p-2">
      <AddMarkerForm
        mapRef={mapRef}
        onSubmit={editingMarker ? onUpdateMarker : onAddMarker}
        onCancel={onCancelAdd}
        initialCoords={pendingCoords}
        editingMarker={editingMarker}
        prefillData={formPrefill}
        allMarkerTags={allMarkerTags}
        markers={markers}
        mapPickForForm={mapPickForForm}
        onToggleMapPickForForm={onToggleMapPickForForm}
        mapPickCoords={mapPickCoords}
        onMapPickConsumed={onMapPickConsumed}
      />
    </div>
  ) : selectedMarker ? (
    /* ── Marker Details ──────────────────────────────────── */
    <div className="p-2">
      <MarkerDetails
        marker={selectedMarker}
        markers={markers}
        onEdit={onEditMarker}
        onDelete={onDeleteMarker}
        onClose={() => onMarkerSelect(selectedMarkerId)}
        onOpenDetail={onOpenDetail}
        onViewImage={onViewImage}
        onTagSearch={(tag) => setSearchQuery(`#${tag}`)}
        onSelectMarker={onMarkerSelect}
      />
    </div>
  ) : (
    /* ── Marker List ─────────────────────────────────────── */
    <ul className="py-0.5">
      {sortedMarkers.length === 0 ? (
        <li className="px-3 py-4 text-center">
          <div className="text-sm text-gray-400 mb-2">
            {onThisDayActive
              ? t('sidebar.noMarkersOnThisDay', { date: onThisDayLabel })
              : t('sidebar.noMarkers')}
          </div>
          <button
            type="button"
            onClick={onStartAddMode}
            className="text-sm text-blue-500 hover:text-blue-700 underline transition-colors py-2"
          >
            {onThisDayActive
              ? t('sidebar.addMarkerOnThisDay')
              : t('sidebar.addMarker')}
          </button>
        </li>
      ) : (
        sortedMarkers.map((m) => {
          const typeInfo = MARKER_TYPES[m.type] || MARKER_TYPES.spot;
          const isActive = m.id === selectedMarkerId;
          return (
            <li key={m.id}>
              <button
                type="button"
                className={`marker-list-item w-full text-left px-3 py-3 md:py-2.5 border-l-2 min-h-[48px] ${
                  isActive ? 'active' : 'border-transparent'
                }`}
                onClick={() => onMarkerSelect(m.id)}
              >
                <div className="flex items-start gap-2">
                  <span
                    className="w-7 h-7 md:w-6 md:h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: typeInfo.color }}
                  >
                    {typeInfo.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-gray-800 truncate">{m.name}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2 flex-wrap">
                      <span
                        className="px-1.5 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: typeInfo.color, fontSize: 10 }}
                      >
                        {markerTypeLabel(m.type)}
                      </span>
                      {m.date && <span>{m.date}{m.endDate ? ` — ${m.endDate}` : ''}</span>}
                    </div>
                    {m.title && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{m.title}</p>
                    )}
                    {m.tags?.length > 0 && (
                      <MarkerTagPills
                        tags={m.tags}
                        onTagClick={(tag) => setSearchQuery(`#${tag}`)}
                        className="mt-1"
                      />
                    )}
                  </div>
                </div>
              </button>
            </li>
          );
        })
      )}
    </ul>
  );

  if (compactMobile) {
    return (
      <div className="sidebar-panel flex flex-col bg-white h-full min-h-0">
        <div className="px-2 pt-2 pb-1.5 border-b border-gray-100 flex-shrink-0">
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            clearSearch={clearSearch}
            compact
          />
        </div>

        <div className="px-2 py-1 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-1">
            <div className="flex gap-1 flex-shrink-0">
              {Object.entries(MARKER_TYPES).map(([key, typeInfo]) => {
                const count = stats[key] || 0;
                const active = activeFilters[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleFilter(key)}
                    title={markerTypeLabel(key)}
                    aria-label={`${markerTypeLabel(key)} ${count}`}
                    aria-pressed={active}
                    className={`relative flex items-center justify-center w-9 h-9 rounded-lg text-sm border transition-colors ${
                      active
                        ? 'text-white border-transparent'
                        : 'bg-gray-50 border-gray-200 text-gray-700'
                    }`}
                    style={active ? { backgroundColor: typeInfo.color, borderColor: typeInfo.color } : {}}
                  >
                    <span>{typeInfo.icon}</span>
                    <span
                      className={`absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 rounded-full text-[9px] font-bold leading-[14px] text-center ${
                        active ? 'bg-white text-gray-800' : 'bg-gray-600 text-white'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex-1 min-w-0">
              <RegionFilter
                selectedRegionKeys={selectedRegionKeys}
                regionTree={regionTree}
                onToggleRegion={onToggleRegion}
                onClearRegions={onClearRegions}
              />
            </div>

            <button
              type="button"
              onClick={onToggleOnThisDay}
              title={t('sidebar.onThisDay', { date: onThisDayLabel })}
              aria-label={t('sidebar.onThisDay', { date: onThisDayLabel })}
              className={`flex-shrink-0 w-9 h-9 text-sm rounded-lg border transition-colors flex items-center justify-center ${
                onThisDayActive
                  ? 'bg-amber-50 border-amber-400 text-amber-900'
                  : 'bg-gray-50 border-gray-200 text-gray-600'
              }`}
            >
              📜
            </button>
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'date-asc' ? 'date-desc' : 'date-asc')}
              className="flex-shrink-0 w-9 h-9 text-xs rounded-lg bg-gray-50 text-gray-600 border border-gray-200 font-medium flex items-center justify-center"
              title={t('sidebar.sortTime')}
              aria-label={t('sidebar.sortTime')}
            >
              {sortOrder === 'date-asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain sidebar-scrollable">
          {markerListContent}
        </div>

        <div className="px-2 py-1.5 border-t border-gray-100 flex gap-1.5 flex-shrink-0 bg-white">
          <button
            type="button"
            onClick={inActiveAddFlow ? onCancelAdd : onStartAddMode}
            className={`flex-1 text-xs py-2.5 rounded-lg font-medium transition-colors min-h-[44px] ${
              inActiveAddFlow
                ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {inActiveAddFlow ? `✕ ${t('sidebar.cancel')}` : `➕ ${t('sidebar.addNewMarker')}`}
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="min-h-[44px] min-w-[44px] text-xs rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors flex items-center justify-center"
              aria-label={t('sidebar.export')}
            >
              ⬇️
            </button>
            {showExportMenu && (
              <div className="absolute bottom-full mb-1 right-0 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-10">
                {['json', 'csv', 'geojson'].map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => handleExport(fmt)}
                    className="block w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 uppercase"
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowSettings(!showSettings);
                if (showSettings) setShowLanguageDrawer(false);
              }}
              className="min-h-[44px] min-w-[44px] text-xs rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors flex items-center justify-center"
              aria-label={t('sidebar.languageLabel')}
            >
              ⚙️
            </button>
            {showSettings && (
              <div className="absolute bottom-full mb-1 right-0 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-10 w-48">
                <button
                  type="button"
                  onClick={() => setShowLanguageDrawer((v) => !v)}
                  className="flex w-full items-center justify-between px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 border-b border-gray-100"
                >
                  <span>🌐 {t('sidebar.languageLabel')}</span>
                  <span className="text-gray-400">{showLanguageDrawer ? '▲' : '▼'}</span>
                </button>
                {showLanguageDrawer && (
                  <div className="max-h-52 overflow-y-auto border-b border-gray-100 bg-gray-50/80">
                    {localeOptions.map((opt) => (
                      <button
                        key={opt.code}
                        type="button"
                        onClick={() => setLocale(opt.code)}
                        className={`flex w-full items-center justify-between px-4 py-2 text-xs text-left hover:bg-white ${
                          locale === opt.code
                            ? 'text-blue-700 font-semibold bg-blue-50/80'
                            : 'text-gray-700'
                        }`}
                      >
                        <span>{opt.native}</span>
                        {locale === opt.code && <span className="text-blue-600">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => { onResetToSample(); setShowSettings(false); setShowLanguageDrawer(false); }}
                  className="block w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
                >
                  🔄 {t('sidebar.restoreSample')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(t('sidebar.confirmClearAll'))) {
                      onClearAll();
                      setShowSettings(false);
                      setShowLanguageDrawer(false);
                    }
                  }}
                  className="block w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-50"
                >
                  🗑️ {t('sidebar.clearAll')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="sidebar-panel flex flex-col bg-white border-r border-gray-200 flex-shrink-0 h-full"
    >
      <div className="px-3 pt-3 pb-2 border-b border-gray-100">
        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          clearSearch={clearSearch}
        />
      </div>

      <div className="px-3 py-2 border-b border-gray-100">
        <FilterPanel activeFilters={activeFilters} toggleFilter={toggleFilter} stats={stats} />
      </div>

      <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <span>{t('sidebar.totalMarkers', { total: stats.total })}</span>
        {filteredMarkers.length !== stats.total && (
          <span>{t('sidebar.showingMarkers', { count: filteredMarkers.length })}</span>
        )}
      </div>

      <div className="px-3 py-2 border-b border-gray-100 grid grid-cols-3 gap-2">
        <RegionFilter
          selectedRegionKeys={selectedRegionKeys}
          regionTree={regionTree}
          onToggleRegion={onToggleRegion}
          onClearRegions={onClearRegions}
        />
        <button
          type="button"
          onClick={onToggleOnThisDay}
          title={t('sidebar.onThisDay', { date: onThisDayLabel })}
          className={`min-w-0 text-xs py-1.5 px-1.5 rounded border transition-colors font-medium flex items-center justify-center gap-0.5 ${
            onThisDayActive
              ? 'bg-amber-50 border-amber-400 text-amber-900'
              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-amber-50 hover:text-amber-800'
          }`}
        >
          <span className="flex-shrink-0">📜</span>
          <span className="truncate">{t('sidebar.onThisDay', { date: onThisDayLabel })}</span>
        </button>
        <button
          type="button"
          onClick={() => setSortOrder(sortOrder === 'date-asc' ? 'date-desc' : 'date-asc')}
          className="min-w-0 text-xs py-1.5 px-2 rounded bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors font-medium flex items-center justify-center gap-1 border border-gray-200"
        >
          📅 {t('sidebar.sortTime')} {sortOrder === 'date-asc' ? '↑' : '↓'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto sidebar-scrollable">
        {markerListContent}
      </div>

      <div className="px-3 py-2 border-t border-gray-100 flex gap-1.5">
        <button
          onClick={inActiveAddFlow ? onCancelAdd : onStartAddMode}
          className={`flex-1 text-xs py-2 rounded-lg font-medium transition-colors ${
            inActiveAddFlow
              ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {inActiveAddFlow ? `✕ ${t('sidebar.cancel')}` : `➕ ${t('sidebar.addNewMarker')}`}
        </button>

        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="text-xs py-2 px-3 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
          >
            ⬇️ {t('sidebar.export')}
          </button>
          {showExportMenu && (
            <div className="absolute bottom-full mb-1 right-0 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-10">
              {['json', 'csv', 'geojson'].map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => handleExport(fmt)}
                  className="block w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 uppercase"
                >
                  {fmt}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setShowSettings(!showSettings);
              if (showSettings) setShowLanguageDrawer(false);
            }}
            className="text-xs py-2 px-3 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
          >
            ⚙️
          </button>
          {showSettings && (
            <div className="absolute bottom-full mb-1 right-0 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-10 w-48">
              <button
                type="button"
                onClick={() => setShowLanguageDrawer((v) => !v)}
                className="flex w-full items-center justify-between px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 border-b border-gray-100"
              >
                <span>🌐 {t('sidebar.languageLabel')}</span>
                <span className="text-gray-400">{showLanguageDrawer ? '▲' : '▼'}</span>
              </button>
              {showLanguageDrawer && (
                <div className="max-h-52 overflow-y-auto border-b border-gray-100 bg-gray-50/80">
                  {localeOptions.map((opt) => (
                    <button
                      key={opt.code}
                      type="button"
                      onClick={() => setLocale(opt.code)}
                      className={`flex w-full items-center justify-between px-4 py-2 text-xs text-left hover:bg-white ${
                        locale === opt.code
                          ? 'text-blue-700 font-semibold bg-blue-50/80'
                          : 'text-gray-700'
                      }`}
                    >
                      <span>{opt.native}</span>
                      {locale === opt.code && <span className="text-blue-600">✓</span>}
                    </button>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => { onResetToSample(); setShowSettings(false); setShowLanguageDrawer(false); }}
                className="block w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
              >
                🔄 {t('sidebar.restoreSample')}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(t('sidebar.confirmClearAll'))) {
                    onClearAll();
                    setShowSettings(false);
                    setShowLanguageDrawer(false);
                  }
                }}
                className="block w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-50"
              >
                🗑️ {t('sidebar.clearAll')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
