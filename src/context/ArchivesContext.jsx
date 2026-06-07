import React, { createContext, useContext } from 'react';
import { useArchives } from '../hooks/useArchives';

const ArchivesContext = createContext(null);

export function ArchivesProvider({ children }) {
  const value = useArchives();
  return <ArchivesContext.Provider value={value}>{children}</ArchivesContext.Provider>;
}

export function useArchivesContext() {
  const ctx = useContext(ArchivesContext);
  if (!ctx) {
    throw new Error('useArchivesContext must be used within ArchivesProvider');
  }
  return ctx;
}
