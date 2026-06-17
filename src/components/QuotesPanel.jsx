import React, { useState, useMemo } from 'react';
import { filterBySearch, getQuoteSearchFields } from '../utils/textSearch';
import { useI18n } from '../i18n/LanguageContext';
import { getBranding } from '../config/branding';
import { useQuotesContext } from '../context/QuotesContext';
import { exportQuotesBackup } from '../utils/quotesStorage';
import MemorialModal from './MemorialModal';

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
      id: initialData?.id || `user_${Date.now()}`,
      text: text.trim(),
      source: source.trim() || null,
      context: context.trim() || null,
      isUserAdded: initialData?.isUserAdded ?? true,
    });
  };

  return (
    <MemorialModal onClose={onCancel} zClass="z-[10000]">
      <div className="p-6">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('quotes.context')}</label>
            <input
              type="text"
              value={context}
              onChange={(e) => setContext(e.target.value)}
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
    </MemorialModal>
  );
}

export default function QuotesPanel({ onClose }) {
  const { t } = useI18n();
  const { quotes, stats, readOnly, updateQuote, deleteQuote, addQuote } = useQuotesContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [editingQuote, setEditingQuote] = useState(null);

  const filteredQuotes = useMemo(
    () => filterBySearch(quotes, searchQuery, getQuoteSearchFields),
    [quotes, searchQuery]
  );

  const handleSaveQuote = async (quote) => {
    if (editingQuote) {
      await updateQuote(quote);
      setEditingQuote(null);
    } else {
      await addQuote(quote);
    }
    setShowUploadForm(false);
  };

  const handleEditQuote = (quote) => {
    setEditingQuote(quote);
    setShowUploadForm(true);
  };

  const handleDeleteQuote = async (id) => {
    await deleteQuote(id);
  };

  return (
    <>
      <MemorialModal onClose={onClose} zClass="z-[9999]" panelClassName="max-w-2xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-memorial-border">
            <div className="flex items-center gap-2">
              <span className="text-xl">📚</span>
              <div>
                <h2 className="text-base font-bold font-memorial text-memorial-navy">{t('quotes.title')}</h2>
                <p className="text-xs text-memorial-muted">{getBranding().quotesPanelSubtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!readOnly && (
                <button
                  onClick={() => setShowUploadForm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  <span>＋</span>
                  <span>{t('quotes.upload')}</span>
                </button>
              )}
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => exportQuotesBackup(quotes)}
                  className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
                >
                  导出备份
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none transition-colors ml-1"
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
            {readOnly && (
              <p className="text-xs text-gray-500 mt-2">☁️ 语录来自云端（只读）。编辑请前往 /admin</p>
            )}
          </div>

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
                    {!readOnly && (
                      <div className="flex gap-1 flex-shrink-0 mt-0.5">
                        <button
                          onClick={() => handleEditQuote(quote)}
                          className="flex items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                          title="编辑"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => handleDeleteQuote(quote.id)}
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
                  {!quote.isUserAdded && (
                    <span className="inline-block mt-2 text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                      内置
                    </span>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="px-6 py-3 border-t border-memorial-border flex items-center justify-between gap-3">
            <div className="text-xs text-memorial-muted">
              <span>{t('quotes.total', { count: filteredQuotes.length })}</span>
              <span className="mx-1">·</span>
              <span>{t('quotes.statsBreakdown', { builtin: stats.builtin, user: stats.userAdded })}</span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium memorial-btn-secondary"
            >
              {t('quotes.close')}
            </button>
          </div>
      </MemorialModal>

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
