import React, { useState, useMemo, useEffect } from 'react';
import { compressImage } from '../utils/imageCompression';
import { filterBySearch, getArchiveSearchFields } from '../utils/textSearch';
import {
  normalizeTagList,
  collectAllTags,
  registerTags,
} from '../utils/archiveTags';
import { normalizeArchiveRecord } from '../utils/archivesStorage';
import ArchiveTagInput from './ArchiveTagInput';
import { useI18n } from '../i18n/LanguageContext';
import { getBranding } from '../config/branding';
import { useArchivesContext } from '../context/ArchivesContext';
import MemorialModal from './MemorialModal';

function TextWithLinks({ text, className = '' }) {
  if (!text) return null;
  const parts = text.split(/(https?:\/\/[^\s<>"{}|\\^`[\]]+)/g);
  return (
    <span className={className}>
      {parts.map((part, i) =>
        /^https?:\/\//.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-800 underline hover:text-amber-900 break-all"
          >
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

function listPreview(archive) {
  if (archive.title?.trim()) return archive.title.trim();
  const t = archive.text.replace(/\s+/g, ' ').trim();
  return t.length > 72 ? `${t.slice(0, 72)}…` : t;
}

function ArchiveTagPills({ tags, onTagClick, className = '' }) {
  if (!tags?.length) return null;
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {tags.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={onTagClick ? () => onTagClick(tag) : undefined}
          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-900 ${
            onTagClick ? 'hover:bg-amber-200 cursor-pointer' : ''
          }`}
        >
          #{tag}
        </button>
      ))}
    </div>
  );
}

function ArchiveForm({ onSave, onCancel, initialData, allTags }) {
  const { t } = useI18n();
  const [title, setTitle] = useState(initialData?.title || '');
  const [text, setText] = useState(initialData?.text || '');
  const [source, setSource] = useState(initialData?.source || '');
  const [tags, setTags] = useState(() => normalizeTagList(initialData?.tags || []));
  const [links, setLinks] = useState(
    initialData?.links?.length ? initialData.links : [{ label: '', url: '' }]
  );
  const [images, setImages] = useState(initialData?.images || []);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const isEditing = !!initialData;

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const compressed = await Promise.all(
        files.map(async (file) => {
          const data = await compressImage(file);
          return { data, name: file.name };
        })
      );
      setImages((prev) => [...prev, ...compressed]);
    } catch (err) {
      setError(err.message || '图片上传失败');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = () => {
    if (!text.trim()) {
      setError('正文内容不能为空');
      return;
    }
    const cleanLinks = links
      .map((l) => ({ label: (l.label || '').trim(), url: (l.url || '').trim() }))
      .filter((l) => l.url);
    onSave({
      id: initialData?.id || `archive_${Date.now()}`,
      title: title.trim(),
      text: text.trim(),
      source: source.trim() || null,
      tags: normalizeTagList(tags),
      links: cleanLinks,
      images,
      isUserAdded: true,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[10001] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="text-base font-bold text-gray-800">
            {isEditing ? t('archive.formEdit') : t('archive.formAdd')}
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">标题（可选）</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="列表中显示的简短标题"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-gray-600">
                正文 <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-gray-500">{text.length}/20000</span>
            </div>
            <textarea
              value={text}
              onChange={(e) => { setText(e.target.value); setError(''); }}
              placeholder="较长原文、讲话摘录等；可直接粘贴含 https:// 的链接"
              rows={10}
              maxLength={20000}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-y min-h-[160px]"
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">出处 / 引文</label>
            <textarea
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="文献名、讲话场合、日期等"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {t('archive.tagsLabel')}
            </label>
            <ArchiveTagInput
              tags={tags}
              onChange={setTags}
              allTags={allTags}
              placeholder={t('archive.tagsPlaceholder')}
              hint={t('archive.tagsHint')}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">相关链接</label>
            <div className="space-y-2">
              {links.map((link, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={link.label}
                    onChange={(e) => {
                      const next = [...links];
                      next[idx] = { ...next[idx], label: e.target.value };
                      setLinks(next);
                    }}
                    placeholder="链接说明"
                    className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-xs"
                  />
                  <input
                    type="url"
                    value={link.url}
                    onChange={(e) => {
                      const next = [...links];
                      next[idx] = { ...next[idx], url: e.target.value };
                      setLinks(next);
                    }}
                    placeholder="https://"
                    className="flex-[1.2] px-2 py-1.5 border border-gray-300 rounded-lg text-xs"
                  />
                  {links.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setLinks(links.filter((_, i) => i !== idx))}
                      className="text-gray-400 hover:text-red-500 px-1"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setLinks([...links, { label: '', url: '' }])}
                className="text-xs text-amber-800 hover:text-amber-900"
              >
                ＋ 添加链接
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">配图</label>
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={img.data}
                      alt={img.name || ''}
                      className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => setImages(images.filter((_, i) => i !== idx))}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            <label className="inline-flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-xs text-gray-600 cursor-pointer hover:bg-gray-50">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={handleImageUpload}
                disabled={uploading}
              />
              {uploading ? '压缩上传中…' : '🖼️ 添加图片'}
            </label>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={uploading}
            className="flex-1 py-2 text-sm font-medium bg-amber-800 hover:bg-amber-900 text-white rounded-lg disabled:opacity-50"
          >
            {isEditing ? '更新' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ArchivePanel({ onClose }) {
  const { t } = useI18n();
  const { archives, readOnly, addArchive, updateArchive, deleteArchive, ensureCloudLoaded } =
    useArchivesContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    ensureCloudLoaded?.();
  }, [ensureCloudLoaded]);

  const allTags = useMemo(() => collectAllTags(archives), [archives]);

  const filtered = useMemo(
    () => filterBySearch(archives, searchQuery, getArchiveSearchFields),
    [archives, searchQuery]
  );

  const handleSave = async (item) => {
    const normalized = normalizeArchiveRecord({ ...item, tags: normalizeTagList(item.tags) });
    registerTags(normalized.tags);
    if (editingItem) {
      await updateArchive(normalized);
      setEditingItem(null);
    } else {
      await addArchive(normalized);
    }
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定删除这条文献吗？')) return;
    await deleteArchive(id);
    if (expandedId === id) setExpandedId(null);
  };

  return (
    <>
      <MemorialModal onClose={onClose} zClass="z-[9999]" panelClassName="max-w-3xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-memorial-border">
            <div className="flex items-center gap-2">
              <span className="text-xl">📁</span>
              <div>
                <h2 className="text-base font-bold font-memorial text-memorial-navy">{t('archive.title')}</h2>
                <p className="text-xs text-memorial-muted">{getBranding().archivePanelSubtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!readOnly && (
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-white text-xs font-medium rounded-lg"
                >
                  <span>＋</span>
                  <span>{t('archive.addDoc')}</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none ml-1"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="px-6 py-3 border-b border-gray-100">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('archive.searchPlaceholder')}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-gray-50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
            {readOnly && (
              <p className="text-xs text-gray-500 mt-2">☁️ 档案馆来自云端（只读）。编辑请前往 /admin</p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <div className="text-3xl mb-2">🔍</div>
                <p className="text-sm">{t('archive.noResults')}</p>
              </div>
            ) : (
              filtered.map((item) => {
                const expanded = expandedId === item.id;
                return (
                  <article
                    key={item.id}
                    className="border border-gray-100 rounded-xl overflow-hidden hover:border-amber-200 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : item.id)}
                      className="w-full text-left px-4 py-3 flex items-start justify-between gap-2 bg-amber-50/40 hover:bg-amber-50/70"
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-800 mb-0.5">
                          {listPreview(item)}
                        </h3>
                        {item.source && !expanded && (
                          <p className="text-xs text-gray-500 truncate">—— {item.source}</p>
                        )}
                        {!expanded && item.tags?.length > 0 && (
                          <ArchiveTagPills
                            tags={item.tags}
                            onTagClick={(tag) => setSearchQuery(`#${tag}`)}
                            className="mt-1.5"
                          />
                        )}
                      </div>
                      <span className="text-gray-400 text-xs flex-shrink-0 mt-1">
                        {expanded ? `${t('archive.collapse')} ▲` : `${t('archive.expand')} ▼`}
                      </span>
                    </button>

                    {expanded && (
                      <div className="px-4 pb-4 pt-1 border-t border-amber-100/80">
                        {!readOnly && (
                          <div className="flex justify-end gap-1 mb-2">
                            <button
                              onClick={() => {
                                setEditingItem(item);
                                setShowForm(true);
                              }}
                              className="w-7 h-7 rounded-md text-gray-400 hover:text-blue-500 hover:bg-blue-50"
                              title="编辑"
                            >
                              ✎
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="w-7 h-7 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50"
                              title="删除"
                            >
                              🗑
                            </button>
                          </div>
                        )}

                        <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap mb-3">
                          <TextWithLinks text={item.text} />
                        </div>

                        {item.source && (
                          <p className="text-xs text-gray-600 mb-2 border-l-2 border-amber-300 pl-2">
                            —— {item.source}
                          </p>
                        )}

                        {item.tags?.length > 0 && (
                          <ArchiveTagPills
                            tags={item.tags}
                            onTagClick={(tag) => setSearchQuery(`#${tag}`)}
                            className="mb-2"
                          />
                        )}

                        {item.links?.length > 0 && (
                          <ul className="text-xs space-y-1 mb-2">
                            {item.links.map((link, i) => (
                              <li key={i}>
                                <a
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-amber-800 underline hover:text-amber-900"
                                >
                                  {link.label || link.url}
                                </a>
                              </li>
                            ))}
                          </ul>
                        )}

                        {item.images?.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {item.images.map((img, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setPreviewImage(img.data)}
                                className="block"
                              >
                                <img
                                  src={img.data}
                                  alt={img.name || ''}
                                  className="w-24 h-24 object-cover rounded-lg border border-gray-200 hover:opacity-90"
                                />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>

          <div className="px-6 py-3 border-t border-memorial-border flex items-center justify-between">
            <span className="text-xs text-memorial-muted">{t('archive.total', { count: filtered.length })}</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium memorial-btn-secondary"
            >
              {t('archive.close')}
            </button>
          </div>
      </MemorialModal>

      {showForm && (
        <ArchiveForm
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
          initialData={editingItem}
          allTags={allTags}
        />
      )}

      {previewImage && (
        <div
          className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            alt=""
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 text-white text-2xl"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
