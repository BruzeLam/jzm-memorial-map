import React from 'react';
import { useI18n } from '../i18n/LanguageContext';

export default function SearchBar({ searchQuery, setSearchQuery, clearSearch, compact = false }) {
  const { t } = useI18n();
  return (
    <div className="relative">
      <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 ${compact ? 'text-xs' : 'text-sm'}`}>🔍</span>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={t('sidebar.searchPlaceholder')}
        className={`w-full pl-9 pr-8 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 bg-gray-50 ${
          compact ? 'py-1.5 text-xs' : 'py-2 text-sm'
        }`}
      />
      {searchQuery && (
        <button
          onClick={clearSearch}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
        >
          ✕
        </button>
      )}
    </div>
  );
}
