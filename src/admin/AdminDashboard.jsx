import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SAMPLE_MARKERS, DATA_VERSION } from '../utils/constants';
import {
  upsertCloudMarkersBatch,
  upsertCloudGalleryBatch,
  buildGalleryFromMarkers,
  setCloudDataVersion,
  fetchCloudMarkers,
  parseMarkersImport,
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

  const syncMarkersToCloud = async (markers, label) => {
    const markerCount = await upsertCloudMarkersBatch(markers);
    const galleryItems = buildGalleryFromMarkers(markers);
    const galleryCount = await upsertCloudGalleryBatch(galleryItems);
    await setCloudDataVersion(DATA_VERSION);
    setCount(markerCount);
    setStatus(`完成（${label}）：${markerCount} 条地点，${galleryCount} 条影像已同步至云端。`);
  };

  const handleSeed = async () => {
    if (
      !window.confirm(
        `将 Git 内置 ${SAMPLE_MARKERS.length} 条地点写入云端（不含浏览器里曾单独添加的数据；已存在 id 会覆盖）。继续？`
      )
    ) {
      return;
    }
    setBusy(true);
    setStatus('');
    try {
      await syncMarkersToCloud(SAMPLE_MARKERS, '内置样本');
    } catch (err) {
      setStatus(`失败：${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const handleJsonImport = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setBusy(true);
    setStatus('');
    try {
      const text = await file.text();
      const parsed = parseMarkersImport(text);
      if (!parsed.length) throw new Error('文件中没有地点数据');

      if (
        !window.confirm(
          `从 JSON 导入 ${parsed.length} 条地点到云端（相同 id 会覆盖，不会删除云端多余 id）。继续？`
        )
      ) {
        return;
      }

      await syncMarkersToCloud(parsed, 'JSON 导入');
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
          「导入内置数据」只写入 Git 仓库里的 <strong>{SAMPLE_MARKERS.length} 条</strong>官方样本。
          若你之前在浏览器里录入过更多地点（存在 localStorage），请用下方 JSON 导入恢复。
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSeed}
            disabled={busy}
            className="px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-sm font-medium disabled:opacity-50"
          >
            {busy ? '导入中…' : '导入内置数据到云端'}
          </button>
          <label className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium cursor-pointer disabled:opacity-50">
            从 JSON 文件导入
            <input
              type="file"
              accept=".json,application/json"
              className="hidden"
              disabled={busy}
              onChange={handleJsonImport}
            />
          </label>
        </div>
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
