import React from 'react';
import SidebarSearch from './SidebarSearch';
import FilterPanel from './FilterPanel';
import RegionFilter from './RegionFilter';
import { useI18n } from '../i18n/LanguageContext';

/**
 * 侧栏顶部：搜索 / 智能问 + 类型筛选 + 统计与快捷操作，合并为单卡片以收窄占用高度。
 */
export default function SidebarToolbar({
  searchBlockProps,
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
  onToggleSort,
  compact = false,
}) {
  const { t } = useI18n();

  return (
    <div className="sidebar-toolbar memorial-card overflow-visible">
      <div className={`${compact ? 'p-1.5 space-y-1' : 'p-2 space-y-1.5'}`}>
        <SidebarSearch {...searchBlockProps} compact={compact} />

        <FilterPanel
          activeFilters={activeFilters}
          toggleFilter={toggleFilter}
          stats={stats}
          layout="grid"
        />

        <div className="flex flex-col gap-1 pt-1 border-t border-memorial-border/70">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[10px] text-memorial-muted leading-tight">
            <span>{t('sidebar.totalMarkers', { total: stats.total })}</span>
            {filteredCount !== stats.total && (
              <span className="text-memorial-gold-dark font-medium">
                {t('sidebar.showingMarkers', { count: filteredCount })}
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-1">
            <RegionFilter
              selectedRegionKeys={selectedRegionKeys}
              regionTree={regionTree}
              onToggleRegion={onToggleRegion}
              onClearRegions={onClearRegions}
              compact
            />
            <button
              type="button"
              onClick={onToggleOnThisDay}
              title={t('sidebar.onThisDay', { date: onThisDayLabel })}
              aria-label={t('sidebar.onThisDay', { date: onThisDayLabel })}
              className={`min-w-0 text-[10px] py-1 px-1 rounded-md border transition-colors font-medium flex items-center justify-center gap-0.5 ${
                onThisDayActive
                  ? 'bg-amber-50 border-amber-400 text-amber-900'
                  : 'bg-memorial-surface border-memorial-border text-memorial-muted hover:bg-amber-50/80 hover:text-amber-900'
              }`}
            >
              <span className="flex-shrink-0" aria-hidden>
                📜
              </span>
              <span className="truncate">{t('sidebar.onThisDay', { date: onThisDayLabel })}</span>
            </button>
            <button
              type="button"
              onClick={onToggleSort}
              title={t('sidebar.sortTime')}
              aria-label={t('sidebar.sortTime')}
              className="min-w-0 text-[10px] py-1 px-1 rounded-md bg-memorial-surface text-memorial-muted hover:bg-memorial-cream-dark hover:text-memorial-navy transition-colors font-medium flex items-center justify-center gap-0.5 border border-memorial-border"
            >
              <span aria-hidden>📅</span>
              <span className="truncate">
                {t('sidebar.sortTime')} {sortOrder === 'date-asc' ? '↑' : '↓'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
