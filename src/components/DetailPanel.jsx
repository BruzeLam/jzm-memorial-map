import React, { useState } from 'react';
import { MARKER_TYPES } from '../utils/constants';
import { formatRegionPath } from '../utils/regionFormat';
import {
  getTripSiblings,
  resolveTripSummary,
  resolveLocalDescription,
} from '../utils/markerTrips';
import { MarkerTagPills } from './MarkerTagInput';
import TripSiblingsSection from './TripSiblingsSection';
import ImageViewer from './ImageViewer';
import MarkerDistance from './MarkerDistance';
import PilgrimageSection from './PilgrimageSection';

export default function DetailPanel({
  marker,
  markers = [],
  onClose,
  onSelectMarker,
  onTagSearch,
  onLoginClick,
  onGalleryUpdated,
}) {
  const [viewingImageIndex, setViewingImageIndex] = useState(null);

  if (!marker) return null;

  const typeInfo = MARKER_TYPES[marker.type] || MARKER_TYPES.spot;
  const localDesc = resolveLocalDescription(marker);
  const tripSummary = resolveTripSummary(marker, markers);
  const siblings = getTripSiblings(markers, marker);

  return (
    <div
      className="fixed inset-0 z-[5000] flex items-end md:items-center justify-center p-0 md:p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full max-w-2xl mx-0 md:mx-4 flex flex-col mobile-detail-panel pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0"
          style={{ backgroundColor: marker.color + '18' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl md:text-3xl flex-shrink-0">{marker.icon}</span>
            <div className="min-w-0">
              <h2 className="text-lg md:text-xl font-bold text-gray-800 truncate">{marker.name}</h2>
              <span
                className="inline-block text-xs px-2 py-0.5 rounded-full text-white font-medium mt-1"
                style={{ backgroundColor: marker.color }}
              >
                {typeInfo.label}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center text-gray-400 hover:text-gray-600 text-2xl leading-none transition-colors flex-shrink-0 -mr-1"
            aria-label="关闭"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 md:px-6 py-4">
          {marker.tags?.length > 0 && (
            <MarkerTagPills
              tags={marker.tags}
              onTagClick={onTagSearch}
              className="mb-3"
            />
          )}

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-4">
            {marker.title && (
              <h3 className="font-bold text-lg text-gray-800 mb-3">{marker.title}</h3>
            )}

            <div className="space-y-2 mb-3">
              {marker.date && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600 min-w-16">📅 时间:</span>
                  <span className="text-gray-800 font-medium">
                    {marker.date}{marker.endDate ? ` — ${marker.endDate}` : ''}
                  </span>
                </div>
              )}
              {formatRegionPath(marker) && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600 min-w-16">🌍 地区:</span>
                  <span className="text-gray-800">{formatRegionPath(marker)}</span>
                </div>
              )}
              <div className="flex items-center justify-between gap-2 text-sm flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-gray-600 min-w-16">📍 坐标:</span>
                  <span className="text-gray-800 font-mono">
                    {marker.latitude.toFixed(6)}, {marker.longitude.toFixed(6)}
                  </span>
                </div>
                <MarkerDistance
                  latitude={marker.latitude}
                  longitude={marker.longitude}
                  className="text-sm"
                />
              </div>
            </div>

            {tripSummary && (
              <div className="mb-3">
                <h4 className="text-xs font-semibold text-gray-700 mb-1">行程总述</h4>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {tripSummary}
                </p>
              </div>
            )}

            {localDesc && (
              <div className="mb-3">
                <h4 className="text-xs font-semibold text-gray-700 mb-1">本地点说明</h4>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {localDesc}
                </p>
              </div>
            )}

            {marker.sources && marker.sources.length > 0 && (
              <div className="mb-3">
                <h4 className="text-xs font-semibold text-gray-700 mb-1">资料来源</h4>
                <ul className="space-y-1">
                  {marker.sources.map((s, i) => (
                    <li key={i} className="text-xs text-gray-600">
                      <div className="flex gap-2">
                        <span className="text-gray-400">•</span>
                        <div>
                          <div className="font-medium text-gray-700">{s.title}</div>
                          {s.note && <div className="text-xs text-gray-500">{s.note}</div>}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <TripSiblingsSection siblings={siblings} onSelectMarker={onSelectMarker} />

          {marker.images && marker.images.length > 0 && (
            <div className="mt-6 mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                📸 图片库 ({marker.images.length})
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-w-sm">
                {marker.images.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setViewingImageIndex(i)}
                    className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 hover:opacity-95 transition-colors bg-gray-100"
                  >
                    <img src={img.data} alt={img.name || ''} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <PilgrimageSection
            marker={marker}
            onLoginClick={onLoginClick}
            onGalleryUpdated={onGalleryUpdated}
          />
        </div>
      </div>

      {viewingImageIndex !== null && marker.images?.length > 0 && (
        <ImageViewer
          images={marker.images}
          initialIndex={viewingImageIndex}
          onClose={() => setViewingImageIndex(null)}
        />
      )}
    </div>
  );
}
