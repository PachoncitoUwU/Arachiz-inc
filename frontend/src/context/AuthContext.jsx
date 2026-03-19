import { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
    if (token) {
      const payload = decodeToken(token);
      if (payload) {
        setUser({ id: payload.id, userType: payload.userType, email: payload.email, fullName: payload.fullName });
      } else {
        setToken(null);
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, [token, decodeToken]);

  const login = (newToken, userData) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('token', newToken);
    if (userData.userType === 'instructor') {
      navigate('/instructor/dashboard');
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

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token && !!user }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
