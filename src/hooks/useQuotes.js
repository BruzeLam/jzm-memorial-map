import { useState, useEffect, useCallback, useMemo } from 'react';
import { isCloudEnabled } from '../lib/cloudConfig';
import { fetchCloudQuotes, upsertCloudQuote, deleteCloudQuote } from '../services/cloudData';
import {
  loadLocalQuotes,
  saveLocalQuotes,
  classifyQuotes,
  normalizeQuoteRecord,
  QUOTES_CACHE_KEY,
  BUILTIN_QUOTES,
} from '../utils/quotesStorage';
import { readJsonCache, runWhenIdle } from '../utils/storageCache';

function loadQuotesCache() {
  const cached = readJsonCache(QUOTES_CACHE_KEY);
  return Array.isArray(cached) && cached.length > 0 ? cached : null;
}

export function useQuotes({ isEditor = false } = {}) {
  const cloudMode = isCloudEnabled();
  const [quotes, setQuotes] = useState(() => {
    if (!cloudMode) return loadLocalQuotes();
    return loadQuotesCache() || loadLocalQuotes();
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const readOnly = cloudMode && !isEditor;

  const stats = useMemo(() => classifyQuotes(quotes), [quotes]);

  useEffect(() => {
    if (!cloudMode) {
      saveLocalQuotes(quotes);
    }
  }, [quotes, cloudMode]);

  useEffect(() => {
    if (!cloudMode) return undefined;

    let cancelled = false;

    const fetchQuotes = () => {
      setLoading(true);
      fetchCloudQuotes()
        .then((rows) => {
          if (cancelled) return;
          if (rows?.length) {
            setQuotes(rows);
            try {
              localStorage.setItem(QUOTES_CACHE_KEY, JSON.stringify(rows));
            } catch (_) {}
          } else {
            setQuotes(loadLocalQuotes());
          }
          setError(null);
        })
        .catch((err) => {
          if (cancelled) return;
          console.error('Cloud quotes fetch failed:', err);
          setError(err.message);
          const cached = loadQuotesCache();
          if (cached) setQuotes(cached);
          else setQuotes(loadLocalQuotes());
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };

    const cancelIdle = runWhenIdle(fetchQuotes, 800);

    return () => {
      cancelled = true;
      cancelIdle();
    };
  }, [cloudMode]);

  const addQuote = useCallback(
    async (quoteData) => {
      if (readOnly) return null;
      const quote = normalizeQuoteRecord({ ...quoteData, isUserAdded: true });
      if (cloudMode) {
        await upsertCloudQuote(quote);
      }
      setQuotes((prev) => [...prev, quote]);
      return quote;
    },
    [readOnly, cloudMode]
  );

  const updateQuote = useCallback(
    async (quote) => {
      if (readOnly) return;
      const normalized = normalizeQuoteRecord(quote);
      if (cloudMode) {
        await upsertCloudQuote(normalized);
      }
      setQuotes((prev) => prev.map((q) => (q.id === normalized.id ? normalized : q)));
    },
    [readOnly, cloudMode]
  );

  const deleteQuote = useCallback(
    async (id) => {
      if (readOnly) return;
      if (cloudMode) {
        await deleteCloudQuote(id);
      }
      setQuotes((prev) => prev.filter((q) => q.id !== id));
    },
    [readOnly, cloudMode]
  );

  const refresh = useCallback(async () => {
    if (!cloudMode) {
      setQuotes(loadLocalQuotes());
      return;
    }
    const rows = await fetchCloudQuotes();
    setQuotes(rows?.length ? rows : loadLocalQuotes());
  }, [cloudMode]);

  return {
    quotes,
    stats,
    loading,
    error,
    readOnly,
    builtinCount: BUILTIN_QUOTES.length,
    addQuote,
    updateQuote,
    deleteQuote,
    refresh,
  };
}
