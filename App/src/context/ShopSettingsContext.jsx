// Shop Settings Context (Delivery Charges, Contact, Store Name)
import React, { createContext, useContext, useState, useEffect } from 'react';
import settingsApi from '../api/settingsApi';
import { DEFAULT_SETTINGS } from '../constants/config';

const ShopSettingsContext = createContext({
  settings: DEFAULT_SETTINGS,
  loading: true,
  refreshSettings: async () => {},
});

export const ShopSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const data = await settingsApi.getShopSettings();
      setSettings(data);
    } catch (e) {
      console.warn('Using fallback settings:', e?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <ShopSettingsContext.Provider
      value={{
        settings,
        loading,
        refreshSettings: fetchSettings,
      }}
    >
      {children}
    </ShopSettingsContext.Provider>
  );
};

export const useShopSettings = () => useContext(ShopSettingsContext);
export default ShopSettingsContext;
