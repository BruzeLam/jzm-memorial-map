import React, { useState } from 'react';
import { MARKER_TYPES } from '../utils/constants';
import RegionFilter from './RegionFilter';
import { useI18n } from '../i18n/LanguageContext';

export default function SidebarFilterBar({
  activeFilters,
  toggleFilter,
  stats,
  filteredCount,
  selectedRegionKeys,
  regionTree,
  onToggleRegion,
  onClearRegions,
  onThisDayActive,
  onToggleOnThisDay,
  onThisDayLabel,
  sortOrder,
  onToggleSortOrder,
  compact = false,
}) {
  const { t, markerTypeLabel } = useI18n();
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const hasAdvancedActive = selectedRegionKeys.size > 0 || onThisDayActive;

  return (
    <div className="space-y-1">
      <div className={`flex items-center gap-1 ${compact ? '' : 'gap-1.5'}`}>
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
                className={`relative flex items-center justify-center rounded-lg text-sm border transition-colors ${
                  compact ? 'w-9 h-9' : 'w-10 h-10'
                } ${
                  active
                    ? 'text-white border-transparent'
                    : 'bg-memorial-surface border-memorial-border text-memorial-ink hover:border-memorial-gold/70'
                }`}
                style={active ? { backgroundColor: typeInfo.color, borderColor: typeInfo.color } : {}}
              >
                <span>{typeInfo.icon}</span>
                <span
                  className={`absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 rounded-full text-[9px] font-bold leading-[14px] text-center ${
                    active ? 'bg-memorial-surface text-memorial-ink' : 'bg-memorial-navy text-white'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setAdvancedOpen((v) => !v)}
          aria-expanded={advancedOpen}
          className={`flex-shrink-0 rounded-lg border font-medium transition-colors ${
            compact ? 'text-[10px] px-2 py-1.5 min-h-[36px]' : 'text-xs px-2.5 py-1.5'
          } ${
            advancedOpen || hasAdvancedActive
              ? 'bg-amber-50 border-memorial-gold text-memorial-navy'
              : 'bg-memorial-surface border-memorial-border text-memorial-muted hover:border-memorial-gold hover:text-memorial-ink'
          }`}
        >
          {t('sidebar.moreFilters')}
          <span className="ml-0.5 opacity-70" aria-hidden>
            {advancedOpen ? '▲' : '▼'}
          </span>
        </button>
      </div>

      <div
        className={`sidebar-filters-advanced ${
          advancedOpen ? 'sidebar-filters-advanced--open' : 'sidebar-filters-advanced--closed'
        }`}
      >
        <div className={`pt-1.5 ${compact ? 'flex items-center gap-1' : 'grid grid-cols-3 gap-2'}`}>
          <div className={compact ? 'flex-1 min-w-0' : 'min-w-0'}>
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
            className={`min-w-0 rounded border transition-colors font-medium flex items-center justify-center gap-0.5 ${
              compact ? 'w-9 h-9 text-sm flex-shrink-0' : 'text-xs py-1.5 px-1.5'
            } ${
              onThisDayActive
                ? 'bg-amber-50 border-amber-400 text-amber-900'
                : 'bg-memorial-surface border-memorial-border text-memorial-muted hover:bg-amber-50 hover:text-amber-800'
            }`}
          >
            <span className="flex-shrink-0">{compact ? '📜' : '📜'}</span>
            {!compact && (
              <span className="truncate">{t('sidebar.onThisDay', { date: onThisDayLabel })}</span>
            )}
          </button>
          <button
            type="button"
            onClick={onToggleSortOrder}
            className={`min-w-0 rounded bg-memorial-surface text-memorial-muted hover:bg-memorial-cream-dark hover:text-memorial-navy transition-colors font-medium flex items-center justify-center border border-memorial-border ${
              compact ? 'w-9 h-9 text-xs flex-shrink-0' : 'text-xs py-1.5 px-2 gap-1'
            }`}
            title={t('sidebar.sortTime')}
            aria-label={t('sidebar.sortTime')}
          >
            {compact ? (sortOrder === 'date-asc' ? '↑' : '↓') : (
              <>📅 {t('sidebar.sortTime')} {sortOrder === 'date-asc' ? '↑' : '↓'}</>
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-memorial-muted px-0.5 pt-0.5">
        <span>{t('sidebar.totalMarkers', { total: stats.total })}</span>
        {filteredCount !== stats.total && (
          <span>{t('sidebar.showingMarkers', { count: filteredCount })}</span>
        )}
      </div>
    </div>
  );
}
