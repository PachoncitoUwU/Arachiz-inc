import { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Leer token desde query param (viene de Google OAuth redirect entre dominios)
  const getInitialToken = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');
      if (urlToken) {
        localStorage.setItem('token', urlToken);
        // Limpiar el token de la URL sin recargar la página
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, '', cleanUrl);
        return urlToken;
      }
    } catch { /* noop */ }
    return localStorage.getItem('token') || null;
  };

  const [token, setToken] = useState(getInitialToken);

  // Efecto de respaldo: si el token llega por URL pero el estado ya se inicializó sin él
  // (puede ocurrir en algunos entornos SSR o con hydration)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    if (urlToken && urlToken !== token) {
      localStorage.setItem('token', urlToken);
      setToken(urlToken);
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }
  }, []);

  // RNF18 - Expiración de sesión por inactividad (8h via JWT, pero también chequeamos expiración)
  const decodeToken = useCallback((t) => {
    try {
      const payload = JSON.parse(atob(t.split('.')[1]));
      if (payload.exp * 1000 < Date.now()) return null;
      return payload;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        const payload = decodeToken(token);
        if (payload) {
          setUser({ id: payload.id, userType: payload.userType, email: payload.email, fullName: payload.fullName });
          try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
            const res = await fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
              const data = await res.json();
              setUser(data.user);
            }
          } catch (e) { console.error(e); }
        } else {
          setToken(null);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token, decodeToken]);

  const login = (newToken, userData) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('token', newToken);
    if (userData.userType === 'instructor') {
      navigate('/instructor/dashboard');
    } else if (userData.userType === 'administrador') {
      navigate('/admin/dashboard');
    } else if (userData.userType === 'super_usuario') {
      navigate('/super-usuario/dashboard');
    } else {
      navigate('/aprendiz/dashboard');
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    navigate('/login');
  };

  const updateUser = (updatedFields) => {
    setUser(prev => ({ ...prev, ...updatedFields }));
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, isAuthenticated: !!token, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
