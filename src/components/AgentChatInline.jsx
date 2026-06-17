import React, { useEffect, useRef } from 'react';
import { useI18n } from '../i18n/LanguageContext';

function renderSimpleMarkdown(text) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-memorial-navy">
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
    <div className="space-y-2 text-sm text-memorial-ink leading-relaxed whitespace-pre-wrap">
      {blocks.map((block, i) => {
        const lines = block.split('\n');
        const first = lines[0];
        if (first.startsWith('## ')) {
          return (
            <div key={i}>
              <h3 className="text-[10px] font-bold text-memorial-muted uppercase tracking-wide mb-1">
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

export const AGENT_SUGGESTIONS = [
  '他去过多少个国家？',
  '1997 年访美去了哪些城市？',
  '地图上有哪些在上海的历史事件？',
];

export default function AgentChatInline({
  messages,
  loading,
  error,
  onSuggestion,
  onNavigateMarker,
  compact = false,
}) {
  const { t } = useI18n();
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, loading]);

  if (messages.length === 0 && !loading) {
    return (
      <div className={`text-center ${compact ? 'py-4 px-2' : 'py-6 px-3'} space-y-3`}>
        <p className="text-xs text-memorial-muted">{t('agent.emptyHint')}</p>
        <div className="flex flex-wrap gap-1.5 justify-center">
          {AGENT_SUGGESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => onSuggestion?.(q)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-100 hover:bg-violet-100 text-left"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={listRef} className={`space-y-3 ${compact ? 'px-2 py-2' : 'px-3 py-2'}`}>
      {messages.map((msg, idx) => (
        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div
            className={`max-w-[95%] rounded-xl px-3 py-2 ${
              msg.role === 'user'
                ? 'bg-violet-600 text-white text-sm'
                : 'bg-memorial-surface border border-memorial-border'
            }`}
          >
            {msg.role === 'user' ? (
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            ) : (
              <>
                <MessageBody content={msg.content} />
                {msg.mapHits?.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-memorial-border">
                    <p className="text-[10px] text-memorial-muted mb-1">{t('agent.mapHits')}</p>
                    <div className="flex flex-wrap gap-1">
                      {msg.mapHits.map((hit) => (
                        <button
                          key={hit.id}
                          type="button"
                          onClick={() => onNavigateMarker?.(hit.id)}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-memorial-cream border border-violet-200 text-violet-700 hover:bg-violet-50"
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
          <div className="bg-memorial-surface border border-memorial-border rounded-xl px-3 py-2 text-xs text-memorial-muted">
            {t('agent.thinking')}
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}
