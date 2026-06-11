import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, Loader } from 'lucide-react';
import fetchApi from '../../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const [particles, setParticles] = useState([]);
  const [bubbles, setBubbles] = useState([
    { id: 1, left: '10%', size: 48, color: '#4285F4', duration: 12, delay: 0 },
    { id: 2, left: '20%', size: 64, color: '#EA4335', duration: 10, delay: 1 },
    { id: 3, left: '30%', size: 72, color: '#FBBC05', duration: 14, delay: 2 },
    { id: 4, left: '40%', size: 56, color: '#34A853', duration: 11, delay: 0 },
    { id: 5, left: '50%', size: 80, color: '#4285F4', duration: 13, delay: 1.5 },
    { id: 6, left: '60%', size: 52, color: '#EA4335', duration: 12, delay: 0.5 },
    { id: 7, left: '70%', size: 68, color: '#FBBC05', duration: 10, delay: 2.5 },
    { id: 8, left: '80%', size: 60, color: '#34A853', duration: 11, delay: 1 },
    { id: 9, left: '85%', size: 76, color: '#4285F4', duration: 13, delay: 0 },
    { id: 10, left: '15%', size: 44, color: '#EA4335', duration: 12, delay: 2 },
    { id: 11, left: '25%', size: 88, color: '#34A853', duration: 14, delay: 0.5 },
    { id: 12, left: '45%', size: 70, color: '#FBBC05', duration: 11, delay: 1.5 },
    { id: 13, left: '65%', size: 58, color: '#4285F4', duration: 12, delay: 2 },
    { id: 14, left: '75%', size: 84, color: '#EA4335', duration: 13, delay: 0.5 },
    { id: 15, left: '90%', size: 66, color: '#34A853', duration: 10, delay: 1 },
  ]);

  const handleBubbleClick = (bubble, event) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    const newParticles = Array.from({ length: 12 }, (_, i) => ({
      id: `particle-${Date.now()}-${i}`,
      x, y, color: bubble.color,
      angle: (i * 360) / 12,
      size: Math.random() * 6 + 3,
    }));
    
    setParticles(prev => [...prev, ...newParticles]);
    setBubbles(prev => prev.filter(b => b.id !== bubble.id));
    
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 800);
    
    setTimeout(() => {
      setBubbles(prev => [...prev, { ...bubble, id: Date.now() }]);
    }, 2000);
  };

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
      if (err.message && err.message.includes('creada con Google')) {
        setError('Esta cuenta usa Google. Vuelve e inicia sesión con el botón "Continuar con Google".');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const animatedBackground = (
    <>
      <style>{`
        @keyframes float-up {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(-120vh) rotate(720deg); opacity: 0; }
        }
        .circle-float {
          position: absolute; bottom: -150px; border-radius: 50%;
          animation: float-up linear infinite; cursor: pointer;
          transition: transform 0.2s ease;
        }
        .circle-float:hover { transform: scale(1.2); }
        @keyframes particle-burst {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
        }
        .particle {
          position: fixed; border-radius: 50%; pointer-events: none;
          animation: particle-burst 0.8s ease-out forwards; z-index: 9999;
        }
      `}</style>

      {/* Partículas de explosión */}
      {particles.map(p => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.x, top: p.y, width: p.size, height: p.size, backgroundColor: p.color,
            '--tx': `${Math.cos((p.angle * Math.PI) / 180) * 100}px`,
            '--ty': `${Math.sin((p.angle * Math.PI) / 180) * 100}px`
          }}
        />
      ))}

      {/* Burbujas flotantes */}
      {bubbles.map(bubble => (
        <div
          key={bubble.id}
          onClick={(e) => handleBubbleClick(bubble, e)}
          className="circle-float opacity-30 dark:opacity-20"
          style={{
            left: bubble.left, width: bubble.size, height: bubble.size,
            border: `2px solid ${bubble.color}`,
            animationDuration: `${bubble.duration}s`,
            animationDelay: `${bubble.delay}s`,
          }}
        />
      ))}
    </>
  );

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-[#34A853]/[0.05] to-[#4285F4]/[0.08] dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800 flex items-center justify-center p-4 relative overflow-hidden">
        {animatedBackground}
        <div className="bg-white dark:bg-zinc-800 rounded-3xl shadow-2xl p-4 md:p-6 sm:p-4 md:p-8 max-w-md w-full text-center animate-scale-in border border-gray-100 dark:border-zinc-700 z-10">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-[#34A853] dark:text-green-400" />
          </div>
          <h1 className="text-xl md:text-2xl  font-bold text-gray-900 dark:text-white  dark:text-white mb-3">¡Email Enviado!</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Revisa tu bandeja de entrada y spam.
          </p>
          <Link to="/login" className="btn-primary text-sm md:text-base  w-full flex items-center justify-center gap-2">
            <ArrowLeft size={18} />
            Volver al Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#34A853]/[0.05] to-[#4285F4]/[0.08] dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800 flex items-center justify-center p-4 relative overflow-hidden">
      {animatedBackground}
      <div className="bg-white dark:bg-zinc-800 rounded-3xl shadow-2xl p-4 md:p-6 sm:p-4 md:p-8 max-w-md w-full animate-fade-in border border-gray-100 dark:border-zinc-700 z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Mail size={32} className="text-[#4285F4] dark:text-blue-400" />
          </div>
          <h1 className="text-2xl md:text-3xl  font-bold text-gray-900 dark:text-white  dark:text-white mb-2">¿Olvidaste tu contraseña?</h1>
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
            className="btn-primary text-sm md:text-base  w-full flex items-center justify-center gap-2"
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
