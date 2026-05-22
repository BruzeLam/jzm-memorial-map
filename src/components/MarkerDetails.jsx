import React from 'react';
import { MARKER_TYPES } from '../utils/constants';

export default function MarkerDetails({ marker, onEdit, onDelete, onClose, onOpenDetail, onViewImage }) {
  if (!marker) return null;

  const typeInfo = MARKER_TYPES[marker.type] || MARKER_TYPES.spot;
  const hasImages = marker.images && marker.images.length > 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-3 py-2 flex items-center justify-between" style={{ backgroundColor: marker.color + '18' }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{marker.icon}</span>
          <span
            className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
            style={{ backgroundColor: marker.color }}
          >
            {typeInfo.label}
          </span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
      </div>

      <div className="px-3 py-3">
        <h3 className="font-bold text-gray-900 text-base mb-1">{marker.name}</h3>
        {marker.title && (
          <p className="text-sm font-medium text-gray-600 mb-2">{marker.title}</p>
        )}
        {marker.date && (
          <p className="text-xs text-gray-400 mb-2">
            📅 {marker.date}{marker.endDate ? ` — ${marker.endDate}` : ''}
          </p>
        )}
        {marker.description && (
          <p className="text-sm text-gray-700 leading-relaxed mb-3">{marker.description}</p>
        )}
        <p className="text-xs text-gray-400 mb-3">
          📍 {marker.latitude.toFixed(4)}, {marker.longitude.toFixed(4)}
        </p>

        {hasImages && (
          <div className="mb-3">
            <p className="text-xs font-medium text-gray-500 mb-2">📸 图片库 ({marker.images.length})</p>
            <div className="grid grid-cols-3 gap-1.5">
              {marker.images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onViewImage?.(i)}
                  className="aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors bg-gray-100"
                >
                  <img
                    src={img.data}
                    alt={`${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {marker.sources && marker.sources.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-medium text-gray-500 mb-1">资料来源</p>
            <ul className="space-y-1">
              {marker.sources.map((s, i) => (
                <li key={i} className="text-xs text-gray-600">
                  📄 {s.title}{s.note ? ` — ${s.note}` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-2 pt-2 border-t border-gray-100">
          <button
            onClick={() => onOpenDetail && onOpenDetail(marker)}
            className="flex-1 text-sm py-1.5 px-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors font-medium"
          >
            📖 详情
          </button>
          <button
            onClick={() => onEdit(marker)}
            className="flex-1 text-sm py-1.5 px-3 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
          >
            ✏️ 编辑
          </button>
          <button
            onClick={() => onDelete(marker.id)}
            className="flex-1 text-sm py-1.5 px-3 rounded-lg border border-red-200 hover:bg-red-50 text-red-500 transition-colors"
          >
            🗑️ 删除
          </button>
        </div>
      </div>
    </div>
  );
}
