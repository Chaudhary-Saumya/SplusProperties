import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const SettingsContext = createContext();

const DEFAULT_SETTINGS = {
  // Feature Toggles (Default All Active)
  enableRewardsSystem: true,
  enableAreaConverter: true,
  enableBoundaryMap: true,
  enableLoanCalculator: true,
  enableBrokersDirectory: true,
  enablePostProperty: true,
  enableTokenBooking: false,

  // Economy & Reward Parameters
  minWithdrawalINR: 50,
  coinToINRRate: 20,
  welcomeLoginCoins: 100,
  referralBonusCoins: 200,
  directDailyCapINR: 30,
  dailyCheckinCoins: 20,
  landMapCoins: 20,
  areaConverterCoins: 20,
  viewListingsCoins: 20
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await axios.get('/api/settings');
      if (res.data?.success && res.data?.data) {
        setSettings(prev => ({
          ...prev,
          ...res.data.data
        }));
      }
    } catch (err) {
      console.error('Failed to load system settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{
      settings,
      loading,
      reloadSettings: fetchSettings,
      setLocalSettings: (newSettings) => setSettings(prev => ({ ...prev, ...newSettings }))
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    return {
      settings: DEFAULT_SETTINGS,
      loading: false,
      reloadSettings: () => {},
      setLocalSettings: () => {}
    };
  }
  return context;
};

export default SettingsContext;
