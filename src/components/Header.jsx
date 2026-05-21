import React from 'react';

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-700 flex items-center justify-center text-white text-sm font-bold">
            纪
          </div>
          <div>
            <h1 className="text-lg font-serif font-bold text-gray-800 leading-tight">
              江泽民同志生平纪念地图
            </h1>
            <p className="text-xs text-gray-500">交互式历史足迹地图</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>Leaflet + OpenStreetMap</span>
        </div>
      </div>
    </header>
  );
}
