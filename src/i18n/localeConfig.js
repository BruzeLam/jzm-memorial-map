/** 可选界面语言（用户内容不随语言切换） */
export const LOCALE_OPTIONS = [
  { code: 'zh', native: '简体中文' },
  { code: 'zh-TW', native: '繁體中文' },
  { code: 'en', native: 'English' },
  { code: 'fr', native: 'Français' },
  { code: 'ja', native: '日本語' },
  { code: 'ru', native: 'Русский' },
  { code: 'de', native: 'Deutsch' },
  { code: 'es', native: 'Español' },
];

export const DEFAULT_LOCALE = 'zh';

export const VALID_LOCALES = LOCALE_OPTIONS.map((o) => o.code);

export const LOCALE_FALLBACK = {
  zh: ['zh'],
  'zh-TW': ['zh-TW', 'zh'],
  en: ['en', 'zh'],
  fr: ['fr', 'en', 'zh'],
  ja: ['ja', 'en', 'zh'],
  ru: ['ru', 'en', 'zh'],
  de: ['de', 'en', 'zh'],
  es: ['es', 'en', 'zh'],
};
