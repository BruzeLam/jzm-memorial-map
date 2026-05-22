import React, { useState, useEffect, useRef } from 'react';
import { MARKER_TYPES } from '../utils/constants';
import { getRegionSuggestions } from '../utils/regionNormalization';
import { compressImage } from '../utils/imageCompression';
import { useReverseGeocoding, extractAdminInfo } from '../hooks/useNominatim';
import LocationInput from './LocationInput';
import DatePicker from './DatePicker';

const emptyForm = {
  type: 'spot',
  name: '',
  latitude: '',
  longitude: '',
  country: '',
  province: '',
  city: '',
  date: '',
  endDate: '',
  title: '',
  description: '',
  sources: [{ title: '', note: '' }],
  images: [],
};

export default function AddMarkerForm({ mapRef, onSubmit, onCancel, initialCoords, editingMarker, prefillData }) {
  const [form, setForm] = useState(emptyForm);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [provinceSuggestions, setProvinceSuggestions] = useState([]);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showProvinceSuggestions, setShowProvinceSuggestions] = useState(false);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);
  const isEditing = !!editingMarker;

  const { address } = useReverseGeocoding(form.latitude, form.longitude);

  useEffect(() => {
    if (editingMarker) {
      setForm({
        type: editingMarker.type || 'spot',
        name: editingMarker.name || '',
        latitude: editingMarker.latitude ?? '',
        longitude: editingMarker.longitude ?? '',
        country: editingMarker.country || '',
        province: editingMarker.province || '',
        city: editingMarker.city || '',
        date: editingMarker.date || '',
        endDate: editingMarker.endDate || '',
        title: editingMarker.title || '',
        description: editingMarker.description || '',
        sources: editingMarker.sources?.length > 0 ? editingMarker.sources : [{ title: '', note: '' }],
        images: editingMarker.images || [],
      });
    } else if (prefillData) {
      setForm((prev) => ({
        ...prev,
        type: prefillData.type || prev.type,
        name: prefillData.name || prev.name,
        latitude: prefillData.latitude ?? prev.latitude,
        longitude: prefillData.longitude ?? prev.longitude,
        country: prefillData.country || prev.country,
        province: prefillData.province || prev.province,
        city: prefillData.city || prev.city,
        date: prefillData.date || prev.date,
        endDate: prefillData.endDate || prev.endDate,
      }));
    } else if (initialCoords) {
      setForm((prev) => ({
        ...prev,
        latitude: initialCoords.lat.toFixed(6),
        longitude: initialCoords.lng.toFixed(6),
      }));
    }
  }, [editingMarker, initialCoords, prefillData]);

  useEffect(() => {
    if (address && form.latitude && form.longitude) {
      const adminInfo = extractAdminInfo(address);
      setForm((prev) => ({
        ...prev,
        country: prev.country || adminInfo.country,
        province: prev.province || adminInfo.province,
        city: prev.city || adminInfo.city,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleProvinceChange = (value) => {
    set('province', value);
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
    set('city', value);
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
    set('province', suggestion);
    setShowProvinceSuggestions(false);
    setProvinceSuggestions([]);
  };

  const selectCity = (suggestion) => {
    set('city', suggestion);
    setShowCitySuggestions(false);
    setCitySuggestions([]);
  };

  const setSource = (i, field, value) => {
    const sources = form.sources.map((s, idx) => (idx === i ? { ...s, [field]: value } : s));
    setForm((prev) => ({ ...prev, sources }));
  };

  const addSource = () => setForm((prev) => ({ ...prev, sources: [...prev.sources, { title: '', note: '' }] }));

  const removeSource = (i) =>
    setForm((prev) => ({ ...prev, sources: prev.sources.filter((_, idx) => idx !== i) }));

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const compressed = await compressImage(file);
      setForm((prev) => ({
        ...prev,
        images: [...prev.images, { data: compressed.data, name: compressed.name }],
      }));
    } catch (error) {
      alert(`上传失败: ${error.message}`);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (i) =>
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const typeInfo = MARKER_TYPES[form.type];
    const data = {
      ...form,
      latitude: parseFloat(form.latitude),
      longitude: parseFloat(form.longitude),
      color: typeInfo.color,
      icon: typeInfo.icon,
      sources: form.sources.filter((s) => s.title.trim()),
    };
    onSubmit(data);
  };

  const inputClass =
    'w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-400 bg-white';
  const labelClass = 'text-xs font-medium text-gray-500 mb-1 block';

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{isEditing ? '编辑标记' : '添加标记'}</span>
        <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
      </div>

      <div className="px-3 py-3 space-y-3 max-h-[60vh] overflow-y-auto">
        <div>
          <label className={labelClass}>类型</label>
          <div className="flex gap-2">
            {Object.entries(MARKER_TYPES).map(([key, t]) => (
              <button
                key={key}
                type="button"
                onClick={() => set('type', key)}
                className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${
                  form.type === key
                    ? 'text-white border-transparent'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
                style={form.type === key ? { backgroundColor: t.color, borderColor: t.color } : {}}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>地点名称 *</label>
          <LocationInput
            value={form.name}
            onChange={(v) => set('name', v)}
            onSelect={({ name, lat, lng, country, province, city }) => {
              setForm((prev) => ({
                ...prev,
                name,
                latitude: lat.toFixed(6),
                longitude: lng.toFixed(6),
                country: country || prev.country,
                province: province || prev.province,
                city: city || prev.city,
              }));
              if (mapRef?.current) {
                mapRef.current.flyTo([lat, lng], 11, { duration: 1 });
              }
            }}
            placeholder="如：北京、虎门大桥"
            inputClass={inputClass}
          />
        </div>

        <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
          <label className={labelClass}>行政区划</label>
          <div className="text-sm text-gray-700 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 min-w-12">国家:</span>
              <input
                type="text"
                className={inputClass + ' text-xs'}
                value={form.country}
                onChange={(e) => set('country', e.target.value)}
                placeholder="自动识别或手动输入"
              />
            </div>
            <div className="relative">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 min-w-12">省份:</span>
                <input
                  type="text"
                  className={inputClass + ' text-xs'}
                  value={form.province}
                  onChange={(e) => handleProvinceChange(e.target.value)}
                  onFocus={() => form.province && setShowProvinceSuggestions(provinceSuggestions.length > 0)}
                  onBlur={() => setTimeout(() => setShowProvinceSuggestions(false), 180)}
                  placeholder="自动识别或手动输入"
                />
              </div>
              {showProvinceSuggestions && provinceSuggestions.length > 0 && (
                <div className="absolute z-[10000] left-14 right-0 top-full mt-0.5 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
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
            <div className="relative">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 min-w-12">城市:</span>
                <input
                  type="text"
                  className={inputClass + ' text-xs'}
                  value={form.city}
                  onChange={(e) => handleCityChange(e.target.value)}
                  onFocus={() => form.city && setShowCitySuggestions(citySuggestions.length > 0)}
                  onBlur={() => setTimeout(() => setShowCitySuggestions(false), 180)}
                  placeholder="自动识别或手动输入"
                />
              </div>
              {showCitySuggestions && citySuggestions.length > 0 && (
                <div className="absolute z-[10000] left-14 right-0 top-full mt-0.5 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
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
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelClass}>纬度 *</label>
            <input
              required
              type="number"
              step="any"
              className={inputClass}
              value={form.latitude}
              onChange={(e) => set('latitude', e.target.value)}
              placeholder="39.9042"
            />
          </div>
          <div>
            <label className={labelClass}>经度 *</label>
            <input
              required
              type="number"
              step="any"
              className={inputClass}
              value={form.longitude}
              onChange={(e) => set('longitude', e.target.value)}
              placeholder="116.4074"
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>日期</label>
          <button
            type="button"
            onClick={() => setShowDatePicker(!showDatePicker)}
            className={`w-full py-1.5 px-3 rounded-lg border text-sm font-medium transition-colors ${
              showDatePicker
                ? 'bg-blue-50 border-blue-400 text-blue-600'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            📅 选择日期
          </button>
          {form.date && (
            <div className="text-sm text-gray-600 mt-2 px-2 py-1.5 bg-blue-50 rounded-lg">
              选中: {form.date}{form.endDate ? ` — ${form.endDate}` : ''}
            </div>
          )}
          {showDatePicker && (
            <div className="mt-2">
              <DatePicker
                onSelect={({ date, endDate }) => {
                  set('date', date);
                  set('endDate', endDate || '');
                  setShowDatePicker(false);
                }}
                initialDate={form.date}
                initialEndDate={form.endDate}
                onClose={() => setShowDatePicker(false)}
              />
            </div>
          )}
        </div>

        <div>
          <label className={labelClass}>小标题</label>
          <input
            className={inputClass}
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="简短说明"
          />
        </div>

        <div>
          <label className={labelClass}>详细描述</label>
          <textarea
            className={`${inputClass} resize-none`}
            rows={3}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="详细说明..."
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className={labelClass + ' mb-0'}>📸 图片</label>
            <span className="text-xs text-gray-400">{form.images.length} 张</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            onChange={handleImageUpload}
            disabled={uploadingImage}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
            className={`w-full py-1.5 px-3 rounded-lg border text-sm font-medium transition-colors ${
              uploadingImage
                ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {uploadingImage ? '上传中...' : '+ 添加图片'}
          </button>
          {form.images.length > 0 && (
            <div className="mt-2">
              <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-square border border-gray-200">
                <img
                  src={form.images[form.images.length - 1].data}
                  alt="preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(form.images.length - 1)}
                  className="absolute top-1 right-1 w-6 h-6 rounded bg-red-500 hover:bg-red-600 text-white flex items-center justify-center text-xs"
                >
                  ✕
                </button>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                最新 (共 {form.images.length} 张)
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className={labelClass + ' mb-0'}>资料来源</label>
            <button type="button" onClick={addSource} className="text-xs text-blue-500 hover:text-blue-700">+ 添加</button>
          </div>
          {form.sources.map((s, i) => (
            <div key={i} className="flex gap-1 mb-1">
              <input
                className={`${inputClass} flex-1`}
                value={s.title}
                onChange={(e) => setSource(i, 'title', e.target.value)}
                placeholder="来源标题"
              />
              <input
                className={`${inputClass} w-24`}
                value={s.note}
                onChange={(e) => setSource(i, 'note', e.target.value)}
                placeholder="备注"
              />
              {form.sources.length > 1 && (
                <button type="button" onClick={() => removeSource(i)} className="text-gray-400 hover:text-red-400 text-xs px-1">✕</button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-100 text-gray-600"
        >
          取消
        </button>
        <button
          type="submit"
          className="flex-1 py-1.5 text-sm rounded-lg text-white font-medium"
          style={{ backgroundColor: MARKER_TYPES[form.type].color }}
        >
          {isEditing ? '保存修改' : '添加标记'}
        </button>
      </div>
    </form>
  );
}
