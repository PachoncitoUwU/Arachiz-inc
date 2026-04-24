import React, { useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { Loader } from 'lucide-react';

export default function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      // Decodificar el token para obtener datos del usuario
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        login(token, {
          id: payload.id,
          userType: payload.userType,
          email: payload.email,
          fullName: payload.fullName
        });
      } catch (error) {
        console.error('Error procesando token:', error);
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4285F4] via-[#34A853] to-[#FBBC05] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
        <Loader size={48} className="animate-spin text-[#4285F4] mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Iniciando sesión...</h2>
        <p className="text-gray-600">Espera un momento</p>
      </div>
    </div>
  );
}
