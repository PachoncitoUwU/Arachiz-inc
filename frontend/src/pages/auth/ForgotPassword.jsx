import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, Loader } from 'lucide-react';
import fetchApi from '../../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await fetchApi('/password/request', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#4285F4] via-[#34A853] to-[#FBBC05] dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-800  dark:bg-zinc-800 rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full text-center animate-scale-in border border-gray-100 dark:border-zinc-700  dark:border-zinc-700">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-[#34A853] dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white  dark:text-white mb-3">¡Email Enviado!</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Revisa tu bandeja de entrada y spam.
          </p>
          <Link to="/login" className="btn-primary w-full flex items-center justify-center gap-2">
            <ArrowLeft size={18} />
            Volver al Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4285F4] via-[#34A853] to-[#FBBC05] dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-800  dark:bg-zinc-800 rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full animate-fade-in border border-gray-100 dark:border-zinc-700  dark:border-zinc-700">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Mail size={32} className="text-[#4285F4] dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white  dark:text-white mb-2">¿Olvidaste tu contraseña?</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Ingresa tu email y te enviaremos un enlace para recuperarla
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 mb-4">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field bg-gray-50 dark:bg-zinc-700 dark:text-white dark:border-zinc-600"
              placeholder="tu@email.com"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader size={18} className="animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Mail size={18} />
                Enviar Enlace de Recuperación
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-sm text-[#4285F4] hover:underline flex items-center justify-center gap-1"
          >
            <ArrowLeft size={14} />
            Volver al Login
          </Link>
        </div>
      </div>
    </div>
  );
}
