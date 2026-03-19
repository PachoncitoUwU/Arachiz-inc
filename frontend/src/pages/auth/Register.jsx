import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Mail, Lock, User, IdCard } from 'lucide-react';
import fetchApi from '../../services/api';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    userType: 'aprendiz',
    fullName: '',
    document: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      await fetchApi('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          userType: formData.userType,
          fullName: formData.fullName,
          document: formData.document,
          email: formData.email,
          password: formData.password
        }),
      });

      // Registro exitoso
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-lg bg-white rounded-xl shadow border border-gray-100 p-8">
        <div className="flex flex-col items-center mb-6">
          <BookOpen size={48} className="text-google-green mb-4" />
          <h1 className="text-2xl font-bold text-gray-800">Crear Cuenta</h1>
          <p className="text-gray-500 mt-2">Únete a la plataforma Arachiz</p>
        </div>

        {error && (
          <div className="bg-google-red/10 border border-google-red/20 text-google-red px-4 py-3 rounded mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4 mb-4">
            <button
              type="button"
              className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${
                formData.userType === 'aprendiz' 
                  ? 'bg-google-green text-white shadow' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => setFormData({ ...formData, userType: 'aprendiz' })}
            >
              Aprendiz
            </button>
            <button
              type="button"
              className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${
                formData.userType === 'instructor' 
                  ? 'bg-google-blue text-white shadow' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => setFormData({ ...formData, userType: 'instructor' })}
            >
              Instructor
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Nombre Completo</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <User size={16} />
              </div>
              <input type="text" name="fullName" required value={formData.fullName} onChange={handleChange}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-google-blue focus:border-google-blue outline-none"
                placeholder="Juan Pérez" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Documento de Identidad</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <IdCard size={16} />
              </div>
              <input type="text" name="document" required value={formData.document} onChange={handleChange}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-google-blue focus:border-google-blue outline-none"
                placeholder="1234567890" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Correo Electrónico</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Mail size={16} />
              </div>
              <input type="email" name="email" required value={formData.email} onChange={handleChange}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-google-blue focus:border-google-blue outline-none"
                placeholder="ejemplo@sena.edu.co" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock size={16} />
                </div>
                <input type="password" name="password" required value={formData.password} onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-google-blue focus:border-google-blue outline-none"
                  placeholder="••••••••" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Confirmar Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock size={16} />
                </div>
                <input type="password" name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-google-blue focus:border-google-blue outline-none"
                  placeholder="••••••••" />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 rounded font-medium text-white shadow-sm mt-4 transition-all disabled:opacity-50 ${
              formData.userType === 'aprendiz' ? 'bg-google-green hover:bg-green-600' : 'bg-google-blue hover:bg-blue-600'
            }`}
          >
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-google-blue hover:underline font-medium">
            Inicia sesión aquí
          </Link>
        </div>
      </div>
    </div>
  );
}
