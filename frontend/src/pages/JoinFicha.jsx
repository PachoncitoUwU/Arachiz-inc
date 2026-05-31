import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import fetchApi from '../services/api';
import { GraduationCap, CheckCircle, XCircle, Loader } from 'lucide-react';

export default function JoinFicha() {
  const { code } = useParams();
  const { isAuthenticated, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading | success | error | already
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Si no está logueado, guardar el código y redirigir al login
    if (!isAuthenticated) {
      localStorage.setItem('pendingJoinCode', code);
      navigate(`/login?join=${code}`, { replace: true });
      return;
    }

    // Si es instructor, no puede unirse como aprendiz por link
    if (user?.userType === 'instructor') {
      setStatus('error');
      setMessage('Los instructores deben unirse desde el apartado de Fichas usando el código.');
      return;
    }

    // Intentar unirse automáticamente
    const join = async () => {
      try {
        await fetchApi('/fichas/join', {
          method: 'POST',
          body: JSON.stringify({ code })
        });
        setStatus('success');
        setTimeout(() => navigate('/aprendiz/dashboard', { replace: true }), 2000);
      } catch (err) {
        if (err.message?.includes('Ya estás')) {
          setStatus('already');
          setMessage(err.message);
          setTimeout(() => navigate('/aprendiz/dashboard', { replace: true }), 2000);
        } else {
          setStatus('error');
          setMessage(err.message || 'Código inválido o expirado.');
        }
      }
    };

    join();
  }, [isAuthenticated, code, user]);

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-100 rounded-full opacity-40"/>
        <div className="absolute -top-16 -left-16 w-64 h-64 bg-green-100 rounded-full opacity-30"/>
      </div>

      <div className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <div className="w-10 h-10 bg-[#4285F4] rounded-xl flex items-center justify-center shadow-md">
              <GraduationCap size={22} className="text-white"/>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white ">Arachiz</span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-800  rounded-2xl shadow-card p-6 sm:p-8 text-center space-y-4">
          {status === 'loading' && (
            <>
              <Loader size={40} className="text-[#4285F4] animate-spin mx-auto"/>
              <p className="font-semibold text-gray-800">Uniéndote a la ficha...</p>
              <p className="text-sm text-gray-400">Código: <span className="font-mono font-bold text-[#4285F4]">{code}</span></p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle size={48} className="text-[#34A853] mx-auto"/>
              <p className="text-lg font-bold text-gray-900 dark:text-white ">¡Te uniste exitosamente!</p>
              <p className="text-sm text-gray-500">Redirigiendo a tu dashboard...</p>
            </>
          )}

          {status === 'already' && (
            <>
              <CheckCircle size={48} className="text-[#4285F4] mx-auto"/>
              <p className="text-lg font-bold text-gray-900 dark:text-white ">Ya estás en esta ficha</p>
              <p className="text-sm text-gray-500">Redirigiendo a tu dashboard...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle size={48} className="text-[#EA4335] mx-auto"/>
              <p className="text-lg font-bold text-gray-900 dark:text-white ">No se pudo unir</p>
              <p className="text-sm text-gray-500">{message}</p>
              <Link to="/aprendiz/dashboard" className="btn-primary inline-flex mt-2">
                Ir al dashboard
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
