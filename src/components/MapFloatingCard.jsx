import React, { useState } from 'react';
import { MARKER_TYPES } from '../utils/constants';
import LocationInput from './LocationInput';
import DatePicker from './DatePicker';

export default function MapFloatingCard({ coords, pixelPos, containerSize, onQuickSave, onMoreDetails, onCancel }) {
  const [type, setType] = useState('spot');
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [lat, setLat] = useState(coords ? coords.lat.toFixed(6) : '');
  const [lng, setLng] = useState(coords ? coords.lng.toFixed(6) : '');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const CARD_W = 320;
  const CARD_H = 240; // approximate

  // Position card above and centered on click point, clamped within container
  const rawLeft = pixelPos.x - CARD_W / 2;
  const rawTop = pixelPos.y - CARD_H - 12;

  const maxLeft = (containerSize?.width || 800) - CARD_W - 8;
  const clampedLeft = Math.max(8, Math.min(rawLeft, maxLeft));
  const clampedTop = rawTop < 8 ? pixelPos.y + 16 : rawTop;

  // Triangle points down toward click, positioned relative to card
  const triangleLeft = pixelPos.x - clampedLeft - 8; // center arrow at click x
  const showTriangleBelow = clampedTop === rawTop; // card is above click point

  const inputClass =
    'w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-400 bg-white';
  const labelClass = 'text-xs font-medium text-gray-500 mb-1 block';

  const buildData = () => {
    const typeInfo = MARKER_TYPES[type];
    return {
      type,
      name,
      date,
      endDate: endDate || undefined,
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      color: typeInfo.color,
      icon: typeInfo.icon,
      title: '',
      description: '',
      images: [],
      sources: [],
    };
  };

  const handleQuickSave = () => {
    if (!name.trim()) return;
    onQuickSave(buildData());
  };

  const handleMoreDetails = () => {
    onMoreDetails({
      type,
      name,
      date,
      endDate: endDate || undefined,
      latitude: lat,
      longitude: lng,
    });
  };

  return (
    <div
      className="absolute z-[9999] pointer-events-auto"
      style={{ left: clampedLeft, top: clampedTop, width: CARD_W }}
    >
      {/* Card body */}
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-visible">
        {/* Header */}
        <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between rounded-t-xl">
          <span className="text-xs font-semibold text-gray-600">📍 添加地点标记</span>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 text-xs leading-none"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-3 py-3 space-y-2.5">
          {/* Type selector */}
          <div>
            <label className={labelClass}>类型</label>
            <div className="flex gap-1.5">
              {Object.entries(MARKER_TYPES).map(([key, t]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setType(key)}
                  className={`flex-1 py-1 text-xs rounded-lg border transition-colors ${
                    type === key
                      ? 'text-white border-transparent'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                  style={type === key ? { backgroundColor: t.color, borderColor: t.color } : {}}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Name with autocomplete */}
          <div>
            <label className={labelClass}>地点名称</label>
            <LocationInput
              value={name}
              onChange={(v) => setName(v)}
              onSelect={({ name: n, lat: la, lng: lo }) => {
                setName(n);
                setLat(la.toFixed(6));
                setLng(lo.toFixed(6));
              }}
              placeholder="搜索或输入地点名称"
              inputClass={inputClass}
            />
          </div>

          {/* Date */}
          <div>
            <label className={labelClass}>日期</label>
            <button
              type="button"
              onClick={() => setShowDatePicker(!showDatePicker)}
              className={`w-full py-1.5 px-2.5 rounded-lg border text-xs font-medium transition-colors ${
                showDatePicker
                  ? 'bg-blue-50 border-blue-400 text-blue-600'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              📅 选择日期
            </button>
            {date && (
              <div className="text-xs text-gray-600 mt-1 px-2 py-1 bg-blue-50 rounded-lg">
                {date}{endDate ? ` — ${endDate}` : ''}
              </div>
            )}
            {showDatePicker && (
              <div className="mt-2 absolute z-[10000] bg-white rounded-lg border border-gray-200">
                <DatePicker
                  onSelect={({ date: d, endDate: ed }) => {
                    setDate(d);
                    setEndDate(ed || '');
                    setShowDatePicker(false);
                  }}
                  initialDate={date}
                  initialEndDate={endDate}
                  onClose={() => setShowDatePicker(false)}
                />
              </div>
            )}
          </div>

          {/* Coords display */}
          <div className="text-xs text-gray-400">
            {lat}, {lng}
          </div>
        </div>

        {/* Footer */}
        <div className="px-3 pb-3 flex gap-2">
          <button
            type="button"
            onClick={handleQuickSave}
            disabled={!name.trim()}
            className="flex-1 py-1.5 text-xs rounded-lg text-white font-medium transition-opacity disabled:opacity-40"
            style={{ backgroundColor: MARKER_TYPES[type].color }}
          >
            快速保存
          </button>
          <button
            type="button"
            onClick={handleMoreDetails}
            className="flex-1 py-1.5 text-xs rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 font-medium"
          >
            更多详情
          </button>
        </div>
      </div>

      {/* Triangle pointer */}
      {showTriangleBelow && (
        <div
          className="absolute w-0 h-0 pointer-events-none"
          style={{
            left: Math.max(8, Math.min(triangleLeft, CARD_W - 24)),
            top: '100%',
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '10px solid white',
            filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.1))',
          }}
        />
      )}
    </div>
  );
}
