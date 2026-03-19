import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Mail, Lock } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import fetchApi from '../../services/api';

export default function Login() {
  const { login } = useContext(AuthContext);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      login(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow border border-gray-100 p-8">
        <div className="flex flex-col items-center mb-8">
          <BookOpen size={48} className="text-google-blue mb-4" />
          <h1 className="text-2xl font-bold text-gray-800">Iniciar Sesión</h1>
          <p className="text-gray-500 mt-2">Bienvenido de nuevo a Arachiz</p>
        </div>

        {error && (
          <div className="bg-google-red/10 border border-google-red/20 text-google-red px-4 py-3 rounded mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 block">Correo Electrónico</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Mail size={18} />
              </div>
              <input
                type="email"
                required
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-google-blue focus:border-google-blue outline-none transition-all"
                placeholder="ejemplo@sena.edu.co"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 block">Contraseña</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Lock size={18} />
              </div>
              <input
                type="password"
                required
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-google-blue focus:border-google-blue outline-none transition-all"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-google-blue text-white py-2 px-4 rounded font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50"
          >
            {loading ? 'Iniciando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          ¿No tienes una cuenta?{' '}
          <Link to="/register" className="text-google-blue hover:underline font-medium">
            Regístrate aquí
          </Link>
        </div>
      </div>
    </div>
  );
}
