import { useState, useMemo, useRef } from 'react';

export default function RegionFilter({
  selectedRegions,
  regionHierarchy,
  onToggle,
  onClear,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedContinents, setExpandedContinents] = useState(new Set(['中国']));
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);

  const toggleContinentExpand = (continent) => {
    setExpandedContinents((prev) => {
      const next = new Set(prev);
      if (next.has(continent)) {
        next.delete(continent);
      } else {
        next.add(continent);
      }
      return next;
    });
  };

  const handleButtonClick = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8,
        left: rect.left,
      });
    }
    setIsOpen(!isOpen);
  };

  // 筛选地区（支持搜索）
  const filteredRegions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return regionHierarchy;

    const filtered = {};
    Object.entries(regionHierarchy).forEach(([continent, regions]) => {
      const matches = regions.filter((r) => r.toLowerCase().includes(query));
      if (matches.length > 0) {
        filtered[continent] = matches;
      }
    });
    return filtered;
  }, [regionHierarchy, searchQuery]);

  // 重新排序：中国在前，海外在后
  const orderedRegions = useMemo(() => {
    const ordered = {};
    if (filteredRegions['中国']) ordered['中国'] = filteredRegions['中国'];
    if (filteredRegions['海外']) ordered['海外'] = filteredRegions['海外'];
    return ordered;
  }, [filteredRegions]);

  return (
    <div>
      <button
        ref={buttonRef}
        onClick={handleButtonClick}
        className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
      >
        🌍 地区
        <span className="text-blue-600 font-bold">({selectedRegions.size})</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
          }}
          className="bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-64"
        >
          {/* 搜索框 */}
          <div className="p-2 border-b border-gray-100">
            <input
              type="text"
              placeholder="搜索地区..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:border-blue-400"
            />
          </div>

          {/* 地区列表 */}
          <div className="max-h-64 overflow-y-auto p-2 space-y-1">
            {Object.entries(orderedRegions).map(([continent, regions]) => (
              <div key={continent}>
                <button
                  onClick={() => toggleContinentExpand(continent)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded font-semibold text-xs text-gray-700 transition-colors"
                >
                  <span className="text-sm">{expandedContinents.has(continent) ? '▼' : '▶'}</span>
                  {continent}
                </button>
                {expandedContinents.has(continent) && (
                  <div className="space-y-1 pl-4">
                    {regions.map((region) => (
                      <label
                        key={region}
                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={selectedRegions.has(region)}
                          onChange={() => onToggle(region)}
                          className="w-4 h-4 accent-blue-500"
                        />
                        <span className="text-gray-700">{region}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 清除按钮 */}
          {selectedRegions.size > 0 && (
            <div className="border-t border-gray-100 p-2">
              <button
                onClick={() => {
                  onClear();
                  setSearchQuery('');
                }}
                className="w-full px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 rounded transition-colors"
              >
                清除选择
              </button>
            </div>
          )}
        </div>
      )}

      {/* 点击外部关闭 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
