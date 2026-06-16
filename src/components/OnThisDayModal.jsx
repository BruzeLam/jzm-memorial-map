import React, { useMemo, useState } from 'react';
import { MARKER_TYPES } from '../utils/constants';
import { formatOnThisDayLabel } from '../utils/onThisDay';
import { compareMarkerDates } from '../utils/markerDates';
import { formatRegionPath } from '../utils/regionFormat';
import { useI18n } from '../i18n/LanguageContext';
import ImageViewer from './ImageViewer';

function OnThisDayCard({ marker, markerTypeLabel, onSelectLabel, onSelect, onViewImages }) {
  const typeInfo = MARKER_TYPES[marker.type] || MARKER_TYPES.spot;
  const cover = marker.images?.[0];
  const region = formatRegionPath(marker);

  return (
    <article className="rounded-lg border border-amber-100 bg-white shadow-sm overflow-hidden">
      <div className="flex gap-3 p-3">
        {cover?.data ? (
          <button
            type="button"
            className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-gray-100 border border-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            onClick={() => onViewImages(marker, 0)}
          >
            <img
              src={cover.data}
              alt={cover.title || cover.name || marker.name}
              className="w-full h-full object-cover"
            />
          </button>
        ) : (
          <div
            className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-lg flex items-center justify-center text-2xl border border-gray-100"
            style={{ backgroundColor: `${typeInfo.color}14` }}
          >
            {typeInfo.icon}
          </div>
        )}

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className="text-[10px] font-semibold text-white px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: typeInfo.color }}
            >
              {markerTypeLabel(marker.type)}
            </span>
            {marker.date && (
              <span className="text-[10px] text-amber-800/80 tabular-nums">
                {marker.date}
                {marker.endDate ? ` — ${marker.endDate}` : ''}
              </span>
            )}
          </div>

          <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-1">{marker.name}</h3>
          {marker.title && (
            <p className="text-xs font-medium text-gray-700 line-clamp-1">{marker.title}</p>
          )}
          {region && <p className="text-[10px] text-gray-500 line-clamp-1">🌍 {region}</p>}
          {marker.description && (
            <p className="text-xs text-gray-600 leading-snug line-clamp-2">{marker.description}</p>
          )}

          {marker.images?.length > 1 && (
            <div className="flex gap-1 pt-0.5">
              {marker.images.slice(1, 4).map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="w-9 h-9 flex-shrink-0 rounded overflow-hidden border border-gray-200"
                  onClick={() => onViewImages(marker, idx + 1)}
                >
                  <img src={img.data} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
              {marker.images.length > 4 && (
                <span className="text-[10px] text-gray-400 self-center">+{marker.images.length - 4}</span>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => onSelect(marker.id)}
            className="text-[11px] font-medium text-amber-800 hover:text-amber-950 underline underline-offset-2"
          >
            {onSelectLabel}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function OnThisDayModal({ markers, onClose, onViewOnMap, onSelectMarker }) {
  const { t, locale, markerTypeLabel } = useI18n();
  const dateLabel = formatOnThisDayLabel(new Date(), locale);
  const [imageView, setImageView] = useState(null);

  const sorted = useMemo(
    () => [...markers].sort((a, b) => compareMarkerDates(a.date, b.date)),
    [markers]
  );

  if (!sorted.length) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[10050] flex items-center justify-center p-4"
        style={{ background: 'rgba(30, 20, 10, 0.55)' }}
        onClick={onClose}
        role="presentation"
      >
        <div
          className="flex flex-col w-full max-w-md max-h-[min(520px,85vh)] rounded-xl shadow-2xl overflow-hidden bg-gradient-to-b from-amber-50 to-white border border-amber-200/80"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-labelledby="on-this-day-title"
        >
          <header className="flex-shrink-0 px-4 pt-3 pb-2 border-b border-amber-100/80">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold tracking-wide text-amber-700">
                  📜 {t('onThisDayModal.eyebrow')}
                </p>
                <h2 id="on-this-day-title" className="text-base font-serif font-bold text-gray-900">
                  {t('onThisDayModal.title')}
                </h2>
                <p className="text-xs text-amber-900/70 mt-0.5">
                  {t('onThisDayModal.subtitle', { date: dateLabel, count: sorted.length })}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex-shrink-0 w-8 h-8 rounded-full bg-white/80 border border-amber-200 text-gray-500 hover:text-gray-800 hover:bg-white transition-colors text-lg leading-none"
                aria-label={t('onThisDayModal.close')}
              >
                ×
              </button>
            </div>
          </header>

          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-2 space-y-2 on-this-day-scroll">
            {sorted.map((marker) => (
              <OnThisDayCard
                key={marker.id}
                marker={marker}
                markerTypeLabel={markerTypeLabel}
                onSelectLabel={t('onThisDayModal.viewDetail')}
                onSelect={(id) => {
                  onSelectMarker(id);
                  onClose();
                }}
                onViewImages={(m, index) => setImageView({ images: m.images, index })}
              />
            ))}
          </div>

          <footer className="flex-shrink-0 px-3 py-2 border-t border-amber-100 bg-amber-50/60 flex gap-2">
            <button
              type="button"
              onClick={() => {
                onViewOnMap();
                onClose();
              }}
              className="flex-1 py-2 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-xs font-medium transition-colors"
            >
              {t('onThisDayModal.viewOnMap')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-lg border border-amber-200 bg-white hover:bg-amber-50 text-amber-900 text-xs font-medium transition-colors"
            >
              {t('onThisDayModal.close')}
            </button>
          </footer>
        </div>
      </div>

      {imageView && (
        <ImageViewer
          images={imageView.images}
          initialIndex={imageView.index}
          onClose={() => setImageView(null)}
          overlayZClass="z-[10100]"
        />
      )}
    </>
  );
}
