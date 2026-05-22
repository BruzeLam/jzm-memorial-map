import React, { useState, useEffect, useRef } from 'react';
import { MARKER_TYPES } from '../utils/constants';
import { getRegionSuggestions } from '../utils/regionNormalization';
import DatePicker from './DatePicker';

// ─── Reverse geocoding hook ─────────────────────────────────────────────────
function useReverseGeocoding(lat, lng) {
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!lat || !lng) {
      setAddress(null);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=zh-CN`,
          { headers: { 'Accept-Language': 'zh-CN,zh;q=0.9' } }
        );
        const data = await res.json();
        setAddress(data.address || null);
      } catch (e) {
        setAddress(null);
      } finally {
        setLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [lat, lng]);

  return { address, loading };
}

// ─── Extract administrative info ─────────────────────────────────────────────
const DIRECT_MUNICIPALITIES = new Set(['北京市', '上海市', '天津市', '重庆市']);

function extractAdminInfo(address) {
  if (!address) return { country: '', province: '', city: '' };

  const country = address.country || '';
  const state = address.state || address.province || '';

  // 直辖市：state 本身就是市（北京市/上海市等），city 取区级
  if (DIRECT_MUNICIPALITIES.has(state)) {
    const city = address.city || address.city_district || address.suburb || address.county || '';
    return { country, province: state, city };
  }

  // 普通省份：目标是国家/省/市，跳过区县级
  // Nominatim 有时将区（如"槐荫区"）放在 city 字段，需要优先找以"市"结尾的值
  const candidates = [
    address.city,
    address.municipality,
    address.county,
    address.town,
  ].filter(Boolean);

  // 优先：以"市"结尾的字段（市级）
  let city = candidates.find(c => c.endsWith('市')) || '';

  // 其次：不以区/县/旗结尾的字段
  if (!city) {
    city = candidates.find(c => !c.endsWith('区') && !c.endsWith('县') && !c.endsWith('旗')) || '';
  }

  // 兜底：任意候选值
  if (!city) city = candidates[0] || '';

  return { country, province: state, city };
}

// ─── Location search hook ───────────────────────────────────────────────────
function useLocationSearch(query) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&addressdetails=1&accept-language=zh-CN`,
          { headers: { 'Accept-Language': 'zh-CN,zh;q=0.9' } }
        );
        const data = await res.json();
        setResults(data);
      } catch (e) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  return { results, loading };
}

function formatRegion(address) {
  if (!address) return '';
  const parts = [];
  if (address.country) parts.push(address.country);
  if (address.state || address.province) parts.push(address.state || address.province);
  if (address.city || address.county || address.town)
    parts.push(address.city || address.county || address.town);
  return parts.slice(0, 3).join(' / ');
}

// ─── LocationInput component ─────────────────────────────────────────────────
export function LocationInput({ value, onChange, onSelect, placeholder, inputClass }) {
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState(value || '');
  const { results, loading } = useLocationSearch(focused ? query : '');
  const containerRef = useRef(null);

  // Keep query in sync when value is set externally (e.g. coord pre-fill resets name)
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  const handleChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    onChange(v);
  };

  const handleSelect = (item) => {
    const name = item.name || item.display_name.split(',')[0].trim();
    const adminInfo = extractAdminInfo(item.address);
    setQuery(name);
    onChange(name);
    onSelect({
      name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      country: adminInfo.country,
      province: adminInfo.province,
      city: adminInfo.city,
    });
    setFocused(false);
  };

  const showDropdown = focused && (results.length > 0 || loading);

  return (
    <div className="relative" ref={containerRef}>
      <input
        className={inputClass}
        value={query}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 180)}
        placeholder={placeholder || '如：北京、虎门大桥'}
      />
      {showDropdown && (
        <div className="absolute z-[10000] left-0 right-0 top-full mt-0.5 bg-white border border-gray-200 rounded-lg shadow-xl max-h-52 overflow-y-auto">
          {loading && (
            <div className="px-3 py-2 text-xs text-gray-400 flex items-center gap-2">
              <span className="inline-block w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              搜索中…
            </div>
          )}
          {!loading && results.map((item, i) => {
            const shortName = (item.name || item.display_name.split(',')[0].trim()).slice(0, 22);
            const region = formatRegion(item.address);
            return (
              <button
                key={i}
                type="button"
                onMouseDown={() => handleSelect(item)}
                className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-0"
              >
                <div className="text-sm font-medium text-gray-800 truncate">{shortName}</div>
                {region && (
                  <div className="text-xs text-gray-400 truncate">{region}</div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main form ───────────────────────────────────────────────────────────────
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

  // Auto-fill admin info when reverse geocoding completes
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

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setForm((prev) => ({
          ...prev,
          images: [...prev.images, { url: event.target.result, uploadedAt: new Date().toISOString().split('T')[0] }],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const typeInfo = MARKER_TYPES[form.type];
    const data = {
      ...form,
      latitude: parseFloat(form.latitude),
      longitude: parseFloat(form.longitude),
      color: typeInfo.color,
      icon: typeInfo.icon,
      images: form.images,
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
              // 自动跳转到选中的位置
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

        <div>
          <label className={labelClass}>图片</label>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full text-sm py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            📁 选择图片
          </button>
          {form.images.length > 0 && (
            <div className="mt-2 grid grid-cols-4 gap-2">
              {form.images.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded overflow-hidden border border-gray-200">
                  <img src={img.url} alt="缩略图" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-0 right-0 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
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
