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

export default function Header({ onOpenQuotes }) {
  const seconds = useCountdown();
  const showCountdown = Date.now() < CENTENARY;
  const [hovered, setHovered] = useState(false);

  return (
    <header className="bg-gray-200 border-b border-gray-300 shadow-sm flex-shrink-0">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-700 flex items-center justify-center text-white text-sm font-bold">
            纪
          </div>
          <h1 className="text-lg font-serif font-bold leading-tight">
            <a
              href="https://www.news.cn/politics/2022-12/02/c_1129179786.htm"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-800 hover:text-blue-600 transition-colors"
            >
              江泽民同志生平纪念地图
            </a>
          </h1>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <button
            onClick={onOpenQuotes}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white text-xs font-medium rounded-lg transition-colors"
          >
            <span>📚</span>
            <span>长者语录</span>
          </button>

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

              {hovered && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-4 py-3 bg-white/90 backdrop-blur-sm text-gray-800 rounded-lg shadow-2xl whitespace-nowrap flex items-center gap-2 text-sm font-medium border border-gray-100" style={{ zIndex: 99999 }}>
                  <span className="font-semibold">1926.8.17</span>
                  <span className="text-gray-400 mx-0.5">—</span>
                  <span className="text-red-600">
                    <Glasses size={28} />
                  </span>
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-white" />
                </div>
              )}
            </div>
          )}

          {!showCountdown && (
            <div className="flex items-center gap-2 text-gray-700 text-xs font-medium px-3 py-1.5">
              <span>1926/8/17</span>
              <span className="text-gray-400">-</span>
              <span>♾️</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
