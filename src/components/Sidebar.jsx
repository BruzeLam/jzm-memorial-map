import React, { useState, useMemo, useRef, useEffect } from 'react';
import { collectAllMarkerTags } from '../utils/markerTags';
import { MarkerTagPills } from './MarkerTagInput';
import SidebarSearch from './SidebarSearch';
import AgentChatInline from './AgentChatInline';
import { useAgentChat } from '../hooks/useAgentChat';
import FilterPanel from './FilterPanel';
import RegionFilter from './RegionFilter';
import MarkerDetails from './MarkerDetails';
import AddMarkerForm from './AddMarkerForm';
import { MARKER_TYPES } from '../utils/constants';
import { exportMarkers } from '../utils/dataExport';
import { useI18n } from '../i18n/LanguageContext';
import { formatOnThisDayLabel } from '../utils/onThisDay';
import { compareMarkerDates } from '../utils/markerDates';

function MobileScrollList({ children, scrollHint, listKey }) {
  const scrollRef = useRef(null);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const updateHint = () => {
      const canScroll = el.scrollHeight > el.clientHeight + 4;
      const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 12;
      setShowHint(canScroll && !nearBottom);
    };

    updateHint();
    const ro = new ResizeObserver(updateHint);
    ro.observe(el);
    el.addEventListener('scroll', updateHint, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener('scroll', updateHint);
    };
  }, [children, listKey]);

  return (
    <div className="mobile-list-scroll-wrap">
      <div ref={scrollRef} className="mobile-list-scroll sidebar-scrollable">
        {children}
      </div>
      {showHint && (
        <div className="mobile-scroll-hint" aria-hidden>
          <span>{scrollHint}</span>
        </div>
      )}
    </div>
  );
}

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
  dataReadOnly = false,
  onAddWhenReadOnly,
  onLoginClick,
  onGalleryUpdated,
}) {
  const { t, locale, markerTypeLabel } = useI18n();
  const { messages: agentMessages, loading: agentLoading, error: agentError, sendMessage, clearChat, setError: setAgentError } = useAgentChat();
  const [inputMode, setInputMode] = useState('search');
  const [agentDraft, setAgentDraft] = useState('');
  const onThisDayLabel = formatOnThisDayLabel(new Date(), locale);
  const allMarkerTags = useMemo(() => collectAllMarkerTags(markers), [markers]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [sortOrder, setSortOrder] = useState('date-asc');

  const handleExport = (format) => {
    exportMarkers(markers, format);
    setShowExportMenu(false);
  };

  const sortedMarkers = [...filteredMarkers].sort((a, b) => {
    const cmp = compareMarkerDates(a.date, b.date);
    return sortOrder === 'date-asc' ? cmp : -cmp;
  });

  // Determine what the add button shows
  const inActiveAddFlow = isAddingMode || showAddForm || showModePicker;

  const handleAddButtonClick = () => {
    if (inActiveAddFlow) {
      onCancelAdd();
      return;
    }
    if (dataReadOnly) {
      onAddWhenReadOnly?.();
      return;
    }
    onStartAddMode();
  };

  const handleAgentSubmit = async () => {
    const ok = await sendMessage(agentDraft);
    if (ok) setAgentDraft('');
  };

  const handleAgentSuggestion = async (q) => {
    setAgentError(null);
    setAgentDraft('');
    await sendMessage(q);
  };

  const handleNavigateFromAgent = (id) => {
    onMarkerSelect(id);
    setInputMode('search');
  };

  const searchBlockProps = {
    mode: inputMode,
    onModeChange: setInputMode,
    searchQuery,
    setSearchQuery,
    clearSearch,
    agentDraft,
    setAgentDraft,
    onAgentSubmit: handleAgentSubmit,
    agentLoading,
    onClearAgentChat: clearChat,
    hasAgentMessages: agentMessages.length > 0,
  };

  const showAgentChat =
    inputMode === 'agent' && !showModePicker && !showAddForm && !selectedMarkerId;

  const markerDetailsProps = selectedMarker
    ? {
        marker: selectedMarker,
        markers,
        onEdit: dataReadOnly ? undefined : onEditMarker,
        onDelete: dataReadOnly ? undefined : onDeleteMarker,
        onClose: () => onMarkerSelect(selectedMarkerId),
        onOpenDetail,
        onViewImage,
        onTagSearch: (tag) => setSearchQuery(`#${tag}`),
        onSelectMarker: onMarkerSelect,
        onLoginClick,
        onGalleryUpdated,
      }
    : null;

  const renderMarkerList = () => (
    <ul className="py-0.5">
      {sortedMarkers.length === 0 ? (
        <li className="memorial-empty-state">
          <span className="memorial-empty-icon" aria-hidden>🗺️</span>
          <div className="text-sm text-memorial-muted mb-2">
            {onThisDayActive
              ? t('sidebar.noMarkersOnThisDay', { date: onThisDayLabel })
              : t('sidebar.noMarkers')}
          </div>
          <button
            type="button"
            onClick={onStartAddMode}
            className="memorial-btn-secondary text-sm px-3 py-1.5 inline-flex"
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
          const showInlineDetail = isActive && selectedMarker && !compactMobile;
          return (
            <li key={m.id} className={isActive ? 'marker-accordion-item marker-accordion-item--open' : 'marker-accordion-item'}>
              <button
                type="button"
                data-marker-type={m.type}
                className={`marker-list-item w-full text-left px-2.5 md:px-3 border-l-2 ${
                  compactMobile ? 'py-2 min-h-[42px]' : 'py-3 md:py-2.5 min-h-[48px]'
                } ${isActive ? 'active' : 'border-transparent'}`}
                onClick={() => onMarkerSelect(m.id)}
              >
                {compactMobile ? (
                  <div className="flex items-center gap-2">
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                      style={{ backgroundColor: typeInfo.color }}
                    >
                      {typeInfo.icon}
                    </span>
                    <span className="flex-1 min-w-0 text-sm font-medium font-memorial text-memorial-ink truncate">{m.name}</span>
                    {m.date && (
                      <span className="text-[10px] text-memorial-muted flex-shrink-0 tabular-nums">
                        {m.date}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <span
                      className="w-7 h-7 md:w-6 md:h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: typeInfo.color }}
                    >
                      {typeInfo.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium font-memorial text-memorial-ink truncate">{m.name}</span>
                      </div>
                      <div className="text-xs text-memorial-muted mt-0.5 flex items-center gap-2 flex-wrap">
                        <span
                          className="px-1.5 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: typeInfo.color, fontSize: 10 }}
                        >
                          {markerTypeLabel(m.type)}
                        </span>
                        {m.date && <span>{m.date}{m.endDate ? ` — ${m.endDate}` : ''}</span>}
                      </div>
                      {m.title && (
                        <p className="text-xs text-memorial-muted mt-0.5 truncate">{m.title}</p>
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
                )}
              </button>
              {showInlineDetail && (
                <div className="marker-accordion-panel px-2 pb-2">
                  <MarkerDetails {...markerDetailsProps} />
                </div>
              )}
            </li>
          );
        })
      )}
    </ul>
  );

  const showMobileDetailSheet =
    compactMobile && selectedMarker && !showModePicker && !showAddForm;

  const agentChatPanel = (
    <AgentChatInline
      messages={agentMessages}
      loading={agentLoading}
      error={agentError}
      onSuggestion={handleAgentSuggestion}
      onNavigateMarker={handleNavigateFromAgent}
      compact={compactMobile}
    />
  );

  const sidebarViewKey = showModePicker ? 'picker' : showAddForm ? 'form' : 'list';

  const markerListContent = (
    <div key={sidebarViewKey} className="sidebar-panel-view">
      {showModePicker ? (
    /* ── Mode Picker ─────────────────────────────────────── */
    <div className={compactMobile ? 'p-2' : 'p-4'}>
      <div className="memorial-card">
        <div className="px-4 py-3 bg-memorial-cream-dark border-b border-memorial-border flex items-center justify-between">
          <span className="text-sm font-semibold font-memorial text-memorial-navy">{t('sidebar.chooseAddMode')}</span>
          <button
            type="button"
            onClick={onCancelAdd}
            className="w-10 h-10 flex items-center justify-center text-memorial-muted hover:text-memorial-ink"
            aria-label={t('sidebar.cancel')}
          >
            ✕
          </button>
        </div>
        <div className="p-3 flex flex-col gap-2">
          <button
            type="button"
            onClick={onPickMapMode}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 border-memorial-gold/60 bg-memorial-cream hover:bg-memorial-cream-dark hover:border-memorial-gold transition-colors text-left"
          >
            <span className="text-2xl">🗺️</span>
            <div>
              <div className="text-sm font-semibold font-memorial text-memorial-navy">{t('sidebar.mapPick')}</div>
              <div className="text-xs text-memorial-muted mt-0.5">{t('sidebar.mapPickHint')}</div>
            </div>
          </button>
          <button
            type="button"
            onClick={onPickManualMode}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 border-memorial-border bg-memorial-surface hover:bg-memorial-cream hover:border-memorial-gold/70 transition-colors text-left"
          >
            <span className="text-2xl">✏️</span>
            <div>
              <div className="text-sm font-semibold text-memorial-ink">{t('sidebar.manualInput')}</div>
              <div className="text-xs text-memorial-muted mt-0.5">{t('sidebar.manualInputHint')}</div>
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
  ) : (
    renderMarkerList()
  )}
    </div>
  );

  if (compactMobile) {
    return (
      <div className="sidebar-panel flex flex-col bg-memorial-cream h-full min-h-0">
        <div className="px-2 pt-2 pb-1.5 border-b border-memorial-border flex-shrink-0">
          <SidebarSearch {...searchBlockProps} compact />
        </div>

        <div className="px-2 py-1.5 border-b border-memorial-border flex-shrink-0 space-y-1.5">
          <FilterPanel activeFilters={activeFilters} toggleFilter={toggleFilter} stats={stats} />
          <div className="flex items-center justify-between text-[10px] text-memorial-muted px-0.5">
            <span>{t('sidebar.totalMarkers', { total: stats.total })}</span>
            {filteredMarkers.length !== stats.total && (
              <span>{t('sidebar.showingMarkers', { count: filteredMarkers.length })}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
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
                  : 'bg-memorial-surface border-memorial-border text-memorial-muted'
              }`}
            >
              📜
            </button>
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'date-asc' ? 'date-desc' : 'date-asc')}
              className="flex-shrink-0 w-9 h-9 text-xs rounded-lg bg-memorial-surface text-memorial-muted border border-memorial-border font-medium flex items-center justify-center hover:bg-memorial-cream-dark hover:text-memorial-navy transition-colors"
              title={t('sidebar.sortTime')}
              aria-label={t('sidebar.sortTime')}
            >
              {sortOrder === 'date-asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        <MobileScrollList
          scrollHint={t('sidebar.scrollHint')}
          listKey={`${sortedMarkers.length}-${selectedMarkerId}-${searchQuery}-${inputMode}-${agentMessages.length}`}
        >
          {showAgentChat ? agentChatPanel : markerListContent}
        </MobileScrollList>

        <div className="flex-shrink-0 border-t border-memorial-border bg-memorial-cream">
          <div className="px-2 py-1 flex gap-1.5">
            <button
              type="button"
              onClick={handleAddButtonClick}
              className={`flex-1 text-xs py-2 rounded-lg font-medium transition-colors min-h-[40px] ${
                inActiveAddFlow
                  ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                  : 'memorial-btn-primary'
              }`}
            >
              {inActiveAddFlow ? `✕ ${t('sidebar.cancel')}` : `➕ ${t('sidebar.addNewMarker')}`}
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="min-h-[40px] min-w-[40px] text-xs rounded-lg border border-memorial-border hover:bg-memorial-cream-dark text-memorial-muted transition-colors flex items-center justify-center"
                aria-label={t('sidebar.export')}
              >
                ⬇️
              </button>
              {showExportMenu && (
                <div className="absolute bottom-full mb-1 right-0 bg-memorial-surface rounded-lg shadow-memorial-lg border border-memorial-border overflow-hidden z-20 min-w-[7rem]">
                  {['json', 'csv', 'geojson'].map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => handleExport(fmt)}
                      className="block w-full text-left px-4 py-2 text-xs text-memorial-ink hover:bg-memorial-cream uppercase"
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {showMobileDetailSheet && markerDetailsProps && (
          <>
            <button
              type="button"
              className="mobile-detail-backdrop"
              onClick={() => onMarkerSelect(selectedMarkerId)}
              aria-label={t('sidebar.cancel')}
            />
            <div className="mobile-detail-sheet pb-safe">
              <div className="mobile-detail-sheet-handle" aria-hidden />
              <div className="px-2 pt-1 pb-2 overflow-y-auto max-h-[inherit]">
                <MarkerDetails {...markerDetailsProps} />
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div
      className="sidebar-panel flex flex-col bg-memorial-cream border-r border-memorial-border flex-shrink-0 h-full"
    >
      <div className="px-3 pt-3 pb-2 border-b border-memorial-border">
        <SidebarSearch {...searchBlockProps} />
      </div>

      <div className="px-3 py-2 border-b border-memorial-border">
        <FilterPanel activeFilters={activeFilters} toggleFilter={toggleFilter} stats={stats} />
      </div>

      <div className="px-3 py-2 border-b border-memorial-border flex items-center justify-between text-xs text-memorial-muted">
        <span>{t('sidebar.totalMarkers', { total: stats.total })}</span>
        {filteredMarkers.length !== stats.total && (
          <span>{t('sidebar.showingMarkers', { count: filteredMarkers.length })}</span>
        )}
      </div>

      <div className="px-3 py-2 border-b border-memorial-border grid grid-cols-3 gap-2">
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
              : 'bg-memorial-surface border-memorial-border text-memorial-muted hover:bg-amber-50 hover:text-amber-800'
          }`}
        >
          <span className="flex-shrink-0">📜</span>
          <span className="truncate">{t('sidebar.onThisDay', { date: onThisDayLabel })}</span>
        </button>
        <button
          type="button"
          onClick={() => setSortOrder(sortOrder === 'date-asc' ? 'date-desc' : 'date-asc')}
          className="min-w-0 text-xs py-1.5 px-2 rounded bg-memorial-surface text-memorial-muted hover:bg-memorial-cream-dark hover:text-memorial-navy transition-colors font-medium flex items-center justify-center gap-1 border border-memorial-border"
        >
          📅 {t('sidebar.sortTime')} {sortOrder === 'date-asc' ? '↑' : '↓'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto sidebar-scrollable">
        {showAgentChat ? agentChatPanel : markerListContent}
      </div>

      <div className="flex-shrink-0 border-t border-memorial-border bg-memorial-cream">
        <div className="px-3 py-2 flex gap-1.5">
          <button
            onClick={handleAddButtonClick}
            className={`flex-1 text-xs py-2 rounded-lg font-medium transition-colors ${
              inActiveAddFlow
                ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                : 'memorial-btn-primary'
            }`}
          >
            {inActiveAddFlow ? `✕ ${t('sidebar.cancel')}` : `➕ ${t('sidebar.addNewMarker')}`}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="text-xs py-2 px-3 rounded-lg border border-memorial-border hover:bg-memorial-cream-dark text-memorial-muted transition-colors"
            >
              ⬇️ {t('sidebar.export')}
            </button>
            {showExportMenu && (
              <div className="absolute bottom-full mb-1 right-0 bg-memorial-surface rounded-lg shadow-memorial-lg border border-memorial-border overflow-hidden z-20 min-w-[7rem]">
                {['json', 'csv', 'geojson'].map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => handleExport(fmt)}
                    className="block w-full text-left px-4 py-2 text-xs text-memorial-ink hover:bg-memorial-cream uppercase"
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
