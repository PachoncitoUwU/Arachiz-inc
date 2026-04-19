import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, GraduationCap } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import fetchApi from '../../services/api';

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
            <Link to="#" className="text-sm text-gray-500 hover:text-gray-700">
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
