import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const DEFAULT_SETTINGS = {
  shop_name: 'Kids & Family',
  tagline: 'Premium Family Lifestyle & Outfits',
  address: 'Dhaka, Bangladesh',
  phone: '+880 1700-000000',
  email: 'support@kidsandfamily.com',
  whatsapp_number: '+880 1700-000000',
  opening_hours: '10 AM - 8 PM',
  helpline_note: '7 Days a Week (10 AM - 8 PM)',
  facebook_url: 'https://facebook.com',
  instagram_url: 'https://instagram.com',
  youtube_url: '',
  delivery_inside_dhaka: 60,
  delivery_outside_dhaka: 120,
  footer_about:
    'Premium clothing & festive collections crafted for kids, men, and women. Celebrating every special family moment with quality, elegance, and comfort.',
};

const ShopSettingsContext = createContext({
  settings: DEFAULT_SETTINGS,
  loading: true,
  refreshSettings: async () => {},
  updateSettings: async () => ({ success: false }),
});

export const ShopSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/dashboard/settings/');
      if (res.data) {
        setSettings((prev) => ({ ...prev, ...res.data }));
      }
    } catch (err) {
      console.warn('Could not fetch shop settings, using default fallback:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSettings = async (newData) => {
    try {
      const res = await api.put('/dashboard/settings/', newData);
      if (res.data) {
        setSettings(res.data);
        return { success: true, data: res.data };
      }
      return { success: false, message: 'Invalid response from server' };
    } catch (err) {
      console.error('Error updating shop settings:', err);
      const detail =
        err.response?.data?.detail ||
        (err.response?.data && JSON.stringify(err.response.data)) ||
        'Failed to save settings. Please try again.';
      return { success: false, message: detail };
    }
  };

  return (
    <ShopSettingsContext.Provider
      value={{
        settings,
        loading,
        refreshSettings: fetchSettings,
        updateSettings,
      }}
    >
      {children}
    </ShopSettingsContext.Provider>
  );
};

export const useShopSettings = () => useContext(ShopSettingsContext);

