import { useState, useMemo, useRef } from 'react';
import { matchesBoundedSearch, normalizeSearchQuery } from '../utils/textSearch';
import { useI18n } from '../i18n/LanguageContext';

function TreeCheckbox({ checked, indeterminate, onChange }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      ref={(el) => {
        if (el) el.indeterminate = indeterminate;
      }}
      onChange={onChange}
      className="w-3.5 h-3.5 accent-memorial-gold-dark flex-shrink-0"
      onClick={(e) => e.stopPropagation()}
    />
  );
}

function CityNode({ city, selectedKeys, onToggle }) {
  const checked = selectedKeys.has(city.key);
  return (
    <label className="flex items-center gap-2 pl-8 pr-2 py-1 hover:bg-memorial-cream rounded cursor-pointer text-xs">
      <TreeCheckbox checked={checked} indeterminate={false} onChange={() => onToggle(city.key)} />
      <span className="text-memorial-ink flex-1 truncate">{city.label}</span>
      <span className="text-memorial-muted tabular-nums">{city.count}</span>
    </label>
  );
}

function ProvinceNode({ province, selectedKeys, onToggle, expandedSet, onToggleExpand }) {
  const expanded = expandedSet.has(province.key);
  const checked = selectedKeys.has(province.key);
  const childKeys = province.cities.map((c) => c.key);
  const selectedChildCount = childKeys.filter((k) => selectedKeys.has(k)).length;
  const indeterminate =
    !checked && selectedChildCount > 0 && selectedChildCount < childKeys.length;

  return (
    <div>
      <div className="flex items-center gap-1 pl-4 pr-1">
        <button
          type="button"
          onClick={() => onToggleExpand(province.key)}
          className="w-5 h-5 flex items-center justify-center text-memorial-muted hover:text-memorial-ink text-[10px]"
        >
          {province.cities.length > 0 ? (expanded ? '▼' : '▶') : ''}
        </button>
        <label className="flex items-center gap-2 flex-1 py-1 hover:bg-memorial-cream rounded cursor-pointer text-xs">
          <TreeCheckbox
            checked={checked}
            indeterminate={indeterminate}
            onChange={() => onToggle(province.key)}
          />
          <span className="text-memorial-ink font-medium flex-1 truncate">{province.label}</span>
          <span className="text-memorial-muted tabular-nums">{province.count}</span>
        </label>
      </div>
      {expanded &&
        province.cities.map((city) => (
          <CityNode key={city.key} city={city} selectedKeys={selectedKeys} onToggle={onToggle} />
        ))}
    </div>
  );
}

function CountryNode({ country, selectedKeys, onToggle, expandedSet, onToggleExpand }) {
  const expanded = expandedSet.has(country.key);
  const checked = selectedKeys.has(country.key);
  const allChildKeys = country.provinces.flatMap((p) => [p.key, ...p.cities.map((c) => c.key)]);
  const selectedChildCount = allChildKeys.filter((k) => selectedKeys.has(k)).length;
  const indeterminate =
    !checked && selectedChildCount > 0 && selectedChildCount < allChildKeys.length;

  return (
    <div>
      <div className="flex items-center gap-1 pr-1">
        <button
          type="button"
          onClick={() => onToggleExpand(country.key)}
          className="w-5 h-5 flex items-center justify-center text-memorial-muted hover:text-memorial-ink text-[10px]"
        >
          {country.provinces.length > 0 ? (expanded ? '▼' : '▶') : ''}
        </button>
        <label className="flex items-center gap-2 flex-1 py-1.5 hover:bg-memorial-cream rounded cursor-pointer text-xs font-semibold">
          <TreeCheckbox
            checked={checked}
            indeterminate={indeterminate}
            onChange={() => onToggle(country.key)}
          />
          <span className="text-memorial-navy flex-1">{country.label}</span>
          <span className="text-memorial-muted tabular-nums font-normal">{country.count}</span>
        </label>
      </div>
      {expanded &&
        country.provinces.map((province) => (
          <ProvinceNode
            key={province.key}
            province={province}
            selectedKeys={selectedKeys}
            onToggle={onToggle}
            expandedSet={expandedSet}
            onToggleExpand={onToggleExpand}
          />
        ))}
    </div>
  );
}

