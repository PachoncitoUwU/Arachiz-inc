import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();
export const useSettings = () => useContext(SettingsContext);

const DEFAULTS = {
  darkMode: false,
  language: 'es',
  sidebarCollapsed: false,
  notifications: true,
  compactMode: false,
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('arachiz_settings');
      return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : DEFAULTS;
    } catch { return DEFAULTS; }
  });

  useEffect(() => {
    localStorage.setItem('arachiz_settings', JSON.stringify(settings));
    // Aplicar dark mode al documento
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const toggleDark = () => updateSetting('darkMode', !settings.darkMode);

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, toggleDark }}>
      {children}
    </SettingsContext.Provider>
  );
}
