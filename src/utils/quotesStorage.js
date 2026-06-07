import { QUOTES } from '../data/quotes';
import { PORTFOLIO_QUOTES } from '../data/portfolio/quotes';
import { isPortfolioDemoData, getStorageKeys, getBranding } from '../config/branding';
import { downloadFile } from './dataExport';

const _sk = getStorageKeys();
export const QUOTES_STORAGE_KEY = _sk.quotes;
export const QUOTES_MIGRATED_KEY = _sk.quotesMigrated;
export const QUOTES_CACHE_KEY = _sk.quotesCache;

const BUILTIN_SOURCE = isPortfolioDemoData() ? PORTFOLIO_QUOTES : QUOTES;
const BUILTIN_IDS = new Set(BUILTIN_SOURCE.map((q) => q.id));

export function isBuiltinQuoteId(id) {
  return BUILTIN_IDS.has(id) || (typeof id === 'string' && id.startsWith('builtin_'));
}

export function normalizeQuoteRecord(quote) {
  return {
    id: quote.id,
    text: (quote.text || '').trim(),
    source: quote.source || null,
    context: quote.context || null,
    isUserAdded: !isBuiltinQuoteId(quote.id),
  };
}

export function classifyQuotes(quotes) {
  const list = Array.isArray(quotes) ? quotes : [];
  const builtin = list.filter((q) => !q.isUserAdded);
  const userAdded = list.filter((q) => q.isUserAdded);
  return {
    total: list.length,
    builtin: builtin.length,
    userAdded: userAdded.length,
  };
}

/** 读取浏览器 localStorage 中的全部语录（含内置 + 自添） */
export function loadLocalQuotes() {
  try {
    const migrated = localStorage.getItem(QUOTES_MIGRATED_KEY);
    if (!migrated) {
      const oldRaw = localStorage.getItem('jzm_user_quotes');
      const oldUserQuotes = oldRaw ? JSON.parse(oldRaw) : [];

      const allQuotes = [
        ...BUILTIN_SOURCE.map((q, i) =>
          normalizeQuoteRecord({
            id: q.id || `builtin_${i}`,
            text: q.text,
            source: q.source,
            context: q.context,
          })
        ),
        ...oldUserQuotes.map((q, i) =>
          normalizeQuoteRecord({
            id: q.id || `user_migrated_${i}`,
            text: q.text,
            source: q.source,
            context: q.context,
            isUserAdded: true,
          })
        ),
      ].filter((q) => q.text);

      localStorage.setItem(QUOTES_STORAGE_KEY, JSON.stringify(allQuotes));
      localStorage.setItem(QUOTES_MIGRATED_KEY, 'true');
      return allQuotes;
    }

    const raw = localStorage.getItem(QUOTES_STORAGE_KEY);
    if (!raw) return BUILTIN_SOURCE.map((q, i) => normalizeQuoteRecord({ ...q, id: q.id || `builtin_${i}` }));
    return JSON.parse(raw).map(normalizeQuoteRecord).filter((q) => q.text);
  } catch (e) {
    console.error('Failed to load quotes from localStorage:', e);
    return BUILTIN_SOURCE.map((q, i) => normalizeQuoteRecord({ ...q, id: q.id || `builtin_${i}` }));
  }
}

export function saveLocalQuotes(quotes) {
  localStorage.setItem(QUOTES_STORAGE_KEY, JSON.stringify(quotes));
}

export function loadLegacyLocalQuotes() {
  return loadLocalQuotes();
}

export function exportQuotesBackup(quotes, filenamePrefix) {
  const prefix = filenamePrefix || getBranding().exportFilePrefix + '-quotes';
  const timestamp = new Date().toISOString().slice(0, 10);
  const stats = classifyQuotes(quotes);
  const payload = {
    title: `${getBranding().siteTitle} · 文献摘录备份`,
    exportedAt: new Date().toISOString(),
    stats,
    quotes,
  };
  downloadFile(JSON.stringify(payload, null, 2), `${prefix}-${timestamp}.json`, 'application/json');
}

export function parseQuotesImport(raw) {
  const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
  let list = [];
  if (Array.isArray(data)) list = data;
  else if (Array.isArray(data?.quotes)) list = data.quotes;
  else throw new Error('无法识别语录 JSON 格式');

  return list
    .map((q, i) =>
      normalizeQuoteRecord({
        id: q.id || `import_${Date.now()}_${i}`,
        text: q.text,
        source: q.source,
        context: q.context,
        isUserAdded: q.isUserAdded ?? !isBuiltinQuoteId(q.id),
      })
    )
    .filter((q) => q.text);
}

export { BUILTIN_SOURCE as BUILTIN_QUOTES };
