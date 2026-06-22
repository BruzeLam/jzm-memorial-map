import React, { useCallback, useEffect, useState } from 'react';
import { MARKER_TYPES } from '../utils/constants';
import {
  fetchSubmissions,
  approveSubmission,
  rejectSubmission,
} from '../services/submissions';

const STATUS_TABS = [
  { key: 'pending', label: '待审核' },
  { key: 'approved', label: '已通过' },
  { key: 'rejected', label: '已驳回' },
  { key: 'all', label: '全部' },
];

const TYPE_LABEL = { marker: '地点', quote: '语录', archive: '档案', gallery: '影像' };

function formatTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('zh-CN');
  } catch {
    return iso;
  }
}

function MarkerPreview({ payload }) {
  if (!payload) return null;
  const typeInfo = MARKER_TYPES[payload.type] || MARKER_TYPES.spot;
  return (
    <div className="mt-3 rounded-lg border border-memorial-border bg-memorial-cream p-3 text-sm space-y-1">
      <div className="flex items-center gap-2">
        <span>{typeInfo.icon}</span>
        <span className="font-semibold text-memorial-navy">{payload.name}</span>
        <span
          className="text-xs px-2 py-0.5 rounded-full text-white"
          style={{ backgroundColor: typeInfo.color }}
        >
          {typeInfo.label}
        </span>
      </div>
      {payload.title && <p className="text-memorial-ink">{payload.title}</p>}
      {payload.date && (
        <p className="text-xs text-memorial-muted">
          📅 {payload.date}
          {payload.endDate ? ` — ${payload.endDate}` : ''}
        </p>
      )}
      {payload.description && (
        <p className="text-memorial-muted text-xs leading-relaxed whitespace-pre-wrap">{payload.description}</p>
      )}
      <p className="text-xs text-memorial-muted/70 font-mono">
        📍 {payload.latitude}, {payload.longitude}
      </p>
      {payload.images?.length > 0 && (
        <p className="text-xs text-memorial-muted">📸 含 {payload.images.length} 张图片</p>
      )}
    </div>
  );
}

export default function AdminReview() {
  const [status, setStatus] = useState('pending');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    fetchSubmissions(status)
      .then(setRows)
      .catch((e) => setError(e.message || '加载失败'))
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  const handleApprove = async (row) => {
    if (!window.confirm(`确定通过「${row.payload?.name || row.id}」并发布到公开地图？`)) return;
    setBusyId(row.id);
    setMessage('');
    try {
      await approveSubmission(row.id);
      setMessage(`已通过并发布：${row.payload?.name || row.id}`);
      load();
    } catch (e) {
      setError(e.message || '审核失败');
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (row) => {
    const note = window.prompt('驳回理由（可选）', '');
    if (note === null) return;
    setBusyId(row.id);
    setMessage('');
    try {
      await rejectSubmission(row.id, note);
      setMessage(`已驳回：${row.payload?.name || row.id}`);
      load();
    } catch (e) {
      setError(e.message || '驳回失败');
    } finally {
      setBusyId(null);
    }
  };

  const pendingCount = status === 'pending' ? rows.length : null;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-memorial-navy">内容审核</h1>
        <p className="text-sm text-memorial-muted mt-1">
          用户提交的内容在此审核。通过后写入正式数据并公开展示。
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStatus(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              status === tab.key
                ? 'memorial-btn-primary border-memorial-navy'
                : 'bg-memorial-surface text-memorial-muted border-memorial-border hover:bg-memorial-cream'
            }`}
          >
            {tab.label}
            {tab.key === 'pending' && pendingCount != null && pendingCount > 0 && (
              <span className="ml-1.5 inline-flex min-w-[1.25rem] justify-center px-1 rounded-full bg-amber-400 text-amber-950 text-[10px]">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {message && (
        <div className="text-sm px-4 py-3 rounded-lg bg-green-50 border border-green-100 text-green-900">
          {message}
        </div>
      )}
      {error && (
        <div className="text-sm px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-red-800">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-memorial-muted">加载中…</p>
      ) : rows.length === 0 ? (
        <div className="admin-card p-8 text-center text-sm text-memorial-muted">
          {status === 'pending' ? '暂无待审核内容' : '没有记录'}
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => {
            const isPending = row.status === 'pending';
            const isBusy = busyId === row.id;
            return (
              <li key={row.id} className="admin-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded bg-memorial-cream-dark text-memorial-ink">
                        {TYPE_LABEL[row.type] || row.type}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded ${
                          row.status === 'pending'
                            ? 'bg-amber-100 text-amber-900'
                            : row.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {row.status === 'pending'
                          ? '待审核'
                          : row.status === 'approved'
                            ? '已通过'
                            : '已驳回'}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-memorial-navy mt-2">
                      {row.payload?.name || row.payload?.title || row.id}
                    </p>
                    <p className="text-xs text-memorial-muted mt-1">
                      提交：{row.submitter_email} · {formatTime(row.created_at)}
                    </p>
                    {row.reviewed_at && (
                      <p className="text-xs text-memorial-muted">
                        审核：{row.reviewer_email || '—'} · {formatTime(row.reviewed_at)}
                      </p>
                    )}
                    {row.review_note && (
                      <p className="text-xs text-red-600 mt-1">驳回理由：{row.review_note}</p>
                    )}
                  </div>
                  {isPending && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleApprove(row)}
                        className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-medium disabled:opacity-50"
                      >
                        {isBusy ? '处理中…' : '通过并发布'}
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleReject(row)}
                        className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium disabled:opacity-50"
                      >
                        驳回
                      </button>
                    </div>
                  )}
                </div>
                {row.type === 'marker' && <MarkerPreview payload={row.payload} />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
