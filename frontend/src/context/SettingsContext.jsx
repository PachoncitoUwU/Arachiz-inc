import React, { createContext, useContext, useState, useEffect } from 'react';
import es from '../locales/es.json';
import en from '../locales/en.json';

const translations = { es, en };

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

  const t = (nsOrPath, key) => {
    const lang = settings.language || 'es';
    let ns = nsOrPath;
    let k = key;
    if (!key && nsOrPath?.includes('.')) {
      [ns, k] = nsOrPath.split('.');
    }
    if (!ns || !k) return k || nsOrPath || '...';
    return translations[lang]?.[ns]?.[k] || translations['es']?.[ns]?.[k] || k;
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, toggleDark, t }}>
      {children}
    </SettingsContext.Provider>
  );
}
