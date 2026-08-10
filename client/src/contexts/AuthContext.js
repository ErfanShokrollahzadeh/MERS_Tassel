'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginUser, registerUser, logoutUser, getUserProfile } from '@/lib/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, check localStorage for a saved token and fetch user profile
  useEffect(() => {
    const savedToken = localStorage.getItem('mers_token');
    if (savedToken) {
      setToken(savedToken);
      getUserProfile(savedToken)
        .then((userData) => {
          setUser(userData);
        })
        .catch(() => {
          // Token is invalid or expired — clear it
          localStorage.removeItem('mers_token');
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await loginUser(credentials);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('mers_token', data.token);
    return data;
  }, []);

  const signup = useCallback(async (formData) => {
    const data = await registerUser(formData);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('mers_token', data.token);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      if (token) {
        await logoutUser(token);
      }
    } catch {
      // Ignore logout errors
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('mers_token');
  }, [token]);

  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
