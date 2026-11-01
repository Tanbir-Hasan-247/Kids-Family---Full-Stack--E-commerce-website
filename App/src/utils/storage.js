// Secure Storage Wrapper for React Native (Expo SecureStore with Web Fallback)
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

export const storage = {
  async getItem(key) {
    try {
      if (isWeb) {
        if (typeof localStorage !== 'undefined') {
          return localStorage.getItem(key);
        }
        return null;
      }
      return await SecureStore.getItemAsync(key);
    } catch (e) {
      console.warn(`[storage.getItem] Error reading key "${key}":`, e);
      return null;
    }
  },

  async setItem(key, value) {
    try {
      const valStr = typeof value === 'string' ? value : JSON.stringify(value);
      if (isWeb) {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(key, valStr);
        }
        return;
      }
      await SecureStore.setItemAsync(key, valStr);
    } catch (e) {
      console.warn(`[storage.setItem] Error saving key "${key}":`, e);
    }
  },

  async removeItem(key) {
    try {
      if (isWeb) {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(key);
        }
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch (e) {
      console.warn(`[storage.removeItem] Error deleting key "${key}":`, e);
    }
  },
};

export default storage;
