import React, { useState, useMemo } from 'react';
import { QUOTES, QUOTE_CATEGORIES } from '../data/quotes';

export default function QuotesPanel({ onClose }) {
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredQuotes = useMemo(() => {
    let result = activeCategoryId
      ? QUOTES.filter((q) => q.categoryId === activeCategoryId)
      : QUOTES;

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
  }, [activeCategoryId, searchQuery]);

  return (
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
              onClick={() => alert('上传功能即将开放！')}
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
            全部 ({QUOTES.length})
          </button>
          {QUOTE_CATEGORIES.map((cat) => {
            const count = QUOTES.filter((q) => q.categoryId === cat.id).length;
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
            filteredQuotes.map((quote) => {
              const category = QUOTE_CATEGORIES.find((c) => c.id === quote.categoryId);
              return (
                <div
                  key={quote.id}
                  className="border border-gray-100 rounded-xl p-4 hover:border-red-200 hover:bg-red-50/30 transition-colors"
                >
                  <p className="text-gray-800 font-medium text-sm leading-relaxed mb-2">
                    "{quote.text}"
                  </p>
                  {quote.source && (
                    <p className="text-xs text-gray-500 mb-1.5">—— {quote.source}</p>
                  )}
                  <p className="text-xs text-gray-400 leading-relaxed">{quote.context}</p>
                  {activeCategoryId === null && (
                    <div className="mt-2">
                      <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                        {category?.title}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {searchQuery
              ? `搜索到 ${filteredQuotes.length} 条`
              : `共 ${filteredQuotes.length} 条语录`}
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
  );
}
