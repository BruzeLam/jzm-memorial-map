import React from 'react';
import { MarkerTagPills } from './MarkerTagInput';
import TripSiblingsSection from './TripSiblingsSection';
import MarkerDistance from './MarkerDistance';
import PilgrimageSection from './PilgrimageSection';
import { isCloudEnabled } from '../lib/cloudConfig';
import { useMarkerDetailFields } from '../hooks/useMarkerDetailFields';

export default function MarkerDetails({
  marker,
  markers = [],
  onEdit,
  onDelete,
  onClose,
  onOpenDetail,
  onViewImage,
  onTagSearch,
  onSelectMarker,
  onLoginClick,
  onGalleryUpdated,
}) {
  const { typeInfo, localDesc, tripSummary, siblings } = useMarkerDetailFields(marker, markers);

  if (!marker) return null;

  const hasImages = marker.images && marker.images.length > 0;

  return (
    <div className="space-y-2">
      <div className="memorial-card">
        <div
          className="px-3 py-2 flex items-center justify-between border-b border-memorial-border"
          style={{ backgroundColor: marker.color + '18' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{marker.icon}</span>
            <span
              className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
              style={{ backgroundColor: marker.color }}
            >
              {typeInfo.label}
            </span>
          </div>
          <button onClick={onClose} className="text-memorial-muted hover:text-memorial-ink text-sm">
            ✕
          </button>
        </div>

        <div className="px-3 py-3">
          <h3 className="font-bold font-memorial text-memorial-navy text-base mb-1">{marker.name}</h3>
          {marker.title && <p className="text-sm font-medium text-memorial-muted mb-2">{marker.title}</p>}
          {marker.date && (
            <p className="text-xs text-memorial-muted mb-2">
              📅 {marker.date}
              {marker.endDate ? ` — ${marker.endDate}` : ''}
            </p>
          )}
          {marker.tags?.length > 0 && (
            <MarkerTagPills tags={marker.tags} onTagClick={onTagSearch} className="mb-2" />
          )}
          {tripSummary && (
            <p className="text-sm text-memorial-muted leading-relaxed mb-2 border-l-2 border-memorial-gold pl-2">
              {tripSummary.length > 120 ? `${tripSummary.slice(0, 120)}…` : tripSummary}
            </p>
          )}
          {localDesc && <p className="text-sm text-memorial-ink leading-relaxed mb-3">{localDesc}</p>}
          <TripSiblingsSection siblings={siblings} onSelectMarker={onSelectMarker} compact />
          <div className="flex items-center justify-between gap-2 text-xs text-memorial-muted mb-3">
            <span className="min-w-0 truncate">
              📍 {marker.latitude.toFixed(4)}, {marker.longitude.toFixed(4)}
            </span>
            <MarkerDistance latitude={marker.latitude} longitude={marker.longitude} />
          </div>

          {hasImages && (
            <div className="mb-3">
              <p className="text-xs font-medium text-memorial-muted mb-2">📸 图片库 ({marker.images.length})</p>
              <div className="grid grid-cols-3 gap-1.5">
                {marker.images.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onViewImage?.(i)}
                    className="aspect-square rounded-lg overflow-hidden border border-memorial-border hover:border-memorial-gold transition-colors bg-memorial-cream-dark"
                  >
                    <img src={img.data} alt={`${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {marker.sources && marker.sources.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-memorial-muted mb-1">资料来源</p>
              <ul className="space-y-1">
                {marker.sources.map((s, i) => (
                  <li key={i} className="text-xs text-memorial-muted">
                    📄 {s.title}
                    {s.note ? ` — ${s.note}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t border-memorial-border">
            <button
              onClick={() => onOpenDetail && onOpenDetail(marker)}
              className="flex-1 text-sm py-1.5 px-3 rounded-lg memorial-btn-primary"
            >
              📖 详情
            </button>
            {onEdit && (
              <button
                onClick={() => onEdit(marker)}
                className="flex-1 text-sm py-1.5 px-3 rounded-lg memorial-btn-secondary"
              >
                ✏️ 编辑
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(marker.id)}
                className="flex-1 text-sm py-1.5 px-3 rounded-lg border border-red-200 hover:bg-red-50 text-red-500 transition-colors"
              >
                🗑️ 删除
              </button>
            )}
          </div>
        </div>
      </div>

      {isCloudEnabled() && (
        <div className="memorial-card">
          <PilgrimageSection
            embedded
            marker={marker}
            onLoginClick={onLoginClick}
            onGalleryUpdated={onGalleryUpdated}
          />
        </div>
      )}
    </div>
  );
}
