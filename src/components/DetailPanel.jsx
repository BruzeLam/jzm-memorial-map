import React, { useState } from 'react';
import { MARKER_TYPES } from '../utils/constants';
import ImageViewer from './ImageViewer';

export default function DetailPanel({ marker, onClose, onAddVisit }) {
  const [viewingImageIndex, setViewingImageIndex] = useState(null);

  if (!marker) return null;

  const typeInfo = MARKER_TYPES[marker.type] || MARKER_TYPES.spot;
  const visits = marker.visits && marker.visits.length > 0
    ? marker.visits
    : [{
        id: 'default',
        date: marker.date,
        endDate: marker.endDate,
        title: marker.title,
        description: marker.description,
        sources: marker.sources,
      }];

  return (
    <div
      className="fixed inset-0 z-[5000] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col"
        style={{ maxHeight: '80vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0"
          style={{ backgroundColor: marker.color + '18' }}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">{marker.icon}</span>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{marker.name}</h2>
              <span
                className="inline-block text-xs px-2 py-0.5 rounded-full text-white font-medium mt-1"
                style={{ backgroundColor: marker.color }}
              >
                {typeInfo.label}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* 访问卡片列表 */}
          <div className="space-y-4">
            {visits.map((visit, idx) => (
              <div key={visit.id || idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                {/* Visit Title */}
                {visit.title && (
                  <h3 className="font-bold text-lg text-gray-800 mb-3">{visit.title}</h3>
                )}

                {/* Visit Info */}
                <div className="space-y-2 mb-3">
                  {visit.date && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600 min-w-16">📅 时间:</span>
                      <span className="text-gray-800 font-medium">
                        {visit.date}{visit.endDate ? ` — ${visit.endDate}` : ''}
                      </span>
                    </div>
                  )}
                  {(marker.country || marker.province || marker.city) && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600 min-w-16">🌍 地区:</span>
                      <span className="text-gray-800">
                        {marker.country}
                        {marker.province ? ` / ${marker.province}` : ''}
                        {marker.city ? ` / ${marker.city}` : ''}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600 min-w-16">📍 坐标:</span>
                    <span className="text-gray-800 font-mono">{marker.latitude.toFixed(6)}, {marker.longitude.toFixed(6)}</span>
                  </div>
                </div>

                {/* Description */}
                {visit.description && (
                  <div className="mb-3">
                    <h4 className="text-xs font-semibold text-gray-700 mb-1">背景说明</h4>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {visit.description}
                    </p>
                  </div>
                )}

                {/* Sources */}
                {visit.sources && visit.sources.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-xs font-semibold text-gray-700 mb-1">资料来源</h4>
                    <ul className="space-y-1">
                      {visit.sources.map((s, i) => (
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
            ))}
          </div>

          {/* 添加访问记录槽位 */}
          {onAddVisit && marker.visits && (
            <div className="mt-4 p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
              <button
                onClick={() => onAddVisit(marker.id)}
                className="w-full py-3 text-red-500 font-semibold hover:bg-red-50 rounded transition-colors"
              >
                + 添加访问记录
              </button>
            </div>
          )}

          {/* Images */}
          {marker.images && marker.images.length > 0 && (
            <div className="mt-6 mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">📸 图片库 ({marker.images.length})</h4>
              <div className="grid grid-cols-2 gap-2">
                {marker.images.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setViewingImageIndex(i)}
                    className="relative w-full h-40 rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors bg-gray-100 group"
                  >
                    <img
                      src={img.data}
                      alt={`${marker.name}-${i}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity">🔍</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {viewingImageIndex !== null && marker.images && (
            <ImageViewer
              images={marker.images}
              initialIndex={viewingImageIndex}
              onClose={() => setViewingImageIndex(null)}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 flex justify-end gap-2 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
