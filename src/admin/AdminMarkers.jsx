import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCloudMarkers, deleteCloudMarker, addCloudRemovedMarkerId } from '../services/cloudData';
import { MARKER_TYPES } from '../utils/constants';
import { useI18n } from '../i18n/LanguageContext';

export default function AdminMarkers() {
  const { markerTypeLabel } = useI18n();
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    fetchCloudMarkers()
      .then(setMarkers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return markers;
    return markers.filter(
      (m) =>
        m.name?.toLowerCase().includes(q) ||
        m.id?.toLowerCase().includes(q) ||
        m.title?.toLowerCase().includes(q)
    );
  }, [markers, query]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`确定删除「${name}」？此操作不可撤销。`)) return;
    try {
      await Promise.all([deleteCloudMarker(id), addCloudRemovedMarkerId(id)]);
      setMarkers((prev) => prev.filter((m) => m.id !== id));
    } catch (e) {
      window.alert(e.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-gray-900">地点管理</h1>
        <Link
          to="/admin/markers/new"
          className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
        >
          + 新建
        </Link>
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="搜索名称、id…"
        className="w-full max-w-md px-3 py-2 text-sm border border-gray-300 rounded-lg"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-sm text-gray-500">加载中…</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {filtered.map((m) => {
              const typeInfo = MARKER_TYPES[m.type] || MARKER_TYPES.spot;
              return (
                <li key={m.id} className="px-4 py-3 flex items-start gap-3 hover:bg-gray-50">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                    style={{ backgroundColor: typeInfo.color }}
                  >
                    {typeInfo.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-gray-900 truncate">{m.name}</span>
                      <span className="text-[10px] text-gray-400">{m.id}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {markerTypeLabel(m.type)}
                      {m.date ? ` · ${m.date}` : ''}
                      {m.images?.length ? ` · ${m.images.length} 图` : ''}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Link
                      to={`/admin/markers/${encodeURIComponent(m.id)}`}
                      className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-white"
                    >
                      编辑
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(m.id, m.name)}
                      className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50"
                    >
                      删除
                    </button>
                  </div>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-gray-400">暂无数据，请先在概览页导入内置数据。</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
