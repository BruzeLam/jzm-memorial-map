import React, { useState, useEffect, useRef } from 'react';
import { useLocationSearch, extractAdminInfo, formatRegion } from '../hooks/useNominatim';

export default function LocationInput({ value, onChange, onSelect, placeholder, inputClass }) {
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState(value || '');
  const { results, loading } = useLocationSearch(focused ? query : '');
  const containerRef = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  const handleChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    onChange(v);
  };

  const handleSelect = (item) => {
    const name = item.name || item.display_name?.split(',')[0]?.trim() || '';
    const adminInfo = extractAdminInfo(item.address);
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lng ?? item.lon);
    setQuery(name);
    onChange(name);
    onSelect({
      name,
      lat,
      lng,
      country: adminInfo.country,
      province: adminInfo.province,
      city: adminInfo.city,
    });
    setFocused(false);
  };

  const showDropdown = focused && (results.length > 0 || loading);

  return (
    <div className="relative" ref={containerRef}>
      <input
        className={inputClass}
        value={query}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 180)}
        placeholder={placeholder || '如：中国联合工程、滨安路1060、北京'}
      />
      {showDropdown && (
        <div className="absolute z-[10000] left-0 right-0 top-full mt-0.5 bg-white border border-gray-200 rounded-lg shadow-xl max-h-52 overflow-y-auto">
          {loading && (
            <div className="px-3 py-2 text-xs text-gray-400 flex items-center gap-2">
              <span className="inline-block w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              搜索中…
            </div>
          )}
          {!loading && results.map((item) => {
            const shortName = (item.name || item.display_name || '').slice(0, 28);
            const region = formatRegion(item.address) || item.display_name;
            return (
              <button
                key={item.id}
                type="button"
                onMouseDown={() => handleSelect(item)}
                className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800 truncate flex-1">{shortName}</span>
                  {item.source === 'amap' && (
                    <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                      高德
                    </span>
                  )}
                </div>
                {region && (
                  <div className="text-xs text-gray-400 truncate">{region}</div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
