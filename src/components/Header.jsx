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

// 黑框眼镜 SVG —— 抽象为无尽符号
function Glasses({ size = 32 }) {
  return (
    <svg
      width={size}
      height={size * 0.45}
      viewBox="0 0 64 29"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 左镜片 */}
      <rect x="1" y="1" width="24" height="22" rx="4" ry="4"
        stroke="currentColor" strokeWidth="3" fill="none" />
      {/* 右镜片 */}
      <rect x="39" y="1" width="24" height="22" rx="4" ry="4"
        stroke="currentColor" strokeWidth="3" fill="none" />
      {/* 中间鼻梁 */}
      <path d="M25 11 Q32 17 39 11" stroke="currentColor" strokeWidth="2.5"
        fill="none" strokeLinecap="round" />
    </svg>
  );
}

export default function Header() {
  const seconds = useCountdown();
  const showCountdown = Date.now() < CENTENARY;
  const [hovered, setHovered] = useState(false);

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
            <div
              className="relative flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 cursor-default select-none"
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
            >
              <span className="text-xs text-red-600 font-medium whitespace-nowrap">
                距百岁诞辰
              </span>
              <span className="font-mono font-bold text-red-700 text-sm tabular-nums bg-red-100 px-1.5 py-0.5 rounded">
                {seconds.toLocaleString()}
              </span>
              <span className="text-xs text-red-600 font-medium">秒</span>

              {/* 悬浮 tooltip */}
              {hovered && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-4 py-3 bg-white/90 backdrop-blur-sm text-gray-800 rounded-lg shadow-lg whitespace-nowrap flex items-center gap-2 text-sm font-medium z-50 border border-gray-100">
                  <span className="font-semibold">1926.8.17</span>
                  <span className="text-gray-400 mx-0.5">—</span>
                  <span className="text-red-600">
                    <Glasses size={28} />
                  </span>
                  {/* 小三角指向上方 */}
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-white" />
                </div>
              )}
            </div>
          )}
          <span className="text-xs text-gray-400">Leaflet + OpenStreetMap</span>
        </div>
      </div>
    </header>
  );
}
