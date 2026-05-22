import React, { useState, useRef } from 'react';
import ImageViewer from './ImageViewer';

export default function GalleryPanel({ gallery, onAddGalleryItem, onDeleteGalleryItem, onClose }) {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadImages, setUploadImages] = useState([]);
  const [description, setDescription] = useState('');
  const [viewingIndex, setViewingIndex] = useState(null);
  const [viewingItemId, setViewingItemId] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadImages((prev) => [
          ...prev,
          {
            url: event.target.result,
            name: file.name,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeUploadImage = (index) => {
    setUploadImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (uploadImages.length === 0) return;
    onAddGalleryItem({
      images: uploadImages,
      description: description.trim(),
    });
    setUploadImages([]);
    setDescription('');
    setShowUploadForm(false);
  };

  const viewingItem = viewingItemId ? gallery.find((item) => item.id === viewingItemId) : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">📸 影像馆</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {!showUploadForm ? (
            <div className="p-6">
              <button
                onClick={() => setShowUploadForm(true)}
                className="w-full mb-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                ➕ 上传图片
              </button>

              {gallery.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">📷</div>
                  <p className="text-gray-500">还没有图片，上传第一张吧</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {gallery.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <div
                        className="relative bg-gray-100 aspect-square cursor-pointer group"
                        onClick={() => {
                          setViewingItemId(item.id);
                          setViewingIndex(0);
                        }}
                      >
                        {item.images[0] && (
                          <img
                            src={item.images[0].url}
                            alt="缩略图"
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                          <span className="text-white text-3xl opacity-0 group-hover:opacity-100 transition-opacity">
                            🔍
                          </span>
                        </div>
                        {item.images.length > 1 && (
                          <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                            {item.images.length}
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-xs text-gray-500 mb-2">{item.uploadedAt}</p>
                        {item.description && (
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                            {item.description}
                          </p>
                        )}
                        {item.relatedMarkerId && (
                          <p className="text-xs text-blue-600 mb-2">
                            关联地点 ✓
                          </p>
                        )}
                        <button
                          onClick={() => onDeleteGalleryItem(item.id)}
                          className="w-full text-xs text-red-500 hover:text-red-700 py-1"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-6">
              <button
                onClick={() => setShowUploadForm(false)}
                className="mb-4 text-sm text-gray-500 hover:text-gray-700"
              >
                ← 返回
              </button>

              <div className="space-y-4">
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-300 rounded-lg py-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    <div className="text-3xl mb-2">📁</div>
                    <p className="text-sm text-gray-600">点击选择图片或拖放</p>
                  </button>
                </div>

                {uploadImages.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">
                      已选择 {uploadImages.length} 张图片
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {uploadImages.map((img, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-square rounded overflow-hidden"
                        >
                          <img
                            src={img.url}
                            alt="预览"
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => removeUploadImage(idx)}
                            className="absolute top-0 right-0 bg-red-500 text-white text-xs w-6 h-6 flex items-center justify-center"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    描述（可选）
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="添加一些说明..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 resize-none text-sm"
                    rows="3"
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={uploadImages.length === 0}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors font-medium"
                >
                  提交
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {viewingItem && viewingIndex !== null && (
        <ImageViewer
          images={viewingItem.images}
          initialIndex={viewingIndex}
          onClose={() => {
            setViewingItemId(null);
            setViewingIndex(null);
          }}
        />
      )}
    </div>
  );
}
