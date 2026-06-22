import React from 'react';
import { MARKER_TYPES } from '../utils/constants';
import { useI18n } from '../i18n/LanguageContext';

export default function FilterPanel({ activeFilters, toggleFilter, stats, layout = 'list' }) {
  const { markerTypeLabel, t } = useI18n();

  const typeHint = (key, typeInfo) => {
    const fromMessages = t(`markerTypeHint.${key}`);
    if (fromMessages && !fromMessages.startsWith('markerTypeHint.')) return fromMessages;
    return typeInfo.filterHint || '';
  };

  if (layout === 'grid') {
    return (
      <div className="grid grid-cols-3 gap-1" role="group" aria-label={t('sidebar.filterTypesLabel')}>
        {Object.entries(MARKER_TYPES).map(([key, typeInfo]) => {
          const count = stats[key] || 0;
          const hint = typeHint(key, typeInfo);
          const active = activeFilters[key];
          return (
            <label
              key={key}
              title={hint || undefined}
              className={`filter-type-cell flex flex-col gap-0.5 p-1.5 rounded-lg border cursor-pointer select-none transition-colors ${
                active
                  ? 'border-memorial-gold/70 bg-memorial-cream shadow-sm'
                  : 'border-memorial-border/60 bg-memorial-surface/60 opacity-75 hover:opacity-100 hover:border-memorial-gold/40'
              }`}
            >
              <div className="flex items-center gap-1 min-w-0">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => toggleFilter(key)}
                  className="w-3 h-3 rounded flex-shrink-0"
                  style={{ accentColor: typeInfo.color }}
                  aria-label={markerTypeLabel(key)}
                />
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 leading-none"
                  style={{ backgroundColor: typeInfo.color }}
                  aria-hidden
                >
                  {typeInfo.icon}
                </span>
                <span className="flex-1 min-w-0 text-[11px] font-medium text-memorial-ink truncate leading-tight">
                  {markerTypeLabel(key)}
                </span>
                <span
                  className="text-[9px] px-1 py-px rounded-full text-white font-semibold flex-shrink-0 tabular-nums"
                  style={{ backgroundColor: typeInfo.color }}
                >
                  {count}
                </span>
              </div>
              {hint && (
                <p className="text-[9px] leading-snug text-memorial-muted line-clamp-2 pl-[calc(0.75rem+4px)]">
                  {hint}
                </p>
              )}
            </label>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {Object.entries(MARKER_TYPES).map(([key, typeInfo]) => {
        const count = stats[key] || 0;
        const hint = typeHint(key, typeInfo);
        return (
          <label
            key={key}
            className="flex items-center gap-2 cursor-pointer select-none group min-h-[28px]"
          >
            <input
              type="checkbox"
              checked={activeFilters[key]}
              onChange={() => toggleFilter(key)}
              className="w-4 h-4 rounded flex-shrink-0"
              style={{ accentColor: typeInfo.color }}
            />
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0"
              style={{ backgroundColor: typeInfo.color }}
            >
              {typeInfo.icon}
            </span>
            <span className="flex-1 min-w-0 text-sm leading-tight">
              <span className="text-memorial-ink">{markerTypeLabel(key)}</span>
              {hint && (
                <span className="text-[11px] text-memorial-muted ml-1">{hint}</span>
              )}
            </span>
            <span
              className="text-xs px-1.5 py-0.5 rounded-full text-white font-medium flex-shrink-0"
              style={{ backgroundColor: typeInfo.color }}
            >
              {count}
            </span>
          </label>
        );
      })}
    </div>
  );
}
