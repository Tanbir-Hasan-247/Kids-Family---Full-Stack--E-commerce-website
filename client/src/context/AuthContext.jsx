import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    const token = localStorage.getItem('kf_access_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/auth/profile/');
      setUser(res.data);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setUser(null);
      localStorage.removeItem('kf_access_token');
      localStorage.removeItem('kf_refresh_token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login/', { email, password });
    localStorage.setItem('kf_access_token', res.data.tokens.access);
    localStorage.setItem('kf_refresh_token', res.data.tokens.refresh);
    setUser(res.data.user);

    // Merge guest cart if any
    const guestKey = localStorage.getItem('kf_session_key');
    if (guestKey) {
      try {
        await api.post('/cart/merge/', { guest_session_key: guestKey });
      } catch (e) {
        console.warn('Cart merge notice:', e);
      }
    }

    return res.data;
  };

  const register = async (formData) => {
    // Only register the user, do not auto-login so they can sign in from login page
    const res = await api.post('/auth/register/', formData);
    return res.data;
  };

  const loginWithTokens = async (access, refresh) => {
    localStorage.setItem('kf_access_token', access);
    localStorage.setItem('kf_refresh_token', refresh);
    try {
      const res = await api.get('/auth/profile/');
      setUser(res.data);

      const guestKey = localStorage.getItem('kf_session_key');
      if (guestKey) {
        try {
          await api.post('/cart/merge/', { guest_session_key: guestKey });
        } catch (e) {
          console.warn('Cart merge notice:', e);
        }
      }
      return res.data;
    } catch (err) {
      console.error('Failed to load profile with tokens:', err);
      localStorage.removeItem('kf_access_token');
      localStorage.removeItem('kf_refresh_token');
      setUser(null);
      throw err;
    }
  };

  const loginWithGoogle = async (payload) => {
    const res = await api.post('/auth/google/', payload);
    localStorage.setItem('kf_access_token', res.data.tokens.access);
    localStorage.setItem('kf_refresh_token', res.data.tokens.refresh);
    setUser(res.data.user);

    const guestKey = localStorage.getItem('kf_session_key');
    if (guestKey) {
      try {
        await api.post('/cart/merge/', { guest_session_key: guestKey });
      } catch (e) {
        console.warn('Cart merge notice:', e);
      }
    }
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout/');
    } catch (e) {
      // Ignore network errors on logout
    }
    localStorage.removeItem('kf_access_token');
    localStorage.removeItem('kf_refresh_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        loginWithTokens,
        loginWithGoogle,
        logout,
        fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = () => useContext(AuthContext);

