import React, { useState, useEffect } from 'react';
import { MARKER_TYPES } from '../utils/constants';

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

export default function AddMarkerForm({ onSubmit, onCancel, initialCoords, editingMarker }) {
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
    } else if (initialCoords) {
      setForm((prev) => ({
        ...prev,
        latitude: initialCoords.lat.toFixed(6),
        longitude: initialCoords.lng.toFixed(6),
      }));
    }
  }, [editingMarker, initialCoords]);

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
          <input required className={inputClass} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="如：北京、虎门大桥" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelClass}>纬度 *</label>
            <input required type="number" step="any" className={inputClass} value={form.latitude} onChange={(e) => set('latitude', e.target.value)} placeholder="39.9042" />
          </div>
          <div>
            <label className={labelClass}>经度 *</label>
            <input required type="number" step="any" className={inputClass} value={form.longitude} onChange={(e) => set('longitude', e.target.value)} placeholder="116.4074" />
          </div>
        </div>

        <div>
          <label className={labelClass}>日期</label>
          <input className={inputClass} value={form.date} onChange={(e) => set('date', e.target.value)} placeholder="YYYY-MM-DD 或 YYYY-MM 或 YYYY" />
        </div>

        <div>
          <label className={labelClass}>小标题</label>
          <input className={inputClass} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="简短说明" />
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
        <button type="button" onClick={onCancel} className="flex-1 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-100 text-gray-600">
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
