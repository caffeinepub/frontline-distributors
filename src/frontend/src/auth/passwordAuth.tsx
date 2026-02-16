import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface PasswordAuthState {
  isAuthenticated: boolean;
  role: 'owner' | 'salesman' | null;
  isInitializing: boolean;
}

interface PasswordAuthContextValue extends PasswordAuthState {
  login: (role: 'owner' | 'salesman') => void;
  logout: () => void;
  clearAuth: () => void;
}

const PasswordAuthContext = createContext<PasswordAuthContextValue | null>(null);

const AUTH_STORAGE_KEY = 'password_auth_state';

export function PasswordAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PasswordAuthState>({
    isAuthenticated: false,
    role: null,
    isInitializing: true,
  });

  // Restore session on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.isAuthenticated && parsed.role) {
          setState({
            isAuthenticated: true,
            role: parsed.role,
            isInitializing: false,
          });
          return;
        }
      }
    } catch (error) {
      console.error('Failed to restore auth state:', error);
    }
    setState(prev => ({ ...prev, isInitializing: false }));
  }, []);

  const login = (role: 'owner' | 'salesman') => {
    const newState = {
      isAuthenticated: true,
      role,
      isInitializing: false,
    };
    setState(newState);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newState));
  };

  const logout = () => {
    const newState = {
      isAuthenticated: false,
      role: null,
      isInitializing: false,
    };
    setState(newState);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  // Alias for clearing auth state (same as logout but more explicit for error handling)
  const clearAuth = logout;

  return (
    <PasswordAuthContext.Provider value={{ ...state, login, logout, clearAuth }}>
      {children}
    </PasswordAuthContext.Provider>
  );
}

export function usePasswordAuth() {
  const context = useContext(PasswordAuthContext);
  if (!context) {
    throw new Error('usePasswordAuth must be used within PasswordAuthProvider');
  }
  return context;
}
