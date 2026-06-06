import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SAMPLE_MARKERS, DATA_VERSION } from '../utils/constants';
import {
  upsertCloudMarkersBatch,
  upsertCloudGalleryBatch,
  buildGalleryFromMarkers,
  setCloudDataVersion,
  fetchCloudMarkers,
} from '../services/cloudData';

export default function AdminDashboard() {
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [count, setCount] = useState(null);

  React.useEffect(() => {
    fetchCloudMarkers()
      .then((rows) => setCount(rows?.length ?? 0))
      .catch(() => setCount(null));
  }, []);

  const handleSeed = async () => {
    if (!window.confirm(`将内置 ${SAMPLE_MARKERS.length} 条地点及关联影像写入云端（已存在 id 会覆盖）。继续？`)) {
      return;
    }
    setBusy(true);
    setStatus('');
    try {
      const markerCount = await upsertCloudMarkersBatch(SAMPLE_MARKERS);
      const galleryItems = buildGalleryFromMarkers(SAMPLE_MARKERS);
      const galleryCount = await upsertCloudGalleryBatch(galleryItems);
      await setCloudDataVersion(DATA_VERSION);
      setCount(markerCount);
      setStatus(`完成：${markerCount} 条地点，${galleryCount} 条影像已同步至云端。`);
    } catch (err) {
      setStatus(`失败：${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-gray-900">概览</h1>
        <p className="text-sm text-gray-600 mt-1">MVP：仅超级管理员可编辑云端主数据；访客从云端只读加载。</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">云端地点</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{count ?? '—'}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">内置样本（Git）</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{SAMPLE_MARKERS.length}</p>
          <p className="text-xs text-gray-400 mt-1">DATA_VERSION {DATA_VERSION}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-800">首次上云</h2>
        <p className="text-sm text-gray-600">
          在 Supabase 执行 <code className="text-xs bg-gray-100 px-1 rounded">supabase/schema.sql</code> 并配置环境变量后，
          点击下方按钮将当前内置数据导入云端。
        </p>
        <button
          type="button"
          onClick={handleSeed}
          disabled={busy}
          className="px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-sm font-medium disabled:opacity-50"
        >
          {busy ? '导入中…' : '导入内置数据到云端'}
        </button>
        {status && (
          <p className={`text-sm ${status.startsWith('失败') ? 'text-red-600' : 'text-green-700'}`}>{status}</p>
        )}
      </div>

      <div className="flex gap-3">
        <Link
          to="/admin/markers"
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
        >
          管理地点 →
        </Link>
      </div>
    </div>
  );
}
