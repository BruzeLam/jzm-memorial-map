import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SAMPLE_MARKERS, DATA_VERSION } from '../utils/constants';
import { loadLegacyLocalMarkers, loadLegacyLocalGallery } from '../utils/legacyStorage';
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
  const [localMarkerCount] = useState(() => loadLegacyLocalMarkers().length);
  const [localGalleryCount] = useState(() => loadLegacyLocalGallery().length);

  React.useEffect(() => {
    fetchCloudMarkers()
      .then((rows) => setCount(rows?.length ?? 0))
      .catch(() => setCount(null));
  }, []);

  const syncMarkersToCloud = async (markers, label, extraGallery = []) => {
    const markerCount = await upsertCloudMarkersBatch(markers);
    const fromMarkers = buildGalleryFromMarkers(markers);
    const galleryById = new Map(fromMarkers.map((item) => [item.id, item]));
    extraGallery.forEach((item) => {
      if (item?.id) galleryById.set(item.id, item);
    });
    const galleryCount = await upsertCloudGalleryBatch([...galleryById.values()]);
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

  const handleLocalStorageImport = async () => {
    const markers = loadLegacyLocalMarkers();
    const gallery = loadLegacyLocalGallery();
    if (!markers.length) {
      setStatus('失败：本浏览器未找到旧地点数据（jzm_memorial_markers）。请换曾录入数据的浏览器/设备再试。');
      return;
    }

    if (
      !window.confirm(
        `从本浏览器 localStorage 导入 ${markers.length} 条地点` +
          (gallery.length ? `、${gallery.length} 条影像` : '') +
          ' 到云端（相同 id 会覆盖）。继续？'
      )
    ) {
      return;
    }

    setBusy(true);
    setStatus('');
    try {
      await syncMarkersToCloud(markers, '浏览器本地恢复', gallery);
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
        <h2 className="text-sm font-semibold text-gray-800">数据恢复 / 导入</h2>
        <p className="text-sm text-gray-600">
          上云 MVP 最初只导入了 Git 里的 <strong>{SAMPLE_MARKERS.length} 条</strong>官方样本。
          若你曾在<strong>本浏览器</strong>录入更多地点，旧数据通常还在 localStorage 里，优先用下方绿色按钮恢复。
        </p>
        {localMarkerCount > 0 && (
          <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            检测到本浏览器旧地点 <strong>{localMarkerCount}</strong> 条
            {localGalleryCount > 0 ? `、影像 ${localGalleryCount} 条` : ''}，可一键恢复到云端。
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {localMarkerCount > 0 && (
            <button
              type="button"
              onClick={handleLocalStorageImport}
              disabled={busy}
              className="px-4 py-2 rounded-lg bg-green-700 hover:bg-green-800 text-white text-sm font-medium disabled:opacity-50"
            >
              {busy ? '导入中…' : `从本浏览器恢复（${localMarkerCount} 条）`}
            </button>
          )}
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
          <button
            type="button"
            onClick={handleSeed}
            disabled={busy}
            className="px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-sm font-medium disabled:opacity-50"
          >
            {busy ? '导入中…' : `仅导入 Git 样本（${SAMPLE_MARKERS.length} 条）`}
          </button>
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
