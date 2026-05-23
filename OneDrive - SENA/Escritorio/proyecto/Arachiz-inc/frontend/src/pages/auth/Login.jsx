import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import fetchApi from '../../services/api';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

export default function Login() {
  const { login } = useContext(AuthContext);
  const { t } = useSettings();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const data = await fetchApi('/auth/login', { method: 'POST', body: JSON.stringify(form) });
      // Si venía de un link de invitación, redirigir a unirse
      const pendingCode = localStorage.getItem('pendingJoinCode');
      if (pendingCode && data.user?.userType === 'aprendiz') {
        localStorage.removeItem('pendingJoinCode');
        login(data.token, data.user);
        // La navegación la maneja login(), pero necesitamos override
        setTimeout(() => window.location.replace(`/unirse/${pendingCode}`), 100);
      } else {
        login(data.token, data.user);
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE}/api/auth/google`;
  };

  const setField = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#34A853]/[0.05] to-[#4285F4]/[0.08] flex items-center justify-center p-4 relative overflow-hidden">
      <style>{`
        @keyframes float-up {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(-120vh) rotate(720deg);
            opacity: 0;
          }
        }
        .circle-float {
          position: absolute;
          bottom: -150px;
          border-radius: 50%;
          animation: float-up linear infinite;
        }
      `}</style>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="circle-float w-20 h-20 bg-[#4285F4] opacity-10" style={{left: '10%', animationDuration: '20s', animationDelay: '0s'}}/>
        <div className="circle-float w-12 h-12 bg-[#EA4335] opacity-10" style={{left: '20%', animationDuration: '18s', animationDelay: '2s'}}/>
        <div className="circle-float w-32 h-32 bg-[#FBBC05] opacity-10" style={{left: '30%', animationDuration: '25s', animationDelay: '4s'}}/>
        <div className="circle-float w-16 h-16 bg-[#34A853] opacity-10" style={{left: '40%', animationDuration: '22s', animationDelay: '0s'}}/>
        <div className="circle-float w-28 h-28 bg-[#4285F4] opacity-10" style={{left: '50%', animationDuration: '20s', animationDelay: '3s'}}/>
        <div className="circle-float w-14 h-14 bg-[#EA4335] opacity-10" style={{left: '60%', animationDuration: '23s', animationDelay: '1s'}}/>
        <div className="circle-float w-24 h-24 bg-[#FBBC05] opacity-10" style={{left: '70%', animationDuration: '19s', animationDelay: '5s'}}/>
        <div className="circle-float w-10 h-10 bg-[#34A853] opacity-10" style={{left: '80%', animationDuration: '21s', animationDelay: '2s'}}/>
        <div className="circle-float w-36 h-36 bg-[#4285F4] opacity-10" style={{left: '85%', animationDuration: '24s', animationDelay: '0s'}}/>
        <div className="circle-float w-12 h-12 bg-[#EA4335] opacity-10" style={{left: '15%', animationDuration: '22s', animationDelay: '4s'}}/>
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <h1 className="text-4xl font-bold text-gray-900 flex items-center justify-center gap-2">
               <span className="text-black">Arachiz</span>
            </h1>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mt-4">Bienvenido de vuelta</h2>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-8 space-y-5 animate-fade-in">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm animate-shake">
              {error}
            </div>
          )}

          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            type="button"
            className="w-full bg-white border border-gray-200 text-gray-700 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95 shadow-sm flex items-center justify-center gap-3 group"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" className="group-hover:scale-110 transition-transform">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.593.102-1.17.282-1.709V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.335z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            Continuar con Google
          </button>

          {/* Separador O */}
          <div className="relative flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200"/>
            <span className="text-xs text-gray-400 font-medium bg-white px-2">o</span>
            <div className="flex-1 h-px bg-gray-200"/>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#4285F4] transition-colors">
                <Mail size={17}/>
              </div>
              <input 
                type="email" 
                required 
                placeholder="Correo electrónico"
                className="input-field pl-11 focus:ring-2 focus:ring-[#4285F4] focus:border-transparent transition-all w-full border border-gray-200 rounded-xl py-2.5 text-sm bg-gray-50 focus:bg-white"
                value={form.email} 
                onChange={setField('email')} 
              />
            </div>

            {/* Password */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#4285F4] transition-colors">
                <Lock size={17}/>
              </div>
              <input 
                type="password" 
                required 
                placeholder="Contraseña"
                className="input-field pl-11 focus:ring-2 focus:ring-[#4285F4] focus:border-transparent transition-all w-full border border-gray-200 rounded-xl py-2.5 text-sm bg-gray-50 focus:bg-white"
                value={form.password} 
                onChange={setField('password')} 
              />
            </div>

            {/* Botón Ingresar */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#4285F4] text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-[#3367d6] transition-colors active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Ingresando...
                </span>
              ) : 'Ingresar'}
            </button>
            
            {/* Olvidaste tu contraseña */}
            <div className="text-center pt-2">
              <Link to="/forgot-password" className="text-xs text-[#4285F4] hover:text-blue-600 hover:underline font-medium transition-colors">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </form>

          {/* Separador decorativo */}
          <div className="relative flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100"/>
            <div className="w-1.5 h-1.5 rounded-full bg-gray-200"/>
            <div className="flex-1 h-px bg-gray-100"/>
          </div>

          {/* Registrarse */}
          <Link 
            to="/register" 
            className="w-full block text-center bg-[#34A853] text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-green-600 transition-colors active:scale-95"
          >
            ¿No tienes cuenta? Regístrate aquí
          </Link>
        </div>
      </div>
    </div>
  );
}
