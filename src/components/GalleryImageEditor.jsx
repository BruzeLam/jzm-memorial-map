import React, { useState, useMemo } from 'react';
import { filterBySearch, getMarkerSearchFields } from '../utils/textSearch';
import { formatRegionPath } from '../utils/regionFormat';
import { useI18n } from '../i18n/LanguageContext';

export default function GalleryImageEditor({
  image,
  markers,
  onSave,
  onCancel,
  onDelete,
  isNew = false,
}) {
  const { t } = useI18n();
  const [form, setForm] = useState({
    title: image.title || '',
    description: image.description || '',
    relatedMarker: image.relatedMarker || null,
  });
  const [markerSearchQuery, setMarkerSearchQuery] = useState('');

  const relatedMarker = form.relatedMarker
    ? markers.find(m => m.id === form.relatedMarker)
    : null;

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSelectMarker = (markerId) => {
    set('relatedMarker', markerId === form.relatedMarker ? null : markerId);
    setMarkerSearchQuery('');
  };

  const filteredMarkers = useMemo(
    () =>
      filterBySearch(markers, markerSearchQuery, (m) =>
        getMarkerSearchFields(m, formatRegionPath(m))
      ),
    [markers, markerSearchQuery]
  );

  const inputClass =
    'w-full text-sm border border-memorial-border rounded-lg px-3 py-1.5 focus:outline-none focus:border-memorial-gold bg-white';
  const labelClass = 'text-xs font-medium text-memorial-muted mb-1 block';

  return (
    <div
      className="fixed inset-0 z-[5000] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onCancel}
    >
      <div
        className="bg-memorial-surface rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col"
        style={{ maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-memorial-border/60 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-bold text-memorial-ink">
            {isNew ? t('gallery.newImageInfo') : t('gallery.editImageInfo')}
          </h2>
          <button
            onClick={onCancel}
            className="text-memorial-muted/70 hover:text-memorial-muted text-2xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* 图片预览 */}
          <div>
            <img
              src={image.data}
              alt={image.name}
              className="w-full max-h-48 object-contain rounded-lg border border-memorial-border"
            />
          </div>

          {/* 标题 */}
          <div>
            <label className={labelClass}>{t('gallery.fieldTitle')}</label>
            <input
              type="text"
              className={inputClass}
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
            />
          </div>

          {/* 描述 */}
          <div>
            <label className={labelClass}>{t('gallery.fieldDesc')}</label>
            <textarea
              className={`${inputClass} resize-none`}
              rows={3}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>

          {/* 关联地点 */}
          <div>
            <label className={labelClass}>{t('gallery.linkMarker')}</label>
            <p className="text-xs text-memorial-muted/70 mb-2">{t('gallery.linkHint')}</p>

            {/* 搜索框 */}
            <input
              type="text"
              className={inputClass + ' mb-2'}
              placeholder={t('gallery.searchPlace')}
              value={markerSearchQuery}
              onChange={(e) => setMarkerSearchQuery(e.target.value)}
            />

            {/* 当前关联 */}
            {relatedMarker && (
              <div className="mb-2 p-2 bg-amber-50/80 border border-amber-200/80 rounded-lg flex items-center justify-between">
                <span className="text-sm text-memorial-ink">
                  📍 {relatedMarker.icon} {relatedMarker.name}
                </span>
                <button
                  type="button"
                  onClick={() => set('relatedMarker', null)}
                  className="text-red-500 hover:text-red-700 text-xs font-medium"
                >
                  ✕
                </button>
              </div>
            )}

            {/* 地点列表 */}
            <div className="bg-memorial-cream rounded-lg p-2 max-h-40 overflow-y-auto border border-memorial-border">
              {markers.length === 0 ? (
                <div className="text-sm text-memorial-muted/70 text-center py-4">
                  {t('gallery.noMarkers')}
                </div>
              ) : filteredMarkers.length === 0 ? (
                <div className="text-sm text-memorial-muted/70 text-center py-4">
                  {t('gallery.noMatch')}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredMarkers.map((marker) => (
                    <button
                      key={marker.id}
                      type="button"
                      onClick={() => handleSelectMarker(marker.id)}
                      className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                        form.relatedMarker === marker.id
                          ? 'bg-amber-50/800 text-white font-medium'
                          : 'bg-memorial-surface border border-memorial-border hover:bg-amber-50 text-memorial-ink'
                      }`}
                    >
                      {marker.icon} {marker.name}{marker.city ? ` (${marker.city})` : ''}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-memorial-border/60 flex gap-2 flex-shrink-0">
          {!isNew && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(t('gallery.confirmDelete'))) {
                  onDelete();
                }
              }}
              className="px-4 py-2 text-sm font-medium border border-red-200 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              🗑️ {t('common.delete')}
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium bg-memorial-cream-dark hover:bg-gray-200 text-memorial-muted rounded-lg transition-colors"
          >
            {isNew ? t('gallery.cancelUpload') : t('common.cancel')}
          </button>
          <button
            onClick={() => onSave(form)}
            className="px-4 py-2 text-sm font-medium bg-memorial-navy hover:bg-[#162d4a] text-white rounded-lg transition-colors"
          >
            {isNew ? t('common.upload') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
