import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, GraduationCap } from 'lucide-react';
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
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-4">
      {/* Decoración fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-100 rounded-full opacity-40"/>
        <div className="absolute -top-16 -left-16 w-64 h-64 bg-green-100 rounded-full opacity-30"/>
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img src="/ArachizLogoPNG.png" alt="Arachiz" className="h-14 md:h-16 object-contain dark:invert transition-all duration-300" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{t('login', 'welcome')}</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-8 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            type="button"
            className="w-full bg-white border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-all active:scale-95 shadow-sm flex items-center justify-center gap-3"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.593.102-1.17.282-1.709V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.335z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            Continuar con Google
          </button>

          <div className="relative flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200"/>
            <span className="text-xs text-gray-400 font-medium">O</span>
            <div className="flex-1 h-px bg-gray-200"/>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <Mail size={17}/>
              </div>
              <input type="email" required placeholder={t('login', 'email')}
                className="input-field pl-11"
                value={form.email} onChange={setField('email')} />
            </div>

            {/* Password */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <Lock size={17}/>
              </div>
              <input type="password" required placeholder={t('login', 'password')}
                className="input-field pl-11"
                value={form.password} onChange={setField('password')} />
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-[#4285F4] text-white py-3 rounded-xl font-semibold text-sm hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50 shadow-sm">
              {loading ? t('login', 'loading') : t('login', 'enter')}
            </button>
          </form>

          <div className="text-center">
            <Link to="/forgot-password" className="text-sm text-[#4285F4] hover:underline font-medium">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <div className="relative flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100"/>
            <div className="w-2 h-2 rounded-full bg-gray-200"/>
            <div className="flex-1 h-px bg-gray-100"/>
          </div>

          <Link to="/register"
            className="block w-full text-center bg-[#34A853] text-white py-3 rounded-xl font-semibold text-sm hover:bg-green-600 transition-all active:scale-95 shadow-sm">
            {t('login', 'noAccount')}
          </Link>
        </div>
      </div>
    </div>
  );
}
