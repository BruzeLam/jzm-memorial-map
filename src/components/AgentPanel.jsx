import React, { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/LanguageContext';
import { useAgentChat } from '../hooks/useAgentChat';

function renderSimpleMarkdown(text) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-gray-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function MessageBody({ content }) {
  const blocks = content.split(/\n(?=## )/);
  return (
    <div className="space-y-3 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
      {blocks.map((block, i) => {
        const lines = block.split('\n');
        const first = lines[0];
        if (first.startsWith('## ')) {
          return (
            <div key={i}>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                {first.replace(/^##\s*/, '')}
              </h3>
              <div>{renderSimpleMarkdown(lines.slice(1).join('\n').trim())}</div>
            </div>
          );
        }
        return <div key={i}>{renderSimpleMarkdown(block)}</div>;
      })}
    </div>
  );
}

const SUGGESTIONS = [
  '1997 年访美去了哪些城市？',
  '地图上有哪些在上海的历史事件？',
  '90 年代有哪些东南亚行程？',
];

export default function AgentPanel({ onClose, onNavigateMarker }) {
  const { t } = useI18n();
  const { messages, loading, error, sendMessage, clearChat, setError } = useAgentChat();
  const [input, setInput] = useState('');
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await sendMessage(input);
    if (ok) setInput('');
  };

  const handleSuggestion = (q) => {
    setInput(q);
    setError(null);
  };

  return (
    <div
      className="fixed inset-0 z-[10001] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-2xl mx-0 sm:mx-4 flex flex-col mobile-detail-panel pb-safe max-h-[min(92dvh,720px)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-800">{t('agent.title')}</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">{t('agent.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                type="button"
                onClick={clearChat}
                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded"
              >
                {t('agent.clear')}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg"
              aria-label={t('agent.close')}
            >
              ✕
            </button>
          </div>
        </div>

        <div ref={listRef} className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 space-y-4 min-h-[200px]">
          {messages.length === 0 && !loading && (
            <div className="text-center py-6 space-y-4">
              <p className="text-sm text-gray-500">{t('agent.emptyHint')}</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGGESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleSuggestion(q)}
                    className="text-xs px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white text-sm'
                    : 'bg-gray-50 border border-gray-100'
                }`}
              >
                {msg.role === 'user' ? (
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <>
                    <MessageBody content={msg.content} />
                    {msg.mapHits?.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-gray-200">
                        <p className="text-[10px] text-gray-500 mb-1.5">{t('agent.mapHits')}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.mapHits.map((hit) => (
                            <button
                              key={hit.id}
                              type="button"
                              onClick={() => {
                                onNavigateMarker?.(hit.id);
                                onClose?.();
                              }}
                              className="text-[11px] px-2 py-1 rounded-lg bg-white border border-blue-200 text-blue-700 hover:bg-blue-50"
                            >
                              📍 {hit.name}
                              {hit.date ? ` · ${hit.date}` : ''}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm text-gray-500">
                {t('agent.thinking')}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="px-4 pb-2">
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-shrink-0 border-t border-gray-100 p-3 flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError(null);
            }}
            placeholder={t('agent.inputPlaceholder')}
            disabled={loading}
            maxLength={800}
            className="flex-1 text-sm px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 bg-gray-50 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium disabled:opacity-40 hover:bg-blue-700"
          >
            {t('agent.send')}
          </button>
        </form>
      </div>
    </div>
  );
}
