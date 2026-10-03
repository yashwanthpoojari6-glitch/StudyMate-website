// context/AuthContext.jsx — Global authentication state via React Context
// Provides user state, login/logout actions, and token persistence.

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // True on initial load while we check localStorage

  // ── Hydrate auth state from localStorage on app boot & refresh from server ─
  useEffect(() => {
    const hydrateAndVerify = async () => {
      const storedUser = localStorage.getItem('studymate_user');
      const token = localStorage.getItem('studymate_token');

      if (storedUser && token) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          localStorage.removeItem('studymate_user');
          localStorage.removeItem('studymate_token');
        }

        // Verify session and fetch fresh streak / stats from backend
        try {
          const res = await api.get('/auth/me');
          if (res.data?.data) {
            const freshUser = { ...res.data.data, token };
            setUser(freshUser);
            localStorage.setItem('studymate_user', JSON.stringify(freshUser));
          }
        } catch {
          // If token expired, interceptor will clear and handle
        }
      }
      setLoading(false);
    };

    hydrateAndVerify();
  }, []);

  // ── Persist auth response data ─────────────────────────────────────────────
  const persistAuth = useCallback((data) => {
    localStorage.setItem('studymate_token', data.token);
    localStorage.setItem('studymate_user', JSON.stringify(data));
    setUser(data);
  }, []);

  // ── Register ───────────────────────────────────────────────────────────────
  const register = useCallback(async (name, email, password) => {
    const response = await api.post('/auth/register', { name, email, password });
    persistAuth(response.data.data);
    toast.success(`Welcome to StudyMate, ${name}! 🎉`);
    return response.data;
  }, [persistAuth]);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    persistAuth(response.data.data);
    toast.success(`Welcome back, ${response.data.data.name}! 👋`);
    return response.data;
  }, [persistAuth]);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('studymate_token');
    localStorage.removeItem('studymate_user');
    setUser(null);
    toast.success('Logged out successfully');
  }, []);

  // ── Update local user state (e.g., after profile update) ──────────────────
  const updateUser = useCallback((updatedData) => {
    const newUser = { ...user, ...updatedData };
    localStorage.setItem('studymate_user', JSON.stringify(newUser));
    setUser(newUser);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// ── Custom hook for consuming auth context ─────────────────────────────────────
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
