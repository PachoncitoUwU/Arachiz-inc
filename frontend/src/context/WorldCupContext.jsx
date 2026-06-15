import React, { createContext, useContext, useState, useEffect } from 'react';

const WorldCupContext = createContext();

export function WorldCupProvider({ children }) {
  const [worldCupMode, setWorldCupMode] = useState(() => {
    const saved = localStorage.getItem('worldCupMode');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('worldCupMode', worldCupMode);
  }, [worldCupMode]);

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
