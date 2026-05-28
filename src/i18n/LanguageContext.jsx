import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { messages } from './messages';
import { MARKER_TYPES } from '../utils/constants';

const LOCALE_KEY = 'jzm_locale';
const LanguageContext = createContext(null);

function getNested(obj, path) {
  return path.split('.').reduce((acc, key) => (acc != null ? acc[key] : undefined), obj);
}

function interpolate(template, vars = {}) {
  if (!template || typeof template !== 'string') return template ?? '';
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    vars[key] != null ? String(vars[key]) : `{${key}}`
  );
}

export function LanguageProvider({ children }) {
  const [locale, setLocaleState] = useState(() => {
    try {
      const stored = localStorage.getItem(LOCALE_KEY);
      return stored === 'en' ? 'en' : 'zh';
    } catch {
      return 'zh';
    }
  });

  const setLocale = useCallback((next) => {
    const value = next === 'en' ? 'en' : 'zh';
    setLocaleState(value);
    try {
      localStorage.setItem(LOCALE_KEY, value);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key, vars) => {
      const raw =
        getNested(messages[locale], key) ??
        getNested(messages.zh, key) ??
        key;
      return interpolate(raw, vars);
    },
    [locale]
  );

  const markerTypeLabel = useCallback(
    (typeKey) => {
      const fromMessages = getNested(messages[locale], `markerType.${typeKey}`);
      if (fromMessages) return fromMessages;
      const info = MARKER_TYPES[typeKey];
      if (!info) return typeKey;
      return locale === 'en' ? info.labelEn || info.label : info.label;
    },
    [locale]
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      markerTypeLabel,
      isEn: locale === 'en',
    }),
    [locale, setLocale, t, markerTypeLabel]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useI18n must be used within LanguageProvider');
  }
  return ctx;
}
