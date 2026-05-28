import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { messages } from './messages';
import { MARKER_TYPES } from '../utils/constants';
import {
  DEFAULT_LOCALE,
  LOCALE_FALLBACK,
  LOCALE_OPTIONS,
  VALID_LOCALES,
} from './localeConfig';

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

function resolveMessage(locale, key) {
  const chain = LOCALE_FALLBACK[locale] || LOCALE_FALLBACK[DEFAULT_LOCALE];
  for (const loc of chain) {
    const raw = getNested(messages[loc], key);
    if (raw != null) return raw;
  }
  return undefined;
}

export function LanguageProvider({ children }) {
  const [locale, setLocaleState] = useState(() => {
    try {
      const stored = localStorage.getItem(LOCALE_KEY);
      if (stored && VALID_LOCALES.includes(stored)) return stored;
    } catch {
      /* ignore */
    }
    return DEFAULT_LOCALE;
  });

  const setLocale = useCallback((next) => {
    const value = VALID_LOCALES.includes(next) ? next : DEFAULT_LOCALE;
    setLocaleState(value);
    try {
      localStorage.setItem(LOCALE_KEY, value);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key, vars) => {
      const raw = resolveMessage(locale, key) ?? key;
      return interpolate(raw, vars);
    },
    [locale]
  );

  const markerTypeLabel = useCallback(
    (typeKey) => {
      const fromMessages = resolveMessage(locale, `markerType.${typeKey}`);
      if (fromMessages) return fromMessages;
      const info = MARKER_TYPES[typeKey];
      if (!info) return typeKey;
      if (locale === 'en' || ['fr', 'de', 'es'].includes(locale)) {
        return info.labelEn || info.label;
      }
      return info.label;
    },
    [locale]
  );

  const currentLocaleOption = useMemo(
    () => LOCALE_OPTIONS.find((o) => o.code === locale) || LOCALE_OPTIONS[0],
    [locale]
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      markerTypeLabel,
      localeOptions: LOCALE_OPTIONS,
      currentLocaleOption,
      isEn: locale === 'en',
    }),
    [locale, setLocale, t, markerTypeLabel, currentLocaleOption]
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
