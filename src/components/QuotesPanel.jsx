import React, { useState, useMemo } from 'react';
import { QUOTES } from '../data/quotes';
import { filterBySearch, getQuoteSearchFields } from '../utils/textSearch';
import { useI18n } from '../i18n/LanguageContext';

const STORAGE_KEY = 'jzm_all_quotes';
const MIGRATED_KEY = 'jzm_quotes_migrated_v2';

function initializeAllQuotes() {
  try {
    // 只在第一次加载时，把内置语录迁移进 localStorage
    const migrated = localStorage.getItem(MIGRATED_KEY);
    if (!migrated) {
      // 先读取已有的用户自添加语录
      const oldRaw = localStorage.getItem('jzm_user_quotes');
      const oldUserQuotes = oldRaw ? JSON.parse(oldRaw) : [];

      // 合并：内置语录 + 旧用户语录，全部标记为可编辑
      const allQuotes = [
        ...QUOTES.map((q, i) => ({
          id: q.id || `builtin_${i}`,
          text: q.text || '',
          source: q.source || null,
          context: q.context || null,
          isUserAdded: true,
        })),
        ...oldUserQuotes.map((q, i) => ({
          id: q.id || `user_migrated_${i}`,
          text: q.text || '',
          source: q.source || null,
          context: q.context || null,
          isUserAdded: true,
        })),
      ].filter(q => q.text.trim());

      localStorage.setItem(STORAGE_KEY, JSON.stringify(allQuotes));
      localStorage.setItem(MIGRATED_KEY, 'true');
      return allQuotes;
    }

    // 已迁移过，直接读取
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw).map(q => ({ ...q, isUserAdded: true }));
  } catch (e) {
    console.error('Failed to initialize quotes:', e);
    return QUOTES.map((q, i) => ({ ...q, id: q.id || `builtin_${i}`, isUserAdded: true }));
  }
}

function saveUserQuotes(quotes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
}

function UploadForm({ onSave, onCancel, initialData }) {
  const { t } = useI18n();
  const [text, setText] = useState(initialData?.text || '');
  const [source, setSource] = useState(initialData?.source || '');
  const [context, setContext] = useState(initialData?.context || '');
  const [error, setError] = useState('');

  const isEditing = !!initialData;

  const handleSubmit = () => {
    if (!text.trim()) {
      setError(t('quotes.contentRequired'));
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
          {isEditing ? t('quotes.editQuote') : t('quotes.uploadQuote')}
        </h3>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-gray-600">
                {t('quotes.content')} <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-gray-500">{text.length}/200</span>
            </div>
            <textarea
              value={text}
              onChange={(e) => { setText(e.target.value); setError(''); }}
              placeholder=""
              rows={3}
              maxLength={200}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('quotes.source')}</label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder=""
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('quotes.context')}</label>
            <input
              type="text"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder=""
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
            {t('quotes.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 py-2 text-sm font-medium bg-red-700 hover:bg-red-800 text-white rounded-lg transition-colors"
          >
            {isEditing ? t('quotes.update') : t('quotes.save')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function QuotesPanel({ onClose }) {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [editingQuote, setEditingQuote] = useState(null);
  const [userQuotes, setUserQuotes] = useState(initializeAllQuotes);

  const allQuotes = useMemo(() => userQuotes, [userQuotes]);

  const filteredQuotes = useMemo(
    () => filterBySearch(allQuotes, searchQuery, getQuoteSearchFields),
    [allQuotes, searchQuery]
  );

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
                <h2 className="text-base font-bold text-gray-800">{t('quotes.title')}</h2>
                <p className="text-xs text-gray-400">The Yangtze Quotes Library</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowUploadForm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white text-xs font-medium rounded-lg transition-colors"
              >
                <span>＋</span>
                <span>{t('quotes.upload')}</span>
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
                placeholder={t('quotes.searchPlaceholder')}
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
                <p className="text-sm">{t('quotes.noResults')}</p>
              </div>
            ) : (
              filteredQuotes.map((quote) => (
                  <div
                    key={quote.id}
                    className="border border-gray-100 rounded-xl p-4 hover:border-red-200 hover:bg-red-50/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-gray-800 font-medium text-sm leading-relaxed mb-2 flex-1">
                        "{quote.text}"
                      </p>
                      {quote.isUserAdded && (
                        <div className="flex gap-1 flex-shrink-0 mt-0.5">
                          <button
                            onClick={() => handleEditUserQuote(quote)}
                            className="flex items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                            title="编辑"
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => handleDeleteUserQuote(quote.id)}
                            className="flex items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
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
              {t('quotes.total', { count: filteredQuotes.length })}
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
            >
              {t('quotes.close')}
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
