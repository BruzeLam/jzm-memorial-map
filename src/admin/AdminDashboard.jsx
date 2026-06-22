import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { DATA_VERSION } from '../utils/constants';
import { mergeMarkerCatalog } from '../utils/markerCatalog';
import { getCoreBuiltInMarkers, getFullBuiltInMarkers } from '../utils/sampleMarkerCatalog';
import { loadLegacyLocalMarkers, loadLegacyLocalGallery } from '../utils/legacyStorage';
import {
  BUILTIN_QUOTES,
  loadLegacyLocalQuotes,
  classifyQuotes,
  exportQuotesBackup,
  parseQuotesImport,
} from '../utils/quotesStorage';
import {
  BUILTIN_ARCHIVES,
  loadLegacyLocalArchives,
  classifyArchives,
  exportArchivesBackup,
  parseArchivesImport,
} from '../utils/archivesStorage';
import {
  upsertCloudMarkersBatch,
  upsertCloudGalleryBatch,
  buildGalleryFromMarkers,
  setCloudDataVersion,
  fetchCloudMarkers,
  fetchCloudQuotes,
  fetchCloudArchives,
  upsertCloudQuotesBatch,
  upsertCloudArchivesBatch,
  parseMarkersImport,
} from '../services/cloudData';
import { migrateCloudImagesToStorage } from '../services/imageStorage';

async function buildFullMarkerCatalog() {
  const local = loadLegacyLocalMarkers();
  const builtIn = await getFullBuiltInMarkers();
  return mergeMarkerCatalog(local, builtIn);
}

