import React, { useState, useMemo, useEffect } from 'react';
import { compressImage } from '../utils/imageCompression';
import { filterGalleryBySearch } from '../utils/textSearch';
import { useI18n } from '../i18n/LanguageContext';
import GalleryImageEditor from './GalleryImageEditor';
import ImageViewer from './ImageViewer';
import ImageUploadInput from './ImageUploadInput';

export default function GalleryPanel({
  gallery,
  onAddImage,
  onUpdateImage,
  onDeleteImage,
  onClose,
  markers,
}) {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingImageId, setEditingImageId] = useState(null);
  const [viewingImageIndex, setViewingImageIndex] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [newImageToEdit, setNewImageToEdit] = useState(null);
  const [showUploadArea, setShowUploadArea] = useState(false);

  const filteredGallery = useMemo(
    () => filterGalleryBySearch(gallery, searchQuery, markers),
    [gallery, searchQuery, markers]
  );

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
    <div
      className="fixed inset-0 z-[5000] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 flex flex-col"
        style={{ maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800">🖼️ {t('gallery.title')}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Search & Upload */}
        <div className="px-6 py-3 border-b border-gray-100 flex-shrink-0 space-y-2">
          <div className="flex gap-2 items-center">
            <input
              type="text"
              placeholder={t('gallery.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
            />
            {!showUploadArea && (
              <button
                onClick={() => setShowUploadArea(true)}
                disabled={uploading}
                className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                📸 {t('gallery.upload')}
              </button>
            )}
          </div>
          {showUploadArea && (
            <div className="space-y-2">
              <ImageUploadInput
                onUpload={handleImageUpload}
                disabled={uploading}
              />
              <button
                onClick={() => setShowUploadArea(false)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                ✕ 关闭
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {filteredGallery.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
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
                    className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors bg-gray-100 cursor-pointer"
                  >
                    <img
                      src={img.data}
                      alt={img.title || img.name}
                      className="w-full h-full object-cover"
                    />

                    {/* 悬停覆盖层 */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex flex-col items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setViewingImageIndex(idx)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white px-3 py-1.5 rounded text-sm font-medium text-gray-700"
                      >
                        🔍 {t('gallery.view')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingImageId(img.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white px-3 py-1.5 rounded text-sm font-medium text-gray-700"
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
        <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
          <span className="text-xs text-gray-400">
            {searchQuery.trim()
              ? t('gallery.found', { found: filteredGallery.length, total: gallery.length })
              : t('gallery.total', { total: gallery.length })}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            {t('gallery.close')}
          </button>
        </div>
      </div>

      {/* Image Viewer */}
      {viewingImageIndex !== null && filteredGallery.length > 0 && (
        <ImageViewer
          images={filteredGallery}
          initialIndex={Math.min(viewingImageIndex, filteredGallery.length - 1)}
          onClose={() => setViewingImageIndex(null)}
        />
      )}
    </div>
  );
}
