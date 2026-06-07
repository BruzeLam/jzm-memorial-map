import React, { createContext, useContext } from 'react';
import { useQuotes } from '../hooks/useQuotes';

const QuotesContext = createContext(null);

export function QuotesProvider({ children, isEditor = false }) {
  const value = useQuotes({ isEditor });
  return <QuotesContext.Provider value={value}>{children}</QuotesContext.Provider>;
}

export function useQuotesContext() {
  const ctx = useContext(QuotesContext);
  if (!ctx) {
    throw new Error('useQuotesContext must be used within QuotesProvider');
  }
  return ctx;
}