export default function AdminDashboard() {
  const [status, setStatus] = useState('');
  const [quoteStatus, setQuoteStatus] = useState('');
  const [archiveStatus, setArchiveStatus] = useState('');
  const [syncAllStatus, setSyncAllStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [quoteBusy, setQuoteBusy] = useState(false);
  const [archiveBusy, setArchiveBusy] = useState(false);
  const [syncAllBusy, setSyncAllBusy] = useState(false);
  const [imageMigrateBusy, setImageMigrateBusy] = useState(false);
  const [imageMigrateStatus, setImageMigrateStatus] = useState('');
  const [count, setCount] = useState(null);
  const [quoteCount, setQuoteCount] = useState(null);
  const [archiveCount, setArchiveCount] = useState(null);
  const [localMarkerCount] = useState(() => loadLegacyLocalMarkers().length);
  const [fullBuiltInCount, setFullBuiltInCount] = useState(() => getCoreBuiltInMarkers().length);
  const [fullMarkerCatalogCount, setFullMarkerCatalogCount] = useState(null);
  const [localGalleryCount] = useState(() => loadLegacyLocalGallery().length);
  const [localQuotes] = useState(() => loadLegacyLocalQuotes());
  const [localArchives] = useState(() => loadLegacyLocalArchives());
  const localQuoteStats = classifyQuotes(localQuotes);
  const localArchiveStats = classifyArchives(localArchives);

  React.useEffect(() => {
    fetchCloudMarkers()
      .then((rows) => setCount(rows?.length ?? 0))
      .catch(() => setCount(null));
    fetchCloudQuotes()
      .then((rows) => setQuoteCount(rows?.length ?? 0))
      .catch(() => setQuoteCount(null));
    fetchCloudArchives()
      .then((rows) => setArchiveCount(rows?.length ?? 0))
      .catch(() => setArchiveCount(null));
    getFullBuiltInMarkers().then((builtIn) => {
      setFullBuiltInCount(builtIn.length);
      const local = loadLegacyLocalMarkers();
      setFullMarkerCatalogCount(mergeMarkerCatalog(local, builtIn).length);
    });
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

  const syncArchivesToCloud = async (archives, label) => {
    const total = await upsertCloudArchivesBatch(archives);
    setArchiveCount(total);
    const stats = classifyArchives(archives);
    setArchiveStatus(
      `完成（${label}）：${total} 条档案已同步至云端（内置 ${stats.builtin} · 自添 ${stats.userAdded}）。`
    );
  };

  const handleSyncAllLocal = async () => {
    const markers = await buildFullMarkerCatalog();
    const gallery = loadLegacyLocalGallery();
    const quotes = loadLegacyLocalQuotes();
    const archives = loadLegacyLocalArchives();
    const parts = [`${markers.length} 条地点（Git + 本地合并）`];
    if (gallery.length) parts.push(`${gallery.length} 条影像`);
    if (quotes.length) parts.push(`${quotes.length} 条语录`);
    if (archives.length) parts.push(`${archives.length} 条档案`);

    if (
      !window.confirm(
        `将完整数据一次性上传到 Supabase：${parts.join('、')}。\n` +
          '相同 id 以本浏览器本地为准覆盖 Git 内置；语录/档案一并同步。继续？'
      )
    ) {
      return;
    }

    setSyncAllBusy(true);
    setSyncAllStatus('');
    setStatus('');
    setQuoteStatus('');
    setArchiveStatus('');
    try {
      await syncMarkersToCloud(markers, '全部同步', gallery);
      if (quotes.length) {
        await syncQuotesToCloud(quotes, '全部同步');
      }
      if (archives.length) {
        await syncArchivesToCloud(archives, '全部同步');
      }
      setSyncAllStatus(`全部完成：${parts.join('、')} 已同步至云端。`);
    } catch (err) {
      setSyncAllStatus(`失败：${err.message}`);
    } finally {
      setSyncAllBusy(false);
    }
  };

  const handleSeed = async () => {
    const builtIn = await getFullBuiltInMarkers();
    if (
      !window.confirm(
        `将 Git 内置 ${builtIn.length} 条地点写入云端（不含浏览器里曾单独添加的数据；已存在 id 会覆盖）。继续？`
      )
    ) {
      return;
    }
    setBusy(true);
    setStatus('');
    try {
      await syncMarkersToCloud(builtIn, '内置样本');
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

  const handleArchivesLocalImport = async () => {
    const archives = loadLegacyLocalArchives();
    if (!archives.length) {
      setArchiveStatus('失败：本浏览器未找到档案馆数据（jzm_all_archives）。');
      return;
    }
    const stats = classifyArchives(archives);
    if (
      !window.confirm(
        `将本浏览器 ${stats.total} 条档案上传到云端（内置 ${stats.builtin} · 自添 ${stats.userAdded}）。继续？`
      )
    ) {
      return;
    }
    setArchiveBusy(true);
    setArchiveStatus('');
    try {
      await syncArchivesToCloud(archives, '浏览器本地恢复');
    } catch (err) {
      setArchiveStatus(`失败：${err.message}`);
    } finally {
      setArchiveBusy(false);
    }
  };

  const handleArchivesJsonImport = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setArchiveBusy(true);
    setArchiveStatus('');
    try {
      const text = await file.text();
      const parsed = parseArchivesImport(text);
      if (!parsed.length) throw new Error('文件中没有档案');

      if (!window.confirm(`从 JSON 导入 ${parsed.length} 条档案到云端。继续？`)) {
        return;
      }
      await syncArchivesToCloud(parsed, 'JSON 导入');
    } catch (err) {
      setArchiveStatus(`失败：${err.message}`);
    } finally {
      setArchiveBusy(false);
    }
  };

  const handleArchivesExport = () => {
    exportArchivesBackup(localArchives);
    setArchiveStatus(
      `已下载备份：共 ${localArchiveStats.total} 条（内置 ${localArchiveStats.builtin} · 自添 ${localArchiveStats.userAdded}）。`
    );
  };

  const handleMigrateImagesToStorage = async () => {
    if (
      !window.confirm(
        '将云端数据库中仍存 Base64 的图片上传到 Supabase Storage，并把 payload 里的 data 字段替换为公开 URL。' +
          '需已执行 supabase/migration-storage.sql。耗时取决于图片数量，继续？'
      )
    ) {
      return;
    }

    setImageMigrateBusy(true);
    setImageMigrateStatus('准备中…');
    try {
      const result = await migrateCloudImagesToStorage({
        onProgress: (msg) => setImageMigrateStatus(msg),
      });
      setImageMigrateStatus(
        `完成：地点 ${result.markersUpdated} · 影像馆 ${result.galleryUpdated} · 档案 ${result.archivesUpdated} · 待审 ${result.submissionsUpdated} 条已更新。`
      );
    } catch (err) {
      setImageMigrateStatus(`失败：${err.message}`);
    } finally {
      setImageMigrateBusy(false);
    }
  };

  const cloudMarkersIncomplete = count != null && count < fullBuiltInCount;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-memorial-navy">概览</h1>
        <p className="text-sm text-memorial-muted mt-1">
          MVP：仅超级管理员可编辑云端主数据；访客从云端 + Git 内置合并只读加载。
          {cloudMarkersIncomplete && (
            <span className="block mt-1 text-amber-800">
              云端地点（{count}）少于 Git 内置（{fullBuiltInCount}），请点下方「全部上云」补全。
            </span>
          )}
        </p>
      </div>

      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-semibold text-green-900">一键完整上云</h2>
        <p className="text-sm text-green-800">
          合并 Git 内置 {fullBuiltInCount} 条 + 本浏览器本地 {localMarkerCount} 条 → 共{' '}
          <strong>{fullMarkerCatalogCount ?? '…'}</strong> 条地点；影像 {localGalleryCount} · 语录{' '}
          {localQuoteStats.total} · 档案 {localArchiveStats.total}
        </p>
        <button
          type="button"
          onClick={handleSyncAllLocal}
          disabled={syncAllBusy || busy || quoteBusy || archiveBusy}
          className="px-4 py-2 rounded-lg bg-green-700 hover:bg-green-800 text-white text-sm font-medium disabled:opacity-50"
        >
          {syncAllBusy
            ? '同步中…'
            : `全部上云（${fullMarkerCatalogCount ?? '…'} 地点 + 影像 + 语录 + 档案）`}
        </button>
        {syncAllStatus && (
          <p className={`text-sm ${syncAllStatus.startsWith('失败') ? 'text-red-600' : 'text-green-700'}`}>
            {syncAllStatus}
          </p>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="admin-stat-card">
          <p className="text-xs text-memorial-muted">云端地点</p>
          <p className="text-2xl font-bold text-memorial-navy mt-1">{count ?? '—'}</p>
        </div>
        <div className="admin-stat-card">
          <p className="text-xs text-memorial-muted">内置地点（Git）</p>
          <p className="text-2xl font-bold text-memorial-navy mt-1">{fullBuiltInCount}</p>
        </div>
        <div className="admin-stat-card">
          <p className="text-xs text-memorial-muted">云端语录</p>
          <p className="text-2xl font-bold text-memorial-navy mt-1">{quoteCount ?? '—'}</p>
        </div>
        <div className="admin-stat-card">
          <p className="text-xs text-memorial-muted">本浏览器语录</p>
          <p className="text-2xl font-bold text-memorial-navy mt-1">{localQuoteStats.total}</p>
          <p className="text-xs text-memorial-muted/70 mt-1">
            内置 {localQuoteStats.builtin} · 自添 {localQuoteStats.userAdded}
          </p>
        </div>
        <div className="admin-stat-card">
          <p className="text-xs text-memorial-muted">云端档案</p>
          <p className="text-2xl font-bold text-memorial-navy mt-1">{archiveCount ?? '—'}</p>
        </div>
        <div className="admin-stat-card">
          <p className="text-xs text-memorial-muted">本浏览器档案</p>
          <p className="text-2xl font-bold text-memorial-navy mt-1">{localArchiveStats.total}</p>
          <p className="text-xs text-memorial-muted/70 mt-1">
            内置 {localArchiveStats.builtin} · 自添 {localArchiveStats.userAdded}
          </p>
        </div>
      </div>

      <div className="admin-card p-4 space-y-3">
        <h2 className="text-sm font-semibold text-memorial-ink">地点 · 恢复 / 导入</h2>
        <p className="text-sm text-memorial-muted">
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
          <label className="px-4 py-2 rounded-lg bg-memorial-navy hover:bg-[#162d4a] text-white text-sm font-medium cursor-pointer disabled:opacity-50">
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
            仅 Git 样本（{fullBuiltInCount} 条）
          </button>
        </div>
        {status && (
          <p className={`text-sm ${status.startsWith('失败') ? 'text-red-600' : 'text-green-700'}`}>{status}</p>
        )}
      </div>

      <div className="admin-card p-4 space-y-3">
        <h2 className="text-sm font-semibold text-memorial-ink">语录 · 恢复 / 上云</h2>
        <p className="text-sm text-memorial-muted">
          Git 内置语录 <strong>{BUILTIN_QUOTES.length} 条</strong>；你本浏览器现有{' '}
          <strong>{localQuoteStats.total}</strong> 条（自添 {localQuoteStats.userAdded} 条）。
          首次上云语录需先在 Supabase 执行 <code className="text-xs bg-memorial-cream-dark px-1 rounded">supabase/migration-quotes.sql</code>。
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
            className="px-4 py-2 rounded-lg bg-memorial-ink hover:bg-memorial-navy text-white text-sm font-medium disabled:opacity-50"
          >
            下载语录备份 JSON
          </button>
          <label className="px-4 py-2 rounded-lg bg-memorial-navy hover:bg-[#162d4a] text-white text-sm font-medium cursor-pointer disabled:opacity-50">
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

      <div className="admin-card p-4 space-y-3">
        <h2 className="text-sm font-semibold text-memorial-ink">档案馆 · 恢复 / 上云</h2>
        <p className="text-sm text-memorial-muted">
          Git 内置档案 <strong>{BUILTIN_ARCHIVES.length} 条</strong>；你本浏览器现有{' '}
          <strong>{localArchiveStats.total}</strong> 条（自添 {localArchiveStats.userAdded} 条）。
          首次上云档案需先在 Supabase 执行{' '}
          <code className="text-xs bg-memorial-cream-dark px-1 rounded">supabase/migration-archives.sql</code>。
        </p>
        {localArchiveStats.userAdded > 0 && (
          <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            检测到 {localArchiveStats.userAdded} 条自添档案，可一键上传到云端，所有人可见。
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleArchivesLocalImport}
            disabled={archiveBusy || !localArchiveStats.total}
            className="px-4 py-2 rounded-lg bg-green-700 hover:bg-green-800 text-white text-sm font-medium disabled:opacity-50"
          >
            {archiveBusy ? '上传中…' : `上传本浏览器档案（${localArchiveStats.total} 条）`}
          </button>
          <button
            type="button"
            onClick={handleArchivesExport}
            disabled={!localArchiveStats.total}
            className="px-4 py-2 rounded-lg bg-memorial-ink hover:bg-memorial-navy text-white text-sm font-medium disabled:opacity-50"
          >
            下载档案备份 JSON
          </button>
          <label className="px-4 py-2 rounded-lg bg-memorial-navy hover:bg-[#162d4a] text-white text-sm font-medium cursor-pointer disabled:opacity-50">
            档案 JSON 导入
            <input
              type="file"
              accept=".json,application/json"
              className="hidden"
              disabled={archiveBusy}
              onChange={handleArchivesJsonImport}
            />
          </label>
        </div>
        {archiveStatus && (
          <p className={`text-sm ${archiveStatus.startsWith('失败') ? 'text-red-600' : 'text-green-700'}`}>
            {archiveStatus}
          </p>
        )}
      </div>

      <div className="admin-card p-4 space-y-3">
        <h2 className="text-sm font-semibold text-memorial-ink">图片对象存储（P2-05）</h2>
        <p className="text-sm text-memorial-muted">
          新上传的图片会在保存时自动写入 Supabase Storage（bucket <code className="text-xs bg-memorial-cream-dark px-1 rounded">images</code>
          ）。若云端仍有旧 Base64 数据，请先在 SQL Editor 执行{' '}
          <code className="text-xs bg-memorial-cream-dark px-1 rounded">supabase/migration-storage.sql</code>，再点下方按钮一次性迁移。
        </p>
        <button
          type="button"
          onClick={handleMigrateImagesToStorage}
          disabled={imageMigrateBusy || syncAllBusy}
          className="px-4 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-sm font-medium disabled:opacity-50"
        >
          {imageMigrateBusy ? '迁移中…' : '迁移云端 Base64 图片 → Storage'}
        </button>
        {imageMigrateStatus && (
          <p
            className={`text-sm ${
              imageMigrateStatus.startsWith('失败') ? 'text-red-600' : 'text-indigo-800'
            }`}
          >
            {imageMigrateStatus}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <Link
          to="/admin/markers"
          className="px-4 py-2 rounded-lg bg-memorial-navy hover:bg-[#162d4a] text-white text-sm font-medium"
        >
          管理地点 →
        </Link>
      </div>
    </div>
  );
}