export default function RegionFilter({
  selectedRegionKeys,
  regionTree,
  onToggleRegion,
  onClearRegions,
}) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedKeys, setExpandedKeys] = useState(() => new Set(['c:中国']));
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);

  const toggleExpand = (key) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleButtonClick = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({ top: rect.bottom + 6, left: rect.left });
    }
    setIsOpen((o) => !o);
  };

  const filterTree = useMemo(() => {
    const q = normalizeSearchQuery(searchQuery);
    if (!q) return regionTree;

    const labelMatches = (label) => matchesBoundedSearch(label, q);

    const filterCountry = (country) => {
      const countryMatch = labelMatches(country.label);
      const provinces = country.provinces
        .map((p) => {
          const provinceMatch = labelMatches(p.label);
          const cities = p.cities.filter(
            (c) => labelMatches(c.label) || provinceMatch || countryMatch
          );
          if (provinceMatch || countryMatch || cities.length > 0) {
            return { ...p, cities: provinceMatch || countryMatch ? p.cities : cities };
          }
          return null;
        })
        .filter(Boolean);
      if (countryMatch || provinces.length > 0) {
        return { ...country, provinces };
      }
      return null;
    };

    return {
      china: regionTree.china.map(filterCountry).filter(Boolean),
      overseas: regionTree.overseas.map(filterCountry).filter(Boolean),
    };
  }, [regionTree, searchQuery]);

  const hasSelection = selectedRegionKeys.size > 0;
  const activeClass = hasSelection
    ? 'bg-amber-50 border-memorial-gold text-memorial-navy'
    : 'bg-memorial-surface border-memorial-border text-memorial-muted hover:bg-memorial-cream-dark hover:text-memorial-navy hover:border-memorial-gold/70';

  return (
    <div className="min-w-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleButtonClick}
        className={`w-full text-xs py-1.5 px-2 rounded border transition-colors font-medium flex items-center justify-center gap-1 ${activeClass}`}
      >
        🌍 {t('region.label')}
        {hasSelection && (
          <span className="text-memorial-gold-dark font-bold">({selectedRegionKeys.size})</span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[500]" onClick={() => setIsOpen(false)} />
          <div
            style={{ position: 'fixed', top: menuPosition.top, left: menuPosition.left }}
            className="bg-memorial-cream border border-memorial-border rounded-xl shadow-memorial-lg z-[600] w-72 max-h-[min(420px,70vh)] flex flex-col"
          >
            <div className="p-2 border-b border-memorial-border">
              <input
                type="text"
                placeholder={t('region.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-2 py-1.5 text-xs memorial-input"
              />
            </div>

            <div className="overflow-y-auto flex-1 p-2 space-y-2">
              {filterTree.china.map((country) => (
                <CountryNode
                  key={country.key}
                  country={country}
                  selectedKeys={selectedRegionKeys}
                  onToggle={onToggleRegion}
                  expandedSet={expandedKeys}
                  onToggleExpand={toggleExpand}
                />
              ))}
              {filterTree.overseas.length > 0 && (
                <>
                  <div className="text-[10px] font-semibold text-memorial-muted px-1 pt-1">海外</div>
                  {filterTree.overseas.map((country) => (
                    <CountryNode
                      key={country.key}
                      country={country}
                      selectedKeys={selectedRegionKeys}
                      onToggle={onToggleRegion}
                      expandedSet={expandedKeys}
                      onToggleExpand={toggleExpand}
                    />
                  ))}
                </>
              )}
              {filterTree.china.length === 0 && filterTree.overseas.length === 0 && (
                <p className="text-xs text-memorial-muted text-center py-4">{t('region.noMatch')}</p>
              )}
            </div>

            {hasSelection && (
              <div className="border-t border-memorial-border p-2">
                <button
                  type="button"
                  onClick={() => {
                    onClearRegions();
                    setSearchQuery('');
                  }}
                  className="w-full py-1.5 text-xs text-memorial-muted hover:bg-memorial-cream-dark rounded transition-colors"
                >
                  {t('region.clearFilter')}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
