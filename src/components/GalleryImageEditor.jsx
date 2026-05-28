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
    'w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-400 bg-white';
  const labelClass = 'text-xs font-medium text-gray-500 mb-1 block';

  return (
    <div
      className="fixed inset-0 z-[5000] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col"
        style={{ maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800">
            {isNew ? t('gallery.newImageInfo') : t('gallery.editImageInfo')}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
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
              className="w-full max-h-48 object-contain rounded-lg border border-gray-200"
            />
          </div>

          {/* 标题 */}
          <div>
            <label className={labelClass}>标题</label>
            <input
              type="text"
              className={inputClass}
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="输入标题"
            />
          </div>

          {/* 描述 */}
          <div>
            <label className={labelClass}>描述</label>
            <textarea
              className={`${inputClass} resize-none`}
              rows={3}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="输入描述"
            />
          </div>

          {/* 关联地点 */}
          <div>
            <label className={labelClass}>关联地点（可选）</label>
            <p className="text-xs text-gray-400 mb-2">
              仅在本馆显示关联标签，不会把图片写入地点详情（地点上传的图片才会同步到影像馆）
            </p>

            {/* 搜索框 */}
            <input
              type="text"
              className={inputClass + ' mb-2'}
              placeholder="搜索地点名称或地区..."
              value={markerSearchQuery}
              onChange={(e) => setMarkerSearchQuery(e.target.value)}
            />

            {/* 当前关联 */}
            {relatedMarker && (
              <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                <span className="text-sm text-gray-700">
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
            <div className="bg-gray-50 rounded-lg p-2 max-h-40 overflow-y-auto border border-gray-200">
              {markers.length === 0 ? (
                <div className="text-sm text-gray-400 text-center py-4">
                  暂无地点
                </div>
              ) : filteredMarkers.length === 0 ? (
                <div className="text-sm text-gray-400 text-center py-4">
                  没有匹配的地点
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
                          ? 'bg-blue-500 text-white font-medium'
                          : 'bg-white border border-gray-200 hover:bg-blue-50 text-gray-700'
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
        <div className="px-6 py-3 border-t border-gray-100 flex gap-2 flex-shrink-0">
          {!isNew && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('确定要删除这个图片吗？')) {
                  onDelete();
                }
              }}
              className="px-4 py-2 text-sm font-medium border border-red-200 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              🗑️ 删除
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
          >
            {isNew ? '取消上传' : '取消'}
          </button>
          <button
            onClick={() => onSave(form)}
            className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            {isNew ? '上传' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
