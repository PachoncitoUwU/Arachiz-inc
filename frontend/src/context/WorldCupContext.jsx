import React, { createContext, useContext, useState, useEffect } from 'react';

const WorldCupContext = createContext();

export function WorldCupProvider({ children }) {
  const [worldCupMode, setWorldCupMode] = useState(() => {
    const saved = localStorage.getItem('worldCupMode');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('worldCupMode', worldCupMode);
    
    // Si se activa modo mundialista, desactivar modo oscuro
    if (worldCupMode) {
      const settings = JSON.parse(localStorage.getItem('arachiz_settings') || '{}');
      if (settings.darkMode) {
        settings.darkMode = false;
        localStorage.setItem('arachiz_settings', JSON.stringify(settings));
        document.documentElement.classList.remove('dark');
      }
    }
  }, [worldCupMode]);

  // Escuchar cambios desde otros contextos (como SettingsContext)
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('worldCupMode');
      setWorldCupMode(saved === 'true');
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const toggleWorldCupMode = () => {
    setWorldCupMode(prev => !prev);
  };

  return (
    <WorldCupContext.Provider value={{ worldCupMode, toggleWorldCupMode }}>
      {children}
    </WorldCupContext.Provider>
  );
}

export function useWorldCup() {
  const context = useContext(WorldCupContext);
  if (!context) {
    // Fallback seguro si se usa fuera del provider
    return { worldCupMode: false, toggleWorldCupMode: () => {} };
  }
  return context;
}
