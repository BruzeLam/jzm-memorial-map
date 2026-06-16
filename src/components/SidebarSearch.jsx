import React from 'react';
import { useI18n } from '../i18n/LanguageContext';
import { isPortfolioMode } from '../config/branding';

export default function SidebarSearch({
  mode,
  onModeChange,
  searchQuery,
  setSearchQuery,
  clearSearch,
  agentDraft,
  setAgentDraft,
  onAgentSubmit,
  agentLoading,
  onClearAgentChat,
  hasAgentMessages,
  compact = false,
}) {
  const { t } = useI18n();
  const showAgent = !isPortfolioMode();

  const handleKeyDown = (e) => {
    if (mode !== 'agent') return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onAgentSubmit?.();
    }
  };

  const isAgent = mode === 'agent';
  const value = isAgent ? agentDraft : searchQuery;
  const onChange = isAgent
    ? (e) => setAgentDraft?.(e.target.value)
    : (e) => setSearchQuery(e.target.value);

  return (
    <div className="space-y-2">
      {showAgent && (
        <div
          className={`flex p-0.5 rounded-lg bg-gray-100 border border-gray-200 ${compact ? 'text-[10px]' : 'text-xs'}`}
          role="tablist"
          aria-label={t('sidebar.searchModeLabel')}
        >
          <button
            type="button"
            role="tab"
            aria-selected={!isAgent}
            onClick={() => onModeChange('search')}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md font-medium transition-colors ${
              !isAgent ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>🔍</span>
            <span>{t('sidebar.searchModeSearch')}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isAgent}
            onClick={() => onModeChange('agent')}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md font-medium transition-colors ${
              isAgent ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>🤖</span>
            <span>{t('sidebar.searchModeAgent')}</span>
          </button>
        </div>
      )}

      <div className="relative flex gap-1.5">
        <div className="relative flex-1 min-w-0">
          <span
            className={`absolute left-3 top-1/2 -translate-y-1/2 ${
              isAgent ? 'text-violet-400' : 'text-gray-400'
            } ${compact ? 'text-xs' : 'text-sm'}`}
          >
            {isAgent ? '🤖' : '🔍'}
          </span>
          <input
            type="text"
            value={value}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            placeholder={
              isAgent ? t('agent.inputPlaceholder') : t('sidebar.searchPlaceholder')
            }
            disabled={isAgent && agentLoading}
            maxLength={isAgent ? 800 : undefined}
            className={`w-full pl-9 border rounded-lg focus:outline-none bg-gray-50 transition-colors ${
              compact ? 'py-1.5 text-xs pr-8' : 'py-2 text-sm pr-9'
            } ${
              isAgent
                ? 'border-violet-200 focus:border-violet-400 disabled:opacity-60'
                : 'border-gray-200 focus:border-blue-400'
            }`}
          />
          {!isAgent && searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              aria-label={t('sidebar.clearSearch')}
            >
              ✕
            </button>
          )}
          {isAgent && agentDraft && !agentLoading && (
            <button
              type="button"
              onClick={() => setAgentDraft?.('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              aria-label={t('sidebar.clearSearch')}
            >
              ✕
            </button>
          )}
        </div>

        {isAgent && (
          <button
            type="button"
            onClick={onAgentSubmit}
            disabled={agentLoading || !agentDraft?.trim()}
            className={`flex-shrink-0 rounded-lg bg-violet-600 text-white font-medium disabled:opacity-40 hover:bg-violet-700 transition-colors ${
              compact ? 'px-2.5 text-xs min-w-[44px] min-h-[34px]' : 'px-3 text-sm min-h-[40px]'
            }`}
          >
            {t('agent.send')}
          </button>
        )}
      </div>

      {isAgent && hasAgentMessages && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClearAgentChat}
            className="text-[10px] text-gray-500 hover:text-gray-700"
          >
            {t('agent.clear')}
          </button>
        </div>
      )}
    </div>
  );
}
