import React, { useState } from 'react';
import SearchBar from './SearchBar';
import FilterPanel from './FilterPanel';
import MarkerDetails from './MarkerDetails';
import AddMarkerForm from './AddMarkerForm';
import { MARKER_TYPES } from '../utils/constants';
import { exportMarkers } from '../utils/dataExport';

export default function Sidebar({
  markers,
  filteredMarkers,
  selectedMarkerId,
  selectedMarker,
  stats,
  searchQuery,
  setSearchQuery,
  activeFilters,
  toggleFilter,
  clearSearch,
  onMarkerSelect,
  onEditMarker,
  onDeleteMarker,
  onStartAddMode,
  isAddingMode,
  showAddForm,
  editingMarker,
  pendingCoords,
  onAddMarker,
  onUpdateMarker,
  onCancelAdd,
  onResetToSample,
  onClearAll,
}) {
  const [showSettings, setShowSettings] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleExport = (format) => {
    exportMarkers(markers, format);
    setShowExportMenu(false);
  };

  return (
    <div
      className="sidebar-panel flex flex-col bg-white border-r border-gray-200 flex-shrink-0"
      style={{ width: 320 }}
    >
      <div className="px-3 pt-3 pb-2 border-b border-gray-100">
        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          clearSearch={clearSearch}
        />
      </div>

      <div className="px-3 py-2 border-b border-gray-100">
        <FilterPanel activeFilters={activeFilters} toggleFilter={toggleFilter} stats={stats} />
      </div>

      <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <span>共 <strong className="text-gray-700">{stats.total}</strong> 个标记</span>
        {filteredMarkers.length !== stats.total && (
          <span>当前显示 <strong className="text-gray-700">{filteredMarkers.length}</strong> 个</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto sidebar-scrollable">
        {showAddForm ? (
          <div className="p-3">
            <AddMarkerForm
              onSubmit={editingMarker ? onUpdateMarker : onAddMarker}
              onCancel={onCancelAdd}
              initialCoords={pendingCoords}
              editingMarker={editingMarker}
            />
          </div>
        ) : selectedMarker ? (
          <div className="p-3">
            <MarkerDetails
              marker={selectedMarker}
              onEdit={onEditMarker}
              onDelete={onDeleteMarker}
              onClose={() => onMarkerSelect(selectedMarkerId)}
            />
          </div>
        ) : (
          <ul className="py-1">
            {filteredMarkers.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-gray-400">没有找到相关标记</li>
            ) : (
              filteredMarkers.map((m) => {
                const typeInfo = MARKER_TYPES[m.type] || MARKER_TYPES.spot;
                const isActive = m.id === selectedMarkerId;
                return (
                  <li
                    key={m.id}
                    className={`marker-list-item px-3 py-2.5 cursor-pointer border-l-2 ${
                      isActive ? 'active' : 'border-transparent'
                    }`}
                    onClick={() => onMarkerSelect(m.id)}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: typeInfo.color }}
                      >
                        {typeInfo.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-gray-800 truncate">{m.name}</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                          <span
                            className="px-1.5 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: typeInfo.color, fontSize: 10 }}
                          >
                            {typeInfo.label}
                          </span>
                          {m.date && <span>{m.date}</span>}
                        </div>
                        {m.title && (
                          <p className="text-xs text-gray-500 mt-0.5 truncate">{m.title}</p>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        )}
      </div>

      <div className="px-3 py-2 border-t border-gray-100 flex gap-1.5">
        <button
          onClick={isAddingMode ? onCancelAdd : onStartAddMode}
          className={`flex-1 text-xs py-2 rounded-lg font-medium transition-colors ${
            isAddingMode
              ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isAddingMode ? '✕ 取消' : '➕ 添加'}
        </button>

        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="text-xs py-2 px-3 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
          >
            ⬇️ 导出
          </button>
          {showExportMenu && (
            <div className="absolute bottom-full mb-1 right-0 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-10">
              {['json', 'csv', 'geojson'].map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => handleExport(fmt)}
                  className="block w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 uppercase"
                >
                  {fmt}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-xs py-2 px-3 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
          >
            ⚙️
          </button>
          {showSettings && (
            <div className="absolute bottom-full mb-1 right-0 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-10 w-40">
              <button
                onClick={() => { onResetToSample(); setShowSettings(false); }}
                className="block w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
              >
                🔄 恢复示例数据
              </button>
              <button
                onClick={() => {
                  if (window.confirm('确定清空所有数据吗？')) {
                    onClearAll();
                    setShowSettings(false);
                  }
                }}
                className="block w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-50"
              >
                🗑️ 清空所有数据
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
