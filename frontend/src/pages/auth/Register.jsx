import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, IdCard, GraduationCap } from 'lucide-react';
import fetchApi from '../../services/api';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    userType: 'aprendiz', fullName: '', document: '', email: '', password: '', confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) return setError('Las contraseñas no coinciden');
    if (form.password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres');
    setLoading(true);
    try {
      await fetchApi('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ userType: form.userType, fullName: form.fullName, document: form.document, email: form.email, password: form.password })
      });
      navigate('/login');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const accentColor = form.userType === 'instructor' ? '#4285F4' : '#34A853';

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-100 rounded-full opacity-40"/>
        <div className="absolute -top-16 -left-16 w-64 h-64 bg-green-100 rounded-full opacity-30"/>
      </div>

      <div className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md" style={{ backgroundColor: accentColor }}>
              <GraduationCap size={22} className="text-white"/>
            </div>
            <span className="text-2xl font-bold text-gray-900">Arachiz</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Crear cuenta</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-8 space-y-4">
          {/* Tipo de usuario */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
            {['aprendiz', 'instructor'].map(type => (
              <button key={type} type="button"
                onClick={() => setForm({...form, userType: type})}
                className={`py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
                  form.userType === type
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}>
                {type}
              </button>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <User size={16}/>
              </div>
              <input type="text" required placeholder="Nombre completo" className="input-field pl-11"
                value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <IdCard size={16}/>
              </div>
              <input type="text" required placeholder="Número de documento" className="input-field pl-11"
                value={form.document} onChange={e => setForm({...form, document: e.target.value})} />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <Mail size={16}/>
              </div>
              <input type="email" required placeholder="Correo electrónico" className="input-field pl-11"
                value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <Lock size={16}/>
              </div>
              <input type="password" required placeholder="Contraseña" className="input-field pl-11"
                value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <Lock size={16}/>
              </div>
              <input type="password" required placeholder="Confirmar contraseña" className="input-field pl-11"
                value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} />
            </div>

            <button type="submit" disabled={loading}
              className="w-full text-white py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 disabled:opacity-50 shadow-sm mt-2"
              style={{ backgroundColor: accentColor }}>
              {loading ? 'Registrando...' : 'Registrarse'}
            </button>
          </form>

          <div className="relative flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100"/>
            <div className="w-2 h-2 rounded-full bg-gray-200"/>
            <div className="flex-1 h-px bg-gray-100"/>
          </div>

          <Link to="/login"
            className="block w-full text-center bg-[#4285F4] text-white py-3 rounded-xl font-semibold text-sm hover:bg-blue-600 transition-all active:scale-95 shadow-sm">
            Ya tengo cuenta
          </Link>
        </div>
      </div>
    </div>
  );
}
