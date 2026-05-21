import React, { useState, useMemo } from 'react';
import { QUOTES, QUOTE_CATEGORIES } from '../data/quotes';

const STORAGE_KEY = 'jzm_user_quotes';

function loadUserQuotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveUserQuotes(quotes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
}

function UploadForm({ onSave, onCancel }) {
  const [text, setText] = useState('');
  const [source, setSource] = useState('');
  const [context, setContext] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!text.trim()) {
      setError('语录内容不能为空');
      return;
    }
    onSave({
      id: 'user_' + Date.now(),
      categoryId: 'cat_2',
      text: text.trim(),
      source: source.trim() || null,
      context: context.trim() || null,
      isUserAdded: true,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-bold text-gray-800 mb-4">上传语录</h3>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              语录内容 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={text}
              onChange={(e) => { setText(e.target.value); setError(''); }}
              placeholder="请输入语录原文..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">出处</label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="如：[宋] 范仲淹《岳阳楼记》"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">背景说明</label>
            <input
              type="text"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="如：1997年访美时引用，表达..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 py-2 text-sm font-medium bg-red-700 hover:bg-red-800 text-white rounded-lg transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

export default function QuotesPanel({ onClose }) {
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [userQuotes, setUserQuotes] = useState(loadUserQuotes);

  const allQuotes = useMemo(() => [...QUOTES, ...userQuotes], [userQuotes]);

  const filteredQuotes = useMemo(() => {
    let result = activeCategoryId
      ? allQuotes.filter((q) => q.categoryId === activeCategoryId)
      : allQuotes;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (quote) =>
          quote.text.toLowerCase().includes(q) ||
          (quote.source && quote.source.toLowerCase().includes(q)) ||
          (quote.context && quote.context.toLowerCase().includes(q))
      );
    }

    return result;
  }, [allQuotes, activeCategoryId, searchQuery]);

  const handleSaveQuote = (quote) => {
    const updated = [...userQuotes, quote];
    setUserQuotes(updated);
    saveUserQuotes(updated);
    setShowUploadForm(false);
  };

  const handleDeleteUserQuote = (id) => {
    const updated = userQuotes.filter((q) => q.id !== id);
    setUserQuotes(updated);
    saveUserQuotes(updated);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.45)' }}
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col"
          style={{ maxHeight: '85vh' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-xl">📚</span>
              <div>
                <h2 className="text-base font-bold text-gray-800">长者语录</h2>
                <p className="text-xs text-gray-400">The Yangtze Quotes Library</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowUploadForm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white text-xs font-medium rounded-lg transition-colors"
              >
                <span>＋</span>
                <span>上传语录</span>
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none transition-colors ml-1"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="px-6 py-3 border-b border-gray-100">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索语录、出处、背景..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300 bg-gray-50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Category filter */}
          <div className="flex gap-2 px-6 py-3 border-b border-gray-100 overflow-x-auto flex-shrink-0">
            <button
              onClick={() => setActiveCategoryId(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                activeCategoryId === null
                  ? 'bg-red-700 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              全部 ({allQuotes.length})
            </button>
            {QUOTE_CATEGORIES.map((cat) => {
              const count = allQuotes.filter((q) => q.categoryId === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategoryId(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    activeCategoryId === cat.id
                      ? 'bg-red-700 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat.title} ({count})
                </button>
              );
            })}
          </div>

          {/* Quotes list */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
            {filteredQuotes.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <div className="text-3xl mb-2">🔍</div>
                <p className="text-sm">未找到相关语录</p>
              </div>
            ) : (
              filteredQuotes.map((quote) => (
                  <div
                    key={quote.id}
                    className="border border-gray-100 rounded-xl p-4 hover:border-red-200 hover:bg-red-50/30 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-gray-800 font-medium text-sm leading-relaxed mb-2 flex-1">
                        "{quote.text}"
                      </p>
                      {quote.isUserAdded && (
                        <button
                          onClick={() => handleDeleteUserQuote(quote.id)}
                          className="text-gray-300 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 mt-0.5"
                          title="删除"
                        >
                          🗑
                        </button>
                      )}
                    </div>
                    {quote.source && (
                      <p className="text-xs text-gray-500 mb-1.5">—— {quote.source}</p>
                    )}
                    {quote.context && (
                      <p className="text-xs text-gray-400 leading-relaxed">{quote.context}</p>
                    )}
                  </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {searchQuery ? `搜索到 ${filteredQuotes.length} 条` : `共 ${allQuotes.length} 条语录`}
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      </div>

      {showUploadForm && (
        <UploadForm
          onSave={handleSaveQuote}
          onCancel={() => setShowUploadForm(false)}
        />
      )}
    </>
  );
}
