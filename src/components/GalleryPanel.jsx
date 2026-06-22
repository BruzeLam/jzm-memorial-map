import React, { useState, useMemo, useEffect } from 'react';
import { compressImage } from '../utils/imageCompression';
import { filterGalleryBySearch } from '../utils/textSearch';
import { getGallerySource } from '../utils/galleryUtils';
import { useI18n } from '../i18n/LanguageContext';
import GalleryImageEditor from './GalleryImageEditor';
import ImageViewer from './ImageViewer';
import ImageUploadInput from './ImageUploadInput';
import MemorialModal from './MemorialModal';

export default function GalleryPanel({
  gallery,
  onAddImage,
  onUpdateImage,
  onDeleteImage,
  onClose,
  markers,
  readOnly = false,
}) {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingImageId, setEditingImageId] = useState(null);
  const [viewingImageIndex, setViewingImageIndex] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [newImageToEdit, setNewImageToEdit] = useState(null);
  const [showUploadArea, setShowUploadArea] = useState(false);
  const [sourceFilter, setSourceFilter] = useState('all');

  const searchedGallery = useMemo(
    () => filterGalleryBySearch(gallery, searchQuery, markers),
    [gallery, searchQuery, markers]
  );

  const filteredGallery = useMemo(() => {
    if (sourceFilter === 'all') return searchedGallery;
    return searchedGallery.filter((img) => getGallerySource(img) === sourceFilter);
  }, [searchedGallery, sourceFilter]);

  const sourceCounts = useMemo(() => {
    let official = 0;
    let community = 0;
    searchedGallery.forEach((img) => {
      if (getGallerySource(img) === 'community') community += 1;
      else official += 1;
    });
    return { all: searchedGallery.length, official, community };
  }, [searchedGallery]);

  useEffect(() => {
    setViewingImageIndex(null);
  }, [searchQuery]);

  const editingImage = editingImageId
    ? gallery.find(img => img.id === editingImageId)
    : null;

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (uploading) return; // 防止并发上传

    setUploading(true);
    try {
      const compressed = await compressImage(file);
      // 创建临时图片对象，等待编辑
      setNewImageToEdit({
        data: compressed.data,
        name: compressed.name,
        title: '',
        description: '',
        relatedMarker: null,
      });
    } catch (error) {
      alert(`上传失败: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // 编辑新上传的图片
  if (newImageToEdit) {
    return (
      <GalleryImageEditor
        image={newImageToEdit}
        markers={markers}
        isNew={true}
        onSave={(updates) => {
          onAddImage(newImageToEdit, updates);
          setNewImageToEdit(null);
          setShowUploadArea(false);
        }}
        onCancel={() => setNewImageToEdit(null)}
        onDelete={() => setNewImageToEdit(null)}
      />
    );
  }

  if (editingImage) {
    return (
      <GalleryImageEditor
        image={editingImage}
        markers={markers}
        onSave={(updates) => {
          onUpdateImage(editingImage.id, updates);
          setEditingImageId(null);
        }}
        onCancel={() => setEditingImageId(null)}
        onDelete={() => {
          onDeleteImage(editingImage.id);
          setEditingImageId(null);
        }}
      />
    );
  }

  return (
    <>
    <MemorialModal onClose={onClose} panelClassName="max-w-4xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-memorial-border flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-bold font-memorial text-memorial-navy">🖼️ {t('gallery.title')}</h2>
          <button
            onClick={onClose}
            className="text-memorial-muted hover:text-memorial-ink text-2xl leading-none transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Search & Upload */}
        <div className="px-6 py-3 border-b border-memorial-border/60 flex-shrink-0 space-y-2">
          <div className="flex gap-2 items-center">
            <input
              type="text"
              placeholder={t('gallery.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 border border-memorial-border rounded-lg text-sm focus:outline-none focus:border-memorial-gold"
            />
            {!readOnly && !showUploadArea && (
              <button
                onClick={() => setShowUploadArea(true)}
                disabled={uploading}
                className="px-4 py-2 text-sm font-medium bg-memorial-navy hover:bg-[#162d4a] text-white rounded-lg transition-colors disabled:opacity-50"
              >
                📸 {t('gallery.upload')}
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: t('gallery.filterAll'), count: sourceCounts.all },
              { key: 'official', label: t('gallery.filterOfficial'), count: sourceCounts.official },
              { key: 'community', label: t('gallery.filterCommunity'), count: sourceCounts.community },
            ].map(({ key, label, count }) => (
              <button
                key={key}
                type="button"
                onClick={() => setSourceFilter(key)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  sourceFilter === key
                    ? 'memorial-btn-primary'
                    : 'bg-memorial-cream-dark text-memorial-muted hover:bg-memorial-cream'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>
          {!readOnly && showUploadArea && (
            <div className="space-y-2">
              <ImageUploadInput
                onUpload={handleImageUpload}
                disabled={uploading}
              />
              <button
                onClick={() => setShowUploadArea(false)}
                className="text-xs text-memorial-muted hover:text-memorial-ink"
              >
                ✕ {t('gallery.closeUpload')}
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {filteredGallery.length === 0 ? (
            <div className="text-center py-12 text-memorial-muted/70 text-sm">
              {searchQuery.trim() ? t('gallery.noResults') : t('gallery.empty')}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredGallery.map((img, idx) => {
                const relatedMarker = img.relatedMarker
                  ? markers.find(m => m.id === img.relatedMarker)
                  : null;

                return (
                  <div
                    key={img.id}
                    className="group relative aspect-square rounded-lg overflow-hidden border border-memorial-border hover:border-memorial-gold transition-colors bg-memorial-cream-dark cursor-pointer"
                  >
                    <img
                      src={img.data}
                      alt={img.title || img.name}
                      className="w-full h-full object-cover"
                    />

                    <div className="absolute top-2 left-2">
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shadow-sm ${
                          getGallerySource(img) === 'community'
                            ? 'bg-emerald-500/90 text-white'
                            : 'bg-slate-700/80 text-white'
                        }`}
                      >
                        {getGallerySource(img) === 'community'
                          ? t('gallery.badgeCommunity')
                          : t('gallery.badgeOfficial')}
                      </span>
                    </div>

                    {/* 悬停覆盖层 */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex flex-col items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setViewingImageIndex(idx)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-memorial-surface px-3 py-1.5 rounded text-sm font-medium text-memorial-ink"
                      >
                        🔍 {t('gallery.view')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingImageId(img.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-memorial-surface px-3 py-1.5 rounded text-sm font-medium text-memorial-ink"
                      >
                        ✏️ {t('gallery.edit')}
                      </button>
                    </div>

                    {/* 关联标记指示 */}
                    {relatedMarker && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                        <div className="text-xs text-white truncate">
                          📍 {relatedMarker.name}
                        </div>
                      </div>
                    )}

                    {/* 标题显示 */}
                    {img.title && !relatedMarker && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                        <div className="text-xs text-white truncate">
                          {img.title}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-memorial-border flex items-center justify-between flex-shrink-0">
          <span className="text-xs text-memorial-muted">
            {searchQuery.trim()
              ? t('gallery.found', { found: filteredGallery.length, total: gallery.length })
              : t('gallery.total', { total: gallery.length })}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium memorial-btn-primary"
          >
            {t('gallery.close')}
          </button>
        </div>
    </MemorialModal>

      {viewingImageIndex !== null && filteredGallery.length > 0 && (
        <ImageViewer
          images={filteredGallery}
          initialIndex={Math.min(viewingImageIndex, filteredGallery.length - 1)}
          onClose={() => setViewingImageIndex(null)}
        />
      )}
    </>
  );
}
