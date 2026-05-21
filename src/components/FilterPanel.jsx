import React from 'react';
import { MARKER_TYPES } from '../utils/constants';

export default function FilterPanel({ activeFilters, toggleFilter, stats }) {
  return (
    <div className="flex flex-col gap-1">
      {Object.entries(MARKER_TYPES).map(([key, typeInfo]) => {
        const count = stats[key] || 0;
        return (
          <label
            key={key}
            className="flex items-center gap-2 cursor-pointer select-none group"
          >
            <input
              type="checkbox"
              checked={activeFilters[key]}
              onChange={() => toggleFilter(key)}
              className="w-4 h-4 rounded"
              style={{ accentColor: typeInfo.color }}
            />
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
              style={{ backgroundColor: typeInfo.color }}
            >
              {typeInfo.icon}
            </span>
            <span className="text-sm text-gray-700 flex-1">{typeInfo.label}</span>
            <span
              className="text-xs px-1.5 py-0.5 rounded-full text-white font-medium"
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
