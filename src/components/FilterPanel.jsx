import React, { useState } from 'react';
import { MARKER_TYPES } from '../utils/constants';

export default function FilterPanel({
  activeFilters,
  toggleFilter,
  stats,
  activeRegionFilters,
  setCountryFilter,
  toggleProvinceFilter,
  regionStats,
}) {
  const [expandedRegion, setExpandedRegion] = useState(false);

  const countries = Object.keys(regionStats).sort();

  return (
    <div className="flex flex-col gap-2">
      {/* Type Filters */}
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

      {/* Region Filters */}
      <div className="border-t border-gray-100 pt-1">
        <button
          onClick={() => setExpandedRegion(!expandedRegion)}
          className="w-full flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors text-left py-1"
        >
          <span>{expandedRegion ? '▼' : '▶'}</span>
          <span>🌍 地区</span>
          {activeRegionFilters.country && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 ml-auto">
              {activeRegionFilters.country}
            </span>
          )}
        </button>

        {expandedRegion && (
          <div className="ml-2 mt-1 flex flex-col gap-1">
            {countries.map((country) => {
              const { count, provinces } = regionStats[country];
              const isSelected = activeRegionFilters.country === country;
              return (
                <div key={country}>
                  <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
                    <input
                      type="radio"
                      name="country"
                      checked={isSelected}
                      onChange={() => setCountryFilter(country)}
                      className="w-4 h-4"
                    />
                    <span className="text-gray-700 flex-1">{country}</span>
                    <span className="text-xs text-gray-400">{count}</span>
                  </label>

                  {isSelected && (
                    <div className="ml-4 mt-1 flex flex-col gap-0.5">
                      {Object.entries(provinces)
                        .sort()
                        .map(([province, pCount]) => (
                          <label
                            key={province}
                            className="flex items-center gap-2 cursor-pointer select-none text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={activeRegionFilters.provinces.includes(province)}
                              onChange={() => toggleProvinceFilter(province)}
                              className="w-3 h-3 rounded"
                            />
                            <span className="text-gray-600 flex-1">{province}</span>
                            <span className="text-xs text-gray-400">{pCount}</span>
                          </label>
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
