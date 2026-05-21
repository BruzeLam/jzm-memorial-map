import React, { useState, useEffect, useRef } from 'react';
import { MARKER_TYPES } from '../utils/constants';

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
    setQuery(name);
    onChange(name);
    onSelect({ name, lat: parseFloat(item.lat), lng: parseFloat(item.lon) });
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
  date: '',
  title: '',
  description: '',
  sources: [{ title: '', note: '' }],
};

export default function AddMarkerForm({ onSubmit, onCancel, initialCoords, editingMarker, prefillData }) {
  const [form, setForm] = useState(emptyForm);
  const isEditing = !!editingMarker;

  useEffect(() => {
    if (editingMarker) {
      setForm({
        type: editingMarker.type || 'spot',
        name: editingMarker.name || '',
        latitude: editingMarker.latitude ?? '',
        longitude: editingMarker.longitude ?? '',
        date: editingMarker.date || '',
        title: editingMarker.title || '',
        description: editingMarker.description || '',
        sources: editingMarker.sources?.length > 0 ? editingMarker.sources : [{ title: '', note: '' }],
      });
    } else if (prefillData) {
      setForm((prev) => ({
        ...prev,
        type: prefillData.type || prev.type,
        name: prefillData.name || prev.name,
        latitude: prefillData.latitude ?? prev.latitude,
        longitude: prefillData.longitude ?? prev.longitude,
        date: prefillData.date || prev.date,
      }));
    } else if (initialCoords) {
      setForm((prev) => ({
        ...prev,
        latitude: initialCoords.lat.toFixed(6),
        longitude: initialCoords.lng.toFixed(6),
      }));
    }
  }, [editingMarker, initialCoords, prefillData]);

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const setSource = (i, field, value) => {
    const sources = form.sources.map((s, idx) => (idx === i ? { ...s, [field]: value } : s));
    setForm((prev) => ({ ...prev, sources }));
  };

  const addSource = () => setForm((prev) => ({ ...prev, sources: [...prev.sources, { title: '', note: '' }] }));

  const removeSource = (i) =>
    setForm((prev) => ({ ...prev, sources: prev.sources.filter((_, idx) => idx !== i) }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const typeInfo = MARKER_TYPES[form.type];
    const data = {
      ...form,
      latitude: parseFloat(form.latitude),
      longitude: parseFloat(form.longitude),
      color: typeInfo.color,
      icon: typeInfo.icon,
      images: editingMarker?.images || [],
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
            onSelect={({ name, lat, lng }) => {
              setForm((prev) => ({
                ...prev,
                name,
                latitude: lat.toFixed(6),
                longitude: lng.toFixed(6),
              }));
            }}
            placeholder="如：北京、虎门大桥"
            inputClass={inputClass}
          />
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
          <input
            className={inputClass}
            value={form.date}
            onChange={(e) => set('date', e.target.value)}
            placeholder="YYYY-MM-DD 或 YYYY-MM 或 YYYY"
          />
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
