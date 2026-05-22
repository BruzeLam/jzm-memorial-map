import React, { useState } from 'react';
import GalleryImageEditor from './GalleryImageEditor';
import ImageViewer from './ImageViewer';

export default function GalleryPanel({
  gallery,
  onAddImage,
  onUpdateImage,
  onDeleteImage,
  onClose,
  markers,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingImageId, setEditingImageId] = useState(null);
  const [viewingImageIndex, setViewingImageIndex] = useState(null);

  // 搜索过滤
  const filteredGallery = searchQuery.trim()
    ? gallery.filter((img) => {
        const q = searchQuery.toLowerCase();
        return (
          img.title?.toLowerCase().includes(q) ||
          img.description?.toLowerCase().includes(q) ||
          img.location?.address?.toLowerCase().includes(q) ||
          img.location?.city?.toLowerCase().includes(q) ||
          img.location?.province?.toLowerCase().includes(q) ||
          img.name?.toLowerCase().includes(q)
        );
      })
    : gallery;

  const editingImage = editingImageId
    ? gallery.find(img => img.id === editingImageId)
    : null;

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
          <h2 className="text-xl font-bold text-gray-800">🖼️ 影像馆</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-gray-100 flex-shrink-0">
          <input
            type="text"
            placeholder="搜索标题、地址、描述..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {filteredGallery.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2">
                {searchQuery ? '没有找到匹配的图片' : '影像馆是空的'}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
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
                        🔍 查看
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingImageId(img.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white px-3 py-1.5 rounded text-sm font-medium text-gray-700"
                      >
                        ✏️ 编辑
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
        <div className="px-6 py-3 border-t border-gray-100 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            关闭
          </button>
        </div>
      </div>

      {/* Image Viewer */}
      {viewingImageIndex !== null && (
        <ImageViewer
          images={filteredGallery}
          initialIndex={viewingImageIndex}
          onClose={() => setViewingImageIndex(null)}
        />
      )}
    </div>
  );
}
