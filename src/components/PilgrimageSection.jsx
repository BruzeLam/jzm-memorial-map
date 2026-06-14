import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/LanguageContext';
import { isCloudEnabled } from '../lib/cloudConfig';
import { compressImage } from '../utils/imageCompression';
import ImageViewer from './ImageViewer';
import {
  createPilgrimageVisit,
  deletePilgrimageVisit,
  fetchPilgrimageVisits,
  getPilgrimageDisplayName,
  MAX_BODY_LENGTH,
  MAX_IMAGES,
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

export default function PilgrimageSection({ marker, onLoginClick, onGalleryUpdated, embedded = false }) {
  const { t, locale } = useI18n();
  const { user, isSuperAdmin } = useAuth();
  const cloudOn = isCloudEnabled();
  const markerId = marker?.id;

  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [body, setBody] = useState('');
  const [pendingImages, setPendingImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [viewingImages, setViewingImages] = useState(null);

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

  const canSubmit = Boolean(body.trim() || pendingImages.length);

  const handleAddImages = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length || submitting) return;

    const remaining = MAX_IMAGES - pendingImages.length;
    if (remaining <= 0) {
      setSubmitError(t('pilgrimage.maxImages', { max: MAX_IMAGES }));
      return;
    }

    setSubmitError('');
    try {
      const slice = files.slice(0, remaining);
      const compressed = await Promise.all(slice.map((file) => compressImage(file)));
      setPendingImages((prev) => [...prev, ...compressed].slice(0, MAX_IMAGES));
    } catch (err) {
      setSubmitError(err.message || t('pilgrimage.imageFailed'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      onLoginClick?.();
      return;
    }
    if (!canSubmit) return;

    setSubmitting(true);
    setSubmitError('');
    try {
      const row = await createPilgrimageVisit(markerId, {
        body,
        images: pendingImages,
        marker,
      });
      setVisits((prev) => [row, ...prev]);
      setBody('');
      setPendingImages([]);
      onGalleryUpdated?.();
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
      onGalleryUpdated?.();
    } catch (err) {
      window.alert(err.message || t('pilgrimage.deleteFailed'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className={embedded ? 'px-3 py-3' : 'mt-6 pt-5 border-t border-gray-200'}>
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
                  {visit.body ? (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap break-words leading-relaxed">
                      {visit.body}
                    </p>
                  ) : null}
                  {visit.images?.length > 0 && (
                    <div className={`grid grid-cols-3 gap-1.5 ${visit.body ? 'mt-2' : ''}`}>
                      {visit.images.map((img, idx) => (
                        <button
                          key={img.id || idx}
                          type="button"
                          onClick={() => setViewingImages({ list: visit.images, index: idx })}
                          className="aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100"
                        >
                          <img
                            src={img.data}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
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

          {pendingImages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {pendingImages.map((img, idx) => (
                <div key={`${img.name}-${idx}`} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                  <img src={img.data} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPendingImages((prev) => prev.filter((_, i) => i !== idx))}
                    className="absolute top-0 right-0 w-5 h-5 bg-black/55 text-white text-xs leading-none"
                    aria-label={t('pilgrimage.removeImage')}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <label className="cursor-pointer text-xs text-blue-600 hover:text-blue-700 font-medium">
                📷 {t('pilgrimage.addImages')}
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  multiple
                  className="hidden"
                  disabled={submitting || pendingImages.length >= MAX_IMAGES}
                  onChange={handleAddImages}
                />
              </label>
              <span className="text-[11px] text-gray-400">
                {pendingImages.length}/{MAX_IMAGES}
              </span>
            </div>
            <span className="text-[11px] text-gray-400 tabular-nums">
              {body.length}/{MAX_BODY_LENGTH}
            </span>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !canSubmit}
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

      {viewingImages?.list?.length > 0 && (
        <ImageViewer
          images={viewingImages.list.map((img) => ({ data: img.data, name: img.name || img.title }))}
          initialIndex={viewingImages.index || 0}
          onClose={() => setViewingImages(null)}
        />
      )}
    </section>
  );
}
