import React from 'react';
import { MARKER_TYPES } from '../utils/constants';
import { formatTripSiblingCount, formatTripSiblingHeading } from '../utils/markerTrips';

/**
 * 同行程相关标记列表（足迹 / 历史事件 / 题字等，仅由标签关联，不区分类型）
 */
export default function TripSiblingsSection({
  siblings,
  onSelectMarker,
  compact = false,
}) {
  if (!siblings?.length) return null;

  if (compact) {
    return (
      <p className="text-xs text-blue-600 mb-2">{formatTripSiblingCount(siblings.length)}</p>
    );
  }

  return (
    <div className="mb-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">
        {formatTripSiblingHeading(siblings.length)}
      </h4>
      <ul className="space-y-1.5">
        {siblings.map((sib) => {
          const typeInfo = MARKER_TYPES[sib.type] || MARKER_TYPES.spot;
          return (
            <li key={sib.id}>
              <button
                type="button"
                onClick={() => onSelectMarker?.(sib.id)}
                className="w-full text-left px-3 py-2 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors flex items-center gap-2"
              >
                <span className="text-base flex-shrink-0" title={typeInfo.label}>
                  {typeInfo.icon}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-800">{sib.name}</span>
                  {sib.title && (
                    <span className="text-xs text-gray-500 ml-1.5">{sib.title}</span>
                  )}
                </span>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full text-white flex-shrink-0"
                  style={{ backgroundColor: typeInfo.color }}
                >
                  {typeInfo.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
