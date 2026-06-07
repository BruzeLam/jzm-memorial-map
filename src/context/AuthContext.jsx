import React, { createContext, useContext } from 'react';
import { useAdminAuth } from '../admin/useAdminAuth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const value = useAdminAuth();
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
