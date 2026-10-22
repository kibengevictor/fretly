import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AuthUser, login, logout, register, resendVerification, requestPasswordReset, resetPassword, verifyEmail } from '../services/authApi';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  confirmEmail: (email: string, code: string) => Promise<void>;
  resendEmail: (email: string) => Promise<void>;
  requestReset: (email: string) => Promise<void>;
  completeReset: (email: string, code: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);

  const authenticate = async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await login(email.trim().toLowerCase(), password);
      setUser(result.user);
    } finally {
      setLoading(false);
    }
  };

  const signIn = (email: string, password: string) => authenticate(email, password);
  const signUp = async (email: string, password: string) => {
    setLoading(true);
    try {
      await register(email.trim().toLowerCase(), password);
    } finally {
      setLoading(false);
    }
  };
  const confirmEmail = async (email: string, code: string) => {
    setLoading(true);
    try {
      const result = await verifyEmail(email.trim().toLowerCase(), code.trim());
      setUser(result.user);
    } finally {
      setLoading(false);
    }
  };
  const resendEmail = (email: string) => resendVerification(email.trim().toLowerCase());
  const requestReset = (email: string) => requestPasswordReset(email.trim().toLowerCase());
  const completeReset = (email: string, code: string, password: string) => resetPassword(email.trim().toLowerCase(), code.trim(), password);

  const signOut = () => {
    logout();
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, signIn, signUp, confirmEmail, resendEmail, requestReset, completeReset, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
