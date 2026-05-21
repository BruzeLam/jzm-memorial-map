import React, { useState, useEffect } from 'react';

const CENTENARY = new Date('2026-08-17T00:00:00');

function useCountdown() {
  const [seconds, setSeconds] = useState(() =>
    Math.max(0, Math.floor((CENTENARY - Date.now()) / 1000))
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = Math.floor((CENTENARY - Date.now()) / 1000);
      if (remaining <= 0) {
        setSeconds(0);
        clearInterval(timer);
      } else {
        setSeconds(remaining);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return seconds;
}

export default function Header() {
  const seconds = useCountdown();
  const showCountdown = Date.now() < CENTENARY;

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

        <div className="flex items-center gap-3">
          {showCountdown && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
              <span className="text-xs text-red-600 font-medium whitespace-nowrap">
                距百岁诞辰
              </span>
              <span className="font-mono font-bold text-red-700 text-sm tabular-nums bg-red-100 px-1.5 py-0.5 rounded">
                {seconds.toLocaleString()}
              </span>
              <span className="text-xs text-red-600 font-medium">秒</span>
            </div>
          )}
          <span className="text-xs text-gray-400">Leaflet + OpenStreetMap</span>
        </div>
      </div>
    </header>
  );
}
