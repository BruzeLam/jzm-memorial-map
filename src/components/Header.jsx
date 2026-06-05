import React, { useState, useEffect } from 'react';
import RandomQuoteDisplay from './RandomQuoteDisplay';
import { useI18n } from '../i18n/LanguageContext';
import { useMediaQuery } from '../hooks/useMediaQuery';

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

function Glasses({ size = 32 }) {
  return (
    <svg
      width={size}
      height={size * 0.45}
      viewBox="0 0 64 29"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="1" y="1" width="24" height="22" rx="4" ry="4"
        stroke="currentColor" strokeWidth="3" fill="none" />
      <rect x="39" y="1" width="24" height="22" rx="4" ry="4"
        stroke="currentColor" strokeWidth="3" fill="none" />
      <path d="M25 11 Q32 17 39 11" stroke="currentColor" strokeWidth="2.5"
        fill="none" strokeLinecap="round" />
    </svg>
  );
}

function CountdownBadge({ seconds, compact = false }) {
  const { t } = useI18n();
  const [hovered, setHovered] = useState(false);
  const showCountdown = Date.now() < CENTENARY;

  if (!showCountdown) {
    return (
      <div className={`flex items-center gap-2 text-gray-700 font-medium ${compact ? 'text-[10px] px-2 py-1' : 'text-xs px-3 py-1.5'}`}>
        <span>1926/8/17</span>
        <span className="text-gray-400">-</span>
        <span>♾️</span>
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg cursor-default select-none ${
        compact ? 'px-2 py-1' : 'px-3 py-1.5 gap-2'
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {!compact && (
        <span className="text-xs text-red-600 font-medium whitespace-nowrap hidden sm:inline">
          {t('nav.countdown')}
        </span>
      )}
      <span className={`font-mono font-bold text-red-700 tabular-nums bg-red-100 px-1.5 py-0.5 rounded ${compact ? 'text-[10px]' : 'text-sm'}`}>
        {seconds.toLocaleString()}
      </span>
      {!compact && (
        <span className="text-xs text-red-600 font-medium hidden sm:inline">{t('nav.seconds')}</span>
      )}

      {hovered && !compact && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-4 py-3 bg-white/90 backdrop-blur-sm text-gray-800 rounded-lg shadow-2xl whitespace-nowrap flex items-center gap-2 text-sm font-medium border border-gray-100 z-[99999]">
          <span className="font-semibold">1926.8.17</span>
          <span className="text-gray-400 mx-0.5">—</span>
          <span className="text-red-600">
            <Glasses size={28} />
          </span>
        </div>
      )}
    </div>
  );
}

function NavButton({ emoji, label, onClick, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${className}`}
    >
      <span>{emoji}</span>
      <span>{label}</span>
    </button>
  );
}

export default function Header({ onOpenQuotes, onOpenArchive, onOpenGallery, onOpenChangeLog }) {
  const { t } = useI18n();
  const seconds = useCountdown();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const openAndClose = (fn) => () => {
    fn();
    closeMenu();
  };

  const navItems = [
    { emoji: '🖼️', label: t('nav.gallery'), onClick: onOpenGallery, className: 'bg-purple-600 hover:bg-purple-700 text-white' },
    { emoji: '📚', label: t('nav.quotes'), onClick: onOpenQuotes, className: 'bg-red-700 hover:bg-red-800 text-white' },
    { emoji: '📁', label: t('nav.archive'), onClick: onOpenArchive, className: 'bg-amber-800 hover:bg-amber-900 text-white' },
    { emoji: '📋', label: t('nav.changelog'), onClick: onOpenChangeLog, className: 'bg-blue-100 hover:bg-blue-200 text-blue-700' },
  ];

  return (
    <header className="bg-gray-200 border-b border-gray-300 shadow-sm flex-shrink-0 relative z-[500] pt-safe">
      <div className="px-3 md:px-4 py-2 md:py-3 flex items-start md:items-center gap-2 md:gap-3">
        <img
          src={`${process.env.PUBLIC_URL}/logo.png?v=3`}
          alt=""
          className="w-9 h-9 md:w-10 md:h-10 flex-shrink-0 rounded-lg bg-white object-contain ring-1 ring-gray-300 shadow-sm mt-0.5"
        />
        <div className="flex-1 min-w-0">
          <h1 className="text-[13px] md:text-lg font-serif font-bold leading-snug">
            <a
              href="https://www.news.cn/politics/2022-12/02/c_1129179786.htm"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-800 hover:text-blue-600 transition-colors"
            >
              江泽民同志生平纪念地图
            </a>
          </h1>
          {isMobile && (
            <div className="mt-1.5">
              <CountdownBadge seconds={seconds} compact />
            </div>
          )}
        </div>

        {!isMobile && <RandomQuoteDisplay />}

        <div className="flex items-center gap-2 flex-shrink-0">
          {!isMobile && (
            <div className="flex items-center gap-2">
              {navItems.map((item) => (
                <NavButton key={item.label} {...item} />
              ))}
              <CountdownBadge seconds={seconds} />
            </div>
          )}

          {isMobile && (
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="w-11 h-11 flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 shadow-sm"
              aria-label={t('nav.openMenu')}
              aria-expanded={menuOpen}
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          )}
        </div>
      </div>

      {isMobile && menuOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[498] bg-black/20 border-0 p-0 cursor-pointer"
            aria-label={t('nav.closeMenu')}
            onClick={closeMenu}
          />
          <div className="absolute left-0 right-0 top-full z-[499] border-b border-gray-200 bg-white shadow-lg px-3 py-3 space-y-2 mobile-header-menu pb-safe">
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={openAndClose(item.onClick)}
                className={`w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${item.className}`}
              >
                <span>{item.emoji}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </header>
  );
}
