import React from 'react';
import { MARKER_TYPES } from '../utils/constants';
import { useI18n } from '../i18n/LanguageContext';

export default function FilterPanel({ activeFilters, toggleFilter, stats }) {
  const { markerTypeLabel, t } = useI18n();

  const typeHint = (key, typeInfo) => {
    const fromMessages = t(`markerTypeHint.${key}`);
    if (fromMessages && !fromMessages.startsWith('markerTypeHint.')) return fromMessages;
    return typeInfo.filterHint || '';
  };

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
              <span className="text-gray-700">{markerTypeLabel(key)}</span>
              {hint && (
                <span className="text-[11px] text-gray-400 ml-1">{hint}</span>
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
