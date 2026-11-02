// Authentication Context & State Management with Staff/Admin Permissions
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authApi from '../api/authApi';
import cartApi from '../api/cartApi';
import storage from '../utils/storage';
import { STORAGE_KEYS } from '../constants/config';
import { getSessionKey } from '../api/axiosInstance';

const AuthContext = createContext({
  user: null,
  loading: true,
  isAuthenticated: false,
  isStaff: false,
  isSuperUser: false,
  login: async () => {},
  loginWithGoogle: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshProfile: async () => {},
  updateProfile: async () => {},
  changePassword: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore authenticated session on boot
  const restoreSession = useCallback(async () => {
    try {
      const token = await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Check cached user data first for instant UI response
      const cachedUser = await storage.getItem(STORAGE_KEYS.USER_DATA);
      if (cachedUser) {
        try {
          const parsed = typeof cachedUser === 'string' ? JSON.parse(cachedUser) : cachedUser;
          setUser(parsed);
        } catch {
          setUser(cachedUser);
        }
      }

      // Fetch fresh user profile from backend
      const profile = await authApi.getProfile();
      setUser(profile);
      await storage.setItem(STORAGE_KEYS.USER_DATA, profile);
    } catch (err) {
      console.warn('[AuthContext.restoreSession] Session expired or invalid:', err?.message);
      setUser(null);
      await storage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      await storage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      await storage.removeItem(STORAGE_KEYS.USER_DATA);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // Login handler (supports object payload or separate email & password parameters)
  const login = async (emailOrPayload, maybePassword = null) => {
    setLoading(true);
    try {
      const data = await authApi.login(emailOrPayload, maybePassword);

      const access = data.tokens?.access;
      const refresh = data.tokens?.refresh;
      const userData = data.user;

      if (access) {
        await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access);
      }
      if (refresh) {
        await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh);
      }
      if (userData) {
        await storage.setItem(STORAGE_KEYS.USER_DATA, userData);
        setUser(userData);
      }

      // Merge guest cart if active
      try {
        const guestKey = await getSessionKey();
        if (guestKey) {
          await cartApi.mergeGuestCart(guestKey);
        }
      } catch (mergeErr) {
        console.warn('Notice: Cart merge skipped or completed:', mergeErr?.message);
      }

      return { success: true, data };
    } catch (err) {
      const message =
        err.response?.data?.non_field_errors?.[0] ||
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Invalid email or password.';
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  // Google Login handler
  const loginWithGoogle = async (credentialOrTokens) => {
    setLoading(true);
    try {
      let data;
      if (credentialOrTokens?.access && credentialOrTokens?.refresh) {
        // Direct JWT tokens returned from OAuth callback
        data = { tokens: credentialOrTokens };
      } else {
        // Verify Google credential/access token via backend REST endpoint
        data = await authApi.googleLogin(credentialOrTokens);
      }

      const access = data.tokens?.access;
      const refresh = data.tokens?.refresh;
      let userData = data.user;

      if (access) {
        await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access);
      }
      if (refresh) {
        await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh);
      }

      if (!userData && access) {
        userData = await authApi.getProfile();
      }

      if (userData) {
        await storage.setItem(STORAGE_KEYS.USER_DATA, userData);
        setUser(userData);
      }

      // Merge guest cart if active
      try {
        const guestKey = await getSessionKey();
        if (guestKey) {
          await cartApi.mergeGuestCart(guestKey);
        }
      } catch (mergeErr) {
        console.warn('Notice: Cart merge skipped or completed:', mergeErr?.message);
      }

      return { success: true, data };
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Google authentication failed.';
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  // Register handler
  const register = async (formData) => {
    try {
      const data = await authApi.register(formData);
      return { success: true, data };
    } catch (err) {
      const responseData = err.response?.data;
      let msg = 'Registration failed. Please check inputs.';
      if (responseData && typeof responseData === 'object') {
        const firstVal = Object.values(responseData)[0];
        msg = Array.isArray(firstVal) ? firstVal[0] : String(firstVal);
      }
      return { success: false, message: msg };
    }
  };

  // Update profile
  const updateProfile = async (formData) => {
    try {
      const updated = await authApi.updateProfile(formData);
      setUser(updated);
      await storage.setItem(STORAGE_KEYS.USER_DATA, updated);
      return { success: true, data: updated };
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Failed to update profile.';
      return { success: false, message };
    }
  };

  // Change password
  const changePassword = async (oldPassword, newPassword) => {
    try {
      const res = await authApi.changePassword(oldPassword, newPassword);
      return { success: true, message: res.message || 'Password changed successfully.' };
    } catch (err) {
      const responseData = err.response?.data;
      let msg = 'Failed to change password.';
      if (responseData && typeof responseData === 'object') {
        const firstVal = Object.values(responseData)[0];
        msg = Array.isArray(firstVal) ? firstVal[0] : String(firstVal);
      }
      return { success: false, message: msg };
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // Ignore network errors on logout
    }
    await storage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    await storage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    await storage.removeItem(STORAGE_KEYS.USER_DATA);
    setUser(null);
  };

  const refreshProfile = async () => {
    try {
      const profile = await authApi.getProfile();
      setUser(profile);
      await storage.setItem(STORAGE_KEYS.USER_DATA, profile);
      return profile;
    } catch (e) {
      return null;
    }
  };

  const isStaff = Boolean(user?.is_staff || user?.is_superuser);
  const isSuperUser = Boolean(user?.is_superuser);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        isStaff,
        isSuperUser,
        login,
        loginWithGoogle,
        register,
        logout,
        refreshProfile,
        updateProfile,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
