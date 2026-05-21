import React, { useState } from 'react';
import { QUOTES, QUOTE_CATEGORIES } from '../data/quotes';

export default function QuotesPanel({ onClose }) {
  const [activeCategoryId, setActiveCategoryId] = useState(null);

  const filteredQuotes = activeCategoryId
    ? QUOTES.filter((q) => q.categoryId === activeCategoryId)
    : QUOTES;

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
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none transition-colors"
          >
            ✕
          </button>
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
          {filteredQuotes.map((quote) => {
            const category = QUOTE_CATEGORIES.find((c) => c.id === quote.categoryId);
            return (
              <div
                key={quote.id}
                className="border border-gray-100 rounded-xl p-4 hover:border-red-200 hover:bg-red-50/30 transition-colors"
              >
                {/* Quote text */}
                <p className="text-gray-800 font-medium text-sm leading-relaxed mb-2">
                  "{quote.text}"
                </p>

                {/* Source */}
                {quote.source && (
                  <p className="text-xs text-gray-500 mb-1.5">
                    —— {quote.source}
                  </p>
                )}

                {/* Context */}
                <p className="text-xs text-gray-400 leading-relaxed">
                  {quote.context}
                </p>

                {/* Category tag */}
                {activeCategoryId === null && (
                  <div className="mt-2">
                    <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                      {category?.title}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400">共 {filteredQuotes.length} 条语录</span>
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
