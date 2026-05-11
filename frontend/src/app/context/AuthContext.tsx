'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '../lib/api';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  tenantId: string;
  branchId?: number;
  tenantName?: string;
  permissions?: string[];
}

interface AuthContextType {
  user: User | null;
  currentBranchId: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchBranch: (branchId: string | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [currentBranchId, setCurrentBranchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedBranch = localStorage.getItem('currentBranchId');
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setCurrentBranchId(storedBranch);
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('currentBranchId');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      const { token, user: userData } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      if (userData.branchId) {
        localStorage.setItem('currentBranchId', userData.branchId.toString());
        setCurrentBranchId(userData.branchId.toString());
      }

      setUser(userData);
      router.push('/');
      return { success: true };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      return {
        success: false,
        error: axiosError.response?.data?.error || 'Login failed'
      };
    }
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('currentBranchId');
    setUser(null);
    setCurrentBranchId(null);
    router.push('/login');
  }, [router]);

  const switchBranch = useCallback((branchId: string | null) => {
    if (branchId) {
      localStorage.setItem('currentBranchId', branchId);
    } else {
      localStorage.removeItem('currentBranchId');
    }
    setCurrentBranchId(branchId);
    // Reload to refresh data across all components
    window.location.reload();
  }, []);

  return (
    <AuthContext.Provider value={{ user, currentBranchId, login, logout, switchBranch, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
