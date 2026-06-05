import React, { useState } from 'react';
import { MARKER_TYPES } from '../utils/constants';
import LocationInput from './LocationInput';
import DatePicker from './DatePicker';
import { useMediaQuery } from '../hooks/useMediaQuery';

function AddMarkerCardBody({
  type,
  setType,
  name,
  setName,
  date,
  endDate,
  setDate,
  setEndDate,
  lat,
  lng,
  setLat,
  setLng,
  showDatePicker,
  setShowDatePicker,
  onCancel,
  onQuickSave,
  onMoreDetails,
  datePickerStyle,
  inputClass,
  labelClass,
}) {
  return (
    <>
      <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between rounded-t-xl md:rounded-t-xl">
        <span className="text-xs font-semibold text-gray-600">📍 添加地点标记</span>
        <button
          type="button"
          onClick={onCancel}
          className="w-10 h-10 md:w-auto md:h-auto flex items-center justify-center text-gray-400 hover:text-gray-600 text-lg leading-none -mr-2"
          aria-label="关闭"
        >
          ✕
        </button>
      </div>

      <div className="px-3 py-3 space-y-2.5">
        <div>
          <label className={labelClass}>类型</label>
          <div className="flex gap-1.5">
            {Object.entries(MARKER_TYPES).map(([key, t]) => (
              <button
                key={key}
                type="button"
                onClick={() => setType(key)}
                className={`flex-1 py-2 md:py-1 text-xs rounded-lg border transition-colors ${
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

        <div className="relative">
          <label className={labelClass}>日期（可选）</label>
          <button
            type="button"
            onClick={() => setShowDatePicker(!showDatePicker)}
            className={`w-full py-2 md:py-1.5 px-2.5 rounded-lg border text-xs font-medium transition-colors ${
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
            <div className="mt-2 z-[10000]" style={datePickerStyle}>
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

        <div className="text-xs text-gray-400">
          {lat}, {lng}
        </div>
      </div>

      <div className="px-3 pb-safe flex gap-2">
        <button
          type="button"
          onClick={onQuickSave}
          disabled={!name.trim()}
          className="flex-1 py-2.5 md:py-1.5 text-xs rounded-lg text-white font-medium transition-opacity disabled:opacity-40"
          style={{ backgroundColor: MARKER_TYPES[type].color }}
        >
          快速保存
        </button>
        <button
          type="button"
          onClick={onMoreDetails}
          className="flex-1 py-2.5 md:py-1.5 text-xs rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 font-medium"
        >
          更多详情
        </button>
      </div>
    </>
  );
}

export default function MapFloatingCard({
  coords,
  pixelPos,
  containerSize,
  onQuickSave,
  onMoreDetails,
  onCancel,
}) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [type, setType] = useState('spot');
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [lat, setLat] = useState(coords ? coords.lat.toFixed(6) : '');
  const [lng, setLng] = useState(coords ? coords.lng.toFixed(6) : '');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const cardW = Math.min(320, (containerSize?.width || 360) - 24);
  const cardH = 380;
  const containerW = containerSize?.width || 800;
  const containerH = containerSize?.height || 600;
  const padding = 12;

  const inputClass =
    'w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 md:py-1.5 focus:outline-none focus:border-blue-400 bg-white';
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

  const bodyProps = {
    type,
    setType,
    name,
    setName,
    date,
    endDate,
    setDate,
    setEndDate,
    lat,
    lng,
    setLat,
    setLng,
    showDatePicker,
    setShowDatePicker,
    onCancel,
    onQuickSave: handleQuickSave,
    onMoreDetails: handleMoreDetails,
    inputClass,
    labelClass,
  };

  if (isMobile) {
    return (
      <>
        <button
          type="button"
          className="fixed inset-0 z-[9998] bg-black/35 border-0 p-0 cursor-pointer"
          aria-label="关闭"
          onClick={onCancel}
        />
        <div className="fixed inset-x-0 bottom-0 z-[9999] pointer-events-auto mobile-bottom-sheet pb-safe">
          <div className="bg-white rounded-t-2xl shadow-2xl border border-gray-200 border-b-0 max-h-[min(88dvh,640px)] overflow-y-auto">
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>
            <AddMarkerCardBody
              {...bodyProps}
              datePickerStyle={{ position: 'relative', maxHeight: 'none', overflow: 'visible' }}
            />
          </div>
        </div>
      </>
    );
  }

  let clampedTop;
  let positionedBelow;
  const rawTop = pixelPos.y - cardH - padding;
  if (rawTop >= padding) {
    clampedTop = rawTop;
    positionedBelow = false;
  } else if (pixelPos.y + cardH + padding <= containerH) {
    clampedTop = pixelPos.y + padding;
    positionedBelow = true;
  } else {
    clampedTop = Math.max(padding, pixelPos.y - cardH - padding);
    positionedBelow = false;
  }

  const rawLeft = pixelPos.x - cardW / 2;
  const maxLeft = containerW - cardW - padding;
  const clampedLeft = Math.max(padding, Math.min(rawLeft, maxLeft));
  const triangleLeft = Math.max(8, Math.min(pixelPos.x - clampedLeft - 8, cardW - 24));

  return (
    <div
      className="absolute z-[9999] pointer-events-auto"
      style={{ left: clampedLeft, top: clampedTop, width: cardW }}
    >
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-visible">
        <AddMarkerCardBody
          {...bodyProps}
          datePickerStyle={{
            position: 'absolute',
            right: 0,
            maxHeight: containerSize?.height ? containerSize.height - clampedTop - 200 : 400,
            overflow: 'auto',
          }}
        />
      </div>

      {positionedBelow && (
        <div
          className="absolute w-0 h-0 pointer-events-none"
          style={{
            left: Math.max(8, Math.min(triangleLeft, cardW - 24)),
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
