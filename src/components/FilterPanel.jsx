import React from 'react';
import { MARKER_TYPES } from '../utils/constants';
import { useI18n } from '../i18n/LanguageContext';

export default function FilterPanel({ activeFilters, toggleFilter, stats, compact = false }) {
  const { markerTypeLabel, t } = useI18n();

  const typeHint = (key, typeInfo) => {
    const fromMessages = t(`markerTypeHint.${key}`);
    if (fromMessages && !fromMessages.startsWith('markerTypeHint.')) return fromMessages;
    return typeInfo.filterHint || '';
  };

  return (
    <div className={`flex flex-col ${compact ? 'gap-0.5' : 'gap-1'}`}>
      {Object.entries(MARKER_TYPES).map(([key, typeInfo]) => {
        const count = stats[key] || 0;
        const hint = typeHint(key, typeInfo);
        return (
          <label
            key={key}
            className={`flex items-center gap-1.5 cursor-pointer select-none ${
              compact ? 'min-h-[22px]' : 'min-h-[28px]'
            }`}
          >
            <input
              type="checkbox"
              checked={activeFilters[key]}
              onChange={() => toggleFilter(key)}
              className={`rounded flex-shrink-0 ${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'}`}
              style={{ accentColor: typeInfo.color }}
            />
            <span
              className={`rounded-full flex items-center justify-center flex-shrink-0 ${
                compact ? 'w-4 h-4 text-[10px]' : 'w-5 h-5 text-xs'
              }`}
              style={{ backgroundColor: typeInfo.color }}
            >
              {typeInfo.icon}
            </span>
            <span className={`flex-1 min-w-0 leading-tight ${compact ? 'text-xs' : 'text-sm'}`}>
              <span className="text-memorial-ink">{markerTypeLabel(key)}</span>
              {hint && (
                <span
                  className={`text-memorial-muted ml-1 ${compact ? 'text-[10px]' : 'text-[11px]'}`}
                >
                  {hint}
                </span>
              )}
            </span>
            <span
              className={`rounded-full text-white font-medium flex-shrink-0 tabular-nums ${
                compact ? 'text-[10px] px-1 py-px' : 'text-xs px-1.5 py-0.5'
              }`}
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
