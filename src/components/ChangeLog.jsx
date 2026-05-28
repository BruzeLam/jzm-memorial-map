import React, { useState } from 'react';
import updates from '../data/updates.json';
import { useI18n } from '../i18n/LanguageContext';

const typeStyle = {
  feature: { emoji: '✨', color: 'bg-blue-50 border-blue-200' },
  optimize: { emoji: '⚡', color: 'bg-amber-50 border-amber-200' },
  refactor: { emoji: '🔧', color: 'bg-purple-50 border-purple-200' },
  fix: { emoji: '🐛', color: 'bg-red-50 border-red-200' },
  story: { emoji: '📜', color: 'bg-emerald-50 border-emerald-200' },
};

function formatDateLabel(dateKey, isToday, t) {
  if (isToday) return `🔔 ${t('changelog.today')}`;
  const parts = dateKey.split('-').map((n) => parseInt(n, 10));
  if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
    return `📅 ${parts[0]}年${parts[1]}月${parts[2]}日`;
  }
  return `📅 ${dateKey}`;
}

function resolveImageSrc(path) {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  const base = process.env.PUBLIC_URL || '';
  return `${base}${path}`;
}

export default function ChangeLog({ onClose }) {
  const { t } = useI18n();
  const [expandedDates, setExpandedDates] = useState({});
  const [previewImage, setPreviewImage] = useState(null);

  const typeLabel = (type) => {
    const key = `changelog.types.${type}`;
    const label = t(key);
    const style = typeStyle[type] || typeStyle.feature;
    return `${style.emoji} ${label === key ? type : label}`;
  };

  const getTodayKey = () => {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  };

  const todayKey = getTodayKey();

  const sortedDates = Object.keys(updates).sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateB - dateA;
  });

  const toggleDate = (date) => {
    setExpandedDates((prev) => ({
      ...prev,
      [date]: !prev[date],
    }));
  };

  const groupByType = (items) => {
    const grouped = {};
    items.forEach((item) => {
      const type = item.type || 'feature';
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(item);
    });
    return grouped;
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style={{ background: 'rgba(240, 244, 255, 0.8)' }}
        onClick={(e) => {
          if (e.target === e.currentTarget && onClose) {
            onClose();
          }
        }}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col"
          style={{ maxHeight: '85vh', backgroundImage: 'linear-gradient(135deg, #ffffff 0%, #f0f4ff 100%)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
            <h2 className="text-xl font-bold text-gray-800">📋 {t('changelog.title')}</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              aria-label="关闭"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {sortedDates.map((date) => {
              const isToday = date === todayKey;
              const isExpanded = expandedDates[date] !== false;
              const dateItems = updates[date];
              const groupedByType = groupByType(dateItems);

              return (
                <div key={date} className="overflow-hidden transition-all">
                  <button
                    type="button"
                    onClick={() => toggleDate(date)}
                    className={`w-full px-4 py-3 flex items-center justify-between transition-all border-b-2 ${
                      isToday
                        ? 'bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-blue-200'
                        : 'bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border-gray-200'
                    }`}
                  >
                    <span className={`font-semibold text-sm ${isToday ? 'text-blue-700' : 'text-gray-700'}`}>
                      {formatDateLabel(date, isToday, t)}
                    </span>
                    <span
                      className="text-gray-400 transition-transform"
                      style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    >
                      ▼
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="px-4 py-4 space-y-4">
                      {Object.entries(groupedByType).map(([type, items]) => (
                        <div key={type}>
                        <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                          {typeLabel(type)}
                        </div>
                        <div className="space-y-3 pl-2 border-l-2 border-gray-200">
                          {items.map((item, idx) => {
                            const imageSrc = resolveImageSrc(item.image);
                            return (
                              <div
                                key={idx}
                                className={`rounded-lg border p-3 ${
                                  typeStyle[type]?.color || 'bg-gray-50 border-gray-200'
                                }`}
                              >
                                  <div className="flex items-start gap-2">
                                    <span className="text-lg mt-0.5 flex-shrink-0">{item.emoji}</span>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm text-gray-800">{item.title}</p>
                                      <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                                        {item.description}
                                      </p>
                                      {imageSrc && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setPreviewImage({
                                              src: imageSrc,
                                              alt: item.imageAlt || item.title,
                                            })
                                          }
                                          className="mt-2 block w-full text-left group"
                                        >
                                          <img
                                            src={imageSrc}
                                            alt={item.imageAlt || item.title}
                                            className="w-full max-h-48 object-contain rounded-lg border border-gray-200/80 bg-white group-hover:border-blue-300 transition-colors"
                                          />
                                          {item.imageCaption && (
                                            <span className="text-xs text-gray-400 mt-1 block">
                                              {item.imageCaption}
                                            </span>
                                          )}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {previewImage && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/85 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage.src}
            alt={previewImage.alt}
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 text-white text-2xl leading-none"
            aria-label="关闭预览"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
