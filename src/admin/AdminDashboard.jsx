import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SAMPLE_MARKERS, DATA_VERSION } from '../utils/constants';
import { loadLegacyLocalMarkers, loadLegacyLocalGallery } from '../utils/legacyStorage';
import {
  BUILTIN_QUOTES,
  loadLegacyLocalQuotes,
  classifyQuotes,
  exportQuotesBackup,
  parseQuotesImport,
} from '../utils/quotesStorage';
import {
  upsertCloudMarkersBatch,
  upsertCloudGalleryBatch,
  buildGalleryFromMarkers,
  setCloudDataVersion,
  fetchCloudMarkers,
  fetchCloudQuotes,
  upsertCloudQuotesBatch,
  parseMarkersImport,
} from '../services/cloudData';

export default function AdminDashboard() {
  const [status, setStatus] = useState('');
  const [quoteStatus, setQuoteStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [quoteBusy, setQuoteBusy] = useState(false);
  const [count, setCount] = useState(null);
  const [quoteCount, setQuoteCount] = useState(null);
  const [localMarkerCount] = useState(() => loadLegacyLocalMarkers().length);
  const [localGalleryCount] = useState(() => loadLegacyLocalGallery().length);
  const [localQuotes] = useState(() => loadLegacyLocalQuotes());
  const localQuoteStats = classifyQuotes(localQuotes);

  React.useEffect(() => {
    fetchCloudMarkers()
      .then((rows) => setCount(rows?.length ?? 0))
      .catch(() => setCount(null));
    fetchCloudQuotes()
      .then((rows) => setQuoteCount(rows?.length ?? 0))
      .catch(() => setQuoteCount(null));
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

  const syncQuotesToCloud = async (quotes, label) => {
    const total = await upsertCloudQuotesBatch(quotes);
    setQuoteCount(total);
    setQuoteStatus(`完成（${label}）：${total} 条语录已同步至云端（内置 ${classifyQuotes(quotes).builtin} · 自添 ${classifyQuotes(quotes).userAdded}）。`);
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

  const handleQuotesLocalImport = async () => {
    const quotes = loadLegacyLocalQuotes();
    if (!quotes.length) {
      setQuoteStatus('失败：本浏览器未找到语录数据（jzm_all_quotes）。');
      return;
    }
    const stats = classifyQuotes(quotes);
    if (
      !window.confirm(
        `将本浏览器 ${stats.total} 条语录上传到云端（内置 ${stats.builtin} · 自添 ${stats.userAdded}）。继续？`
      )
    ) {
      return;
    }
    setQuoteBusy(true);
    setQuoteStatus('');
    try {
      await syncQuotesToCloud(quotes, '浏览器本地恢复');
    } catch (err) {
      setQuoteStatus(`失败：${err.message}`);
    } finally {
      setQuoteBusy(false);
    }
  };

  const handleQuotesJsonImport = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setQuoteBusy(true);
    setQuoteStatus('');
    try {
      const text = await file.text();
      const parsed = parseQuotesImport(text);
      if (!parsed.length) throw new Error('文件中没有语录');

      if (!window.confirm(`从 JSON 导入 ${parsed.length} 条语录到云端。继续？`)) {
        return;
      }
      await syncQuotesToCloud(parsed, 'JSON 导入');
    } catch (err) {
      setQuoteStatus(`失败：${err.message}`);
    } finally {
      setQuoteBusy(false);
    }
  };

  const handleQuotesExport = () => {
    exportQuotesBackup(localQuotes);
    setQuoteStatus(`已下载备份：共 ${localQuoteStats.total} 条（内置 ${localQuoteStats.builtin} · 自添 ${localQuoteStats.userAdded}）。`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-gray-900">概览</h1>
        <p className="text-sm text-gray-600 mt-1">MVP：仅超级管理员可编辑云端主数据；访客从云端只读加载。</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">云端地点</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{count ?? '—'}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">内置地点（Git）</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{SAMPLE_MARKERS.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">云端语录</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{quoteCount ?? '—'}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">本浏览器语录</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{localQuoteStats.total}</p>
          <p className="text-xs text-gray-400 mt-1">
            内置 {localQuoteStats.builtin} · 自添 {localQuoteStats.userAdded}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-800">地点 · 恢复 / 导入</h2>
        <p className="text-sm text-gray-600">
          若你曾在<strong>本浏览器</strong>录入更多地点，旧数据通常还在 localStorage 里，优先用绿色按钮恢复。
        </p>
        {localMarkerCount > 0 && (
          <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            检测到本浏览器旧地点 <strong>{localMarkerCount}</strong> 条
            {localGalleryCount > 0 ? `、影像 ${localGalleryCount} 条` : ''}。
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
              {busy ? '导入中…' : `恢复地点（${localMarkerCount} 条）`}
            </button>
          )}
          <label className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium cursor-pointer disabled:opacity-50">
            地点 JSON 导入
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
            仅 Git 样本（{SAMPLE_MARKERS.length} 条）
          </button>
        </div>
        {status && (
          <p className={`text-sm ${status.startsWith('失败') ? 'text-red-600' : 'text-green-700'}`}>{status}</p>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-800">语录 · 恢复 / 上云</h2>
        <p className="text-sm text-gray-600">
          Git 内置语录 <strong>{BUILTIN_QUOTES.length} 条</strong>；你本浏览器现有{' '}
          <strong>{localQuoteStats.total}</strong> 条（自添 {localQuoteStats.userAdded} 条）。
          首次上云语录需先在 Supabase 执行 <code className="text-xs bg-gray-100 px-1 rounded">supabase/migration-quotes.sql</code>。
        </p>
        {localQuoteStats.total > BUILTIN_QUOTES.length && (
          <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            检测到 {localQuoteStats.userAdded} 条自添语录，可一键上传到云端，所有人可见。
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleQuotesLocalImport}
            disabled={quoteBusy || !localQuoteStats.total}
            className="px-4 py-2 rounded-lg bg-green-700 hover:bg-green-800 text-white text-sm font-medium disabled:opacity-50"
          >
            {quoteBusy ? '上传中…' : `上传本浏览器语录（${localQuoteStats.total} 条）`}
          </button>
          <button
            type="button"
            onClick={handleQuotesExport}
            disabled={!localQuoteStats.total}
            className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-800 text-white text-sm font-medium disabled:opacity-50"
          >
            下载语录备份 JSON
          </button>
          <label className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium cursor-pointer disabled:opacity-50">
            语录 JSON 导入
            <input
              type="file"
              accept=".json,application/json"
              className="hidden"
              disabled={quoteBusy}
              onChange={handleQuotesJsonImport}
            />
          </label>
        </div>
        {quoteStatus && (
          <p className={`text-sm ${quoteStatus.startsWith('失败') ? 'text-red-600' : 'text-green-700'}`}>
            {quoteStatus}
          </p>
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
