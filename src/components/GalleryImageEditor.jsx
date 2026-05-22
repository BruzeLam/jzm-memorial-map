import React, { useState, useEffect, useRef } from 'react';
import { getRegionSuggestions } from '../utils/regionNormalization';
import LocationInput from './LocationInput';

export default function GalleryImageEditor({
  image,
  markers,
  onSave,
  onCancel,
  onDelete,
}) {
  const [form, setForm] = useState({
    title: image.title || '',
    description: image.description || '',
    location: { ...image.location },
    relatedMarker: image.relatedMarker || null,
  });

  const [provinceSuggestions, setProvinceSuggestions] = useState([]);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showProvinceSuggestions, setShowProvinceSuggestions] = useState(false);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);

  const relatedMarker = form.relatedMarker
    ? markers.find(m => m.id === form.relatedMarker)
    : null;

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const setLocation = (field, value) => {
    setForm((prev) => ({
      ...prev,
      location: { ...prev.location, [field]: value },
    }));
  };

  const handleProvinceChange = (value) => {
    setLocation('province', value);
    if (value.trim()) {
      const suggestions = getRegionSuggestions(value);
      setProvinceSuggestions(suggestions);
      setShowProvinceSuggestions(suggestions.length > 0);
    } else {
      setProvinceSuggestions([]);
      setShowProvinceSuggestions(false);
    }
  };

  const handleCityChange = (value) => {
    setLocation('city', value);
    if (value.trim()) {
      const suggestions = getRegionSuggestions(value);
      setCitySuggestions(suggestions);
      setShowCitySuggestions(suggestions.length > 0);
    } else {
      setCitySuggestions([]);
      setShowCitySuggestions(false);
    }
  };

  const selectProvince = (suggestion) => {
    setLocation('province', suggestion);
    setShowProvinceSuggestions(false);
  };

  const selectCity = (suggestion) => {
    setLocation('city', suggestion);
    setShowCitySuggestions(false);
  };

  const handleSelectMarker = (markerId) => {
    set('relatedMarker', markerId === form.relatedMarker ? null : markerId);
  };

  const inputClass =
    'w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-400 bg-white';
  const labelClass = 'text-xs font-medium text-gray-500 mb-1 block';

  return (
    <div
      className="fixed inset-0 z-[5000] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col"
        style={{ maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800">编辑图片信息</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* 图片预览 */}
          <div>
            <img
              src={image.data}
              alt={image.name}
              className="w-full max-h-48 object-contain rounded-lg border border-gray-200"
            />
          </div>

          {/* 标题 */}
          <div>
            <label className={labelClass}>标题</label>
            <input
              type="text"
              className={inputClass}
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="输入标题"
            />
          </div>

          {/* 描述 */}
          <div>
            <label className={labelClass}>描述</label>
            <textarea
              className={`${inputClass} resize-none`}
              rows={3}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="输入描述"
            />
          </div>

          {/* 地址信息 */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <label className={labelClass}>地址信息</label>

            {/* 国家 */}
            <div className="mb-2">
              <label className="text-xs text-gray-600 block mb-1">国家</label>
              <input
                type="text"
                className={`${inputClass} text-xs`}
                value={form.location.country}
                onChange={(e) => setLocation('country', e.target.value)}
                placeholder="如：中国"
              />
            </div>

            {/* 省份 */}
            <div className="relative mb-2">
              <label className="text-xs text-gray-600 block mb-1">省份</label>
              <input
                type="text"
                className={`${inputClass} text-xs`}
                value={form.location.province}
                onChange={(e) => handleProvinceChange(e.target.value)}
                onFocus={() =>
                  form.location.province && setShowProvinceSuggestions(provinceSuggestions.length > 0)
                }
                onBlur={() => setTimeout(() => setShowProvinceSuggestions(false), 180)}
                placeholder="省份"
              />
              {showProvinceSuggestions && (
                <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {provinceSuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onMouseDown={() => selectProvince(suggestion)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b border-gray-100 last:border-0"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 城市 */}
            <div className="relative mb-2">
              <label className="text-xs text-gray-600 block mb-1">城市</label>
              <input
                type="text"
                className={`${inputClass} text-xs`}
                value={form.location.city}
                onChange={(e) => handleCityChange(e.target.value)}
                onFocus={() =>
                  form.location.city && setShowCitySuggestions(citySuggestions.length > 0)
                }
                onBlur={() => setTimeout(() => setShowCitySuggestions(false), 180)}
                placeholder="城市"
              />
              {showCitySuggestions && (
                <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {citySuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onMouseDown={() => selectCity(suggestion)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b border-gray-100 last:border-0"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 地址 */}
            <div className="mb-2">
              <label className="text-xs text-gray-600 block mb-1">具体地址</label>
              <input
                type="text"
                className={`${inputClass} text-xs`}
                value={form.location.address}
                onChange={(e) => setLocation('address', e.target.value)}
                placeholder="如：市中心广场"
              />
            </div>

            {/* 坐标 */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-600 block mb-1">纬度</label>
                <input
                  type="number"
                  step="any"
                  className={`${inputClass} text-xs`}
                  value={form.location.latitude}
                  onChange={(e) => setLocation('latitude', e.target.value)}
                  placeholder="39.9042"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">经度</label>
                <input
                  type="number"
                  step="any"
                  className={`${inputClass} text-xs`}
                  value={form.location.longitude}
                  onChange={(e) => setLocation('longitude', e.target.value)}
                  placeholder="116.4074"
                />
              </div>
            </div>
          </div>

          {/* 关联地点 */}
          <div>
            <label className={labelClass}>关联地点</label>
            <div className="bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto border border-gray-200">
              {markers.length === 0 ? (
                <div className="text-sm text-gray-400 text-center py-4">
                  暂无地点
                </div>
              ) : (
                <div className="space-y-1">
                  {markers.map((marker) => (
                    <button
                      key={marker.id}
                      type="button"
                      onClick={() => handleSelectMarker(marker.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        form.relatedMarker === marker.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-white border border-gray-200 hover:bg-blue-50 text-gray-700'
                      }`}
                    >
                      {marker.icon} {marker.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {form.relatedMarker && (
              <button
                type="button"
                onClick={() => set('relatedMarker', null)}
                className="mt-2 text-xs text-red-500 hover:text-red-700"
              >
                ✕ 取消关联
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 flex gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('确定要删除这个图片吗？')) {
                onDelete();
              }
            }}
            className="px-4 py-2 text-sm font-medium border border-red-200 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            🗑️ 删除
          </button>
          <div className="flex-1" />
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => onSave(form)}
            className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
