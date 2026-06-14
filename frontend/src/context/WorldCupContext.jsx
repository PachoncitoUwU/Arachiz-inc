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
    throw new Error('useWorldCup must be used within WorldCupProvider');
  }
  return context;
}
