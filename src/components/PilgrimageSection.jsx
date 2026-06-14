import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/LanguageContext';
import { isCloudEnabled } from '../lib/cloudConfig';
import {
  createPilgrimageVisit,
  deletePilgrimageVisit,
  fetchPilgrimageVisits,
  getPilgrimageDisplayName,
  MAX_BODY_LENGTH,
} from '../services/pilgrimageVisits';

function formatVisitTime(iso, locale) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString(locale === 'en' ? 'en-US' : 'zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function PilgrimageSection({ markerId, onLoginClick }) {
  const { t, locale } = useI18n();
  const { user, isSuperAdmin } = useAuth();
  const cloudOn = isCloudEnabled();

  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const reload = useCallback(async () => {
    if (!cloudOn || !markerId) return;
    setLoading(true);
    setLoadError('');
    try {
      const rows = await fetchPilgrimageVisits(markerId);
      setVisits(rows);
    } catch (err) {
      setLoadError(err.message || t('pilgrimage.loadFailed'));
      setVisits([]);
    } finally {
      setLoading(false);
    }
  }, [cloudOn, markerId, t]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (!cloudOn || !markerId) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      onLoginClick?.();
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      const row = await createPilgrimageVisit(markerId, body);
      setVisits((prev) => [row, ...prev]);
      setBody('');
    } catch (err) {
      setSubmitError(err.message || t('pilgrimage.submitFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('pilgrimage.confirmDelete'))) return;
    setDeletingId(id);
    try {
      await deletePilgrimageVisit(id);
      setVisits((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      window.alert(err.message || t('pilgrimage.deleteFailed'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="mt-6 pt-5 border-t border-gray-200">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h4 className="text-sm font-semibold text-gray-800">
          🧭 {t('pilgrimage.title')}
        </h4>
        {!loading && (
          <span className="text-xs text-gray-500 tabular-nums">
            {t('pilgrimage.count', { count: visits.length })}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500 mb-3 leading-relaxed">{t('pilgrimage.hint')}</p>

      {loadError && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3">
          {loadError}
        </div>
      )}

      {loading ? (
        <p className="text-xs text-gray-400 py-2">{t('pilgrimage.loading')}</p>
      ) : visits.length === 0 ? (
        <p className="text-xs text-gray-400 py-2 mb-3">{t('pilgrimage.empty')}</p>
      ) : (
        <ul className="space-y-3 mb-4">
          {visits.map((visit) => (
            <li
              key={visit.id}
              className="rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500 mb-1">
                    <span className="font-medium text-gray-700">
                      {getPilgrimageDisplayName(visit.author_email)}
                    </span>
                    <span aria-hidden>·</span>
                    <time dateTime={visit.created_at}>
                      {formatVisitTime(visit.created_at, locale)}
                    </time>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap break-words leading-relaxed">
                    {visit.body}
                  </p>
                </div>
                {isSuperAdmin && (
                  <button
                    type="button"
                    onClick={() => handleDelete(visit.id)}
                    disabled={deletingId === visit.id}
                    className="flex-shrink-0 text-xs text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 disabled:opacity-50"
                  >
                    {deletingId === visit.id ? '…' : t('pilgrimage.delete')}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {user ? (
        <form onSubmit={handleSubmit} className="space-y-2">
          <label className="block text-xs font-medium text-gray-600" htmlFor="pilgrimage-body">
            {t('pilgrimage.composeLabel')}
          </label>
          <textarea
            id="pilgrimage-body"
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, MAX_BODY_LENGTH))}
            rows={3}
            placeholder={t('pilgrimage.placeholder')}
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-200 resize-y min-h-[72px]"
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-gray-400 tabular-nums">
              {body.length}/{MAX_BODY_LENGTH}
            </span>
            <button
              type="submit"
              disabled={submitting || !body.trim()}
              className="px-4 py-2 text-sm font-medium rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? t('pilgrimage.submitting') : t('pilgrimage.submit')}
            </button>
          </div>
          {submitError && <p className="text-xs text-red-600">{submitError}</p>}
        </form>
      ) : (
        <button
          type="button"
          onClick={() => onLoginClick?.()}
          className="w-full text-sm py-2.5 rounded-xl border border-dashed border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors"
        >
          {t('pilgrimage.loginToPost')}
        </button>
      )}
    </section>
  );
}
