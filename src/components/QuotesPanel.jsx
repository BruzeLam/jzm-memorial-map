import React, { useState, useMemo } from 'react';
import { QUOTES } from '../data/quotes';

const STORAGE_KEY = 'jzm_user_quotes';

function loadUserQuotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const quotes = JSON.parse(raw);
    // 确保所有来自 localStorage 的语录都被标记为用户添加的
    return quotes.map((q) => ({
      ...q,
      isUserAdded: true,
    }));
  } catch (e) {
    return [];
  }
}

function saveUserQuotes(quotes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
}

function UploadForm({ onSave, onCancel, initialData }) {
  const [text, setText] = useState(initialData?.text || '');
  const [source, setSource] = useState(initialData?.source || '');
  const [context, setContext] = useState(initialData?.context || '');
  const [error, setError] = useState('');

  const isEditing = !!initialData;

  const handleSubmit = () => {
    if (!text.trim()) {
      setError('语录内容不能为空');
      return;
    }
    onSave({
      id: initialData?.id || 'user_' + Date.now(),
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
        <h3 className="text-base font-bold text-gray-800 mb-4">
          {isEditing ? '编辑语录' : '上传语录'}
        </h3>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-gray-600">
                语录内容 <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-gray-500">{text.length}/200</span>
            </div>
            <textarea
              value={text}
              onChange={(e) => { setText(e.target.value); setError(''); }}
              placeholder="请输入语录原文（最多200字）..."
              rows={3}
              maxLength={200}
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
            {isEditing ? '更新' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function QuotesPanel({ onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [editingQuote, setEditingQuote] = useState(null);
  const [userQuotes, setUserQuotes] = useState(loadUserQuotes);

  const allQuotes = useMemo(() => [...QUOTES, ...userQuotes], [userQuotes]);

  const filteredQuotes = useMemo(() => {
    if (!searchQuery.trim()) return allQuotes;

    const q = searchQuery.trim().toLowerCase();
    return allQuotes.filter(
      (quote) =>
        quote.text.toLowerCase().includes(q) ||
        (quote.source && quote.source.toLowerCase().includes(q)) ||
        (quote.context && quote.context.toLowerCase().includes(q))
    );
  }, [allQuotes, searchQuery]);

  const handleSaveQuote = (quote) => {
    let updated;
    if (editingQuote) {
      updated = userQuotes.map((q) => (q.id === quote.id ? quote : q));
      setEditingQuote(null);
    } else {
      updated = [...userQuotes, quote];
    }
    setUserQuotes(updated);
    saveUserQuotes(updated);
    setShowUploadForm(false);
  };

  const handleEditUserQuote = (quote) => {
    setEditingQuote(quote);
    setShowUploadForm(true);
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
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 mt-0.5">
                          <button
                            onClick={() => handleEditUserQuote(quote)}
                            className="text-gray-300 hover:text-blue-400 text-xs"
                            title="编辑"
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => handleDeleteUserQuote(quote.id)}
                            className="text-gray-300 hover:text-red-400 text-xs"
                            title="删除"
                          >
                            🗑
                          </button>
                        </div>
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
              共 {filteredQuotes.length} 条语录
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
          onCancel={() => {
            setShowUploadForm(false);
            setEditingQuote(null);
          }}
          initialData={editingQuote}
        />
      )}
    </>
  );
}
