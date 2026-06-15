import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, Coffee } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useWorldCup } from '../../context/WorldCupContext';
import fetchApi from '../../services/api';
import BallLoading from '../../components/BallLoading';
import NormalLoading from '../../components/NormalLoading';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

export default function Login() {
  const { login } = useContext(AuthContext);
  const { t } = useSettings();
  const { worldCupMode } = useWorldCup();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [donationAmount, setDonationAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [amountError, setAmountError] = useState('');

  const handleDonate = (method) => {
    setSelectedPaymentMethod(method);
    setDonationAmount('');
    setAmountError('');
    setShowDonationModal(true);
  };

  const handleAmountChange = (e) => {
    // Quitar puntos de miles y cualquier carácter no numérico
    const raw = e.target.value.replace(/\./g, '').replace(/\D/g, '');
    setDonationAmount(raw);

    const value = parseInt(raw) || 0;
    if (raw !== '' && value < 1000) {
      setAmountError('El monto mínimo es $1.000 COP');
    } else {
      setAmountError('');
    }
  };

  const handleQuickAmount = (amount) => {
    setDonationAmount(amount.toString());
    setAmountError('');
  };

  const parsedAmount = parseInt(donationAmount) || 0;
  const isAmountValid = parsedAmount >= 1000;

  const handleProceedToConfirm = () => {
    if (!isAmountValid) {
      setAmountError(donationAmount === '' ? 'Ingresa un monto' : 'El monto mínimo es $1.000 COP');
      return;
    }
    setShowDonationModal(false);
    setShowConfirmModal(true);
  };

  const handleConfirmDonation = async () => {
    if (selectedPaymentMethod === 'wompi') {
      await openWompi();
    }
    setShowConfirmModal(false);
  };

  const loadWompiScript = () => {
    return new Promise((resolve) => {
      if (typeof window.WidgetCheckout !== 'undefined') {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = "https://checkout.wompi.co/widget.js";
      script.type = "text/javascript";
      script.onload = () => resolve();
      document.head.appendChild(script);
    });
  };

  const openWompi = async () => {
    try {
      // 1. Pedir al backend la referencia + firma de integridad
      const response = await fetch(`${API_BASE}/api/skins/wompi-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parsedAmount })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Error al iniciar pago');
      }

      const { reference, amountInCents, currency, integrityHash, publicKey, redirectUrl } = await response.json();

      // 2. Cargar el script de Wompi de manera dinámica
      await loadWompiScript();

      // 3. Abrir el Widget de Wompi oficial
      const checkout = new window.WidgetCheckout({
        currency,
        amountInCents,
        reference,
        publicKey,
        signature: {
          integrity: integrityHash
        },
        redirectUrl
      });

      checkout.open((result) => {
        const transaction = result.transaction;
        console.log('Transaction status:', transaction.status);
      });

    } catch (err) {
      setError('Error al procesar pago con Wompi: ' + err.message);
    }
  };

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

  const [particles, setParticles] = useState([]);
  const [bubbles, setBubbles] = useState([
    { id: 1, left: '5%', size: 60, color: '#4285F4', duration: 12, delay: 0 },
    { id: 2, left: '18%', size: 45, color: '#EA4335', duration: 14, delay: 2 },
    { id: 3, left: '32%', size: 70, color: '#FBBC05', duration: 11, delay: 4 },
    { id: 4, left: '48%', size: 55, color: '#34A853', duration: 13, delay: 1 },
    { id: 5, left: '63%', size: 50, color: '#4285F4', duration: 12, delay: 3 },
    { id: 6, left: '77%', size: 65, color: '#EA4335', duration: 14, delay: 0 },
    { id: 7, left: '91%', size: 48, color: '#FBBC05', duration: 13, delay: 2.5 },
  ]);

  const [kickedBalls, setKickedBalls] = useState([]);

  const handleBubbleClick = (bubble, event) => {
    event.stopPropagation();
    
    if (worldCupMode) {
      // Efecto de patada (modo mundialista)
      const rect = event.currentTarget.getBoundingClientRect();
      const x = rect.left;
      const y = rect.top;
      
      const kickedBall = {
        id: `kicked-${Date.now()}`,
        x,
        y,
        size: bubble.size,
        left: bubble.left,
      };
      
      setKickedBalls(prev => [...prev, kickedBall]);
      setBubbles(prev => prev.filter(b => b.id !== bubble.id));
      
      setTimeout(() => {
        setKickedBalls(prev => prev.filter(kb => kb.id !== kickedBall.id));
      }, 3000);
      
      setTimeout(() => {
        setBubbles(prev => [...prev, { ...bubble, id: Date.now() }]);
      }, 4000);
    } else {
      // Efecto de explosión (modo base)
      const rect = event.currentTarget.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      
      const newParticles = Array.from({ length: 12 }, (_, i) => ({
        id: `${Date.now()}-${i}`,
        x,
        y,
        color: bubble.color,
        size: Math.random() * 8 + 4,
        angle: (360 / 12) * i,
      }));
      
      setParticles(prev => [...prev, ...newParticles]);
      setBubbles(prev => prev.filter(b => b.id !== bubble.id));
      
      setTimeout(() => {
        setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
      }, 800);
      
      setTimeout(() => {
        setBubbles(prev => [...prev, { ...bubble, id: Date.now() }]);
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#34A853]/[0.05] to-[#4285F4]/[0.08] dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800 flex items-center justify-center p-4 relative overflow-hidden">
      <style>{`
        /* Pasto realista para modo mundialista */
        .grass-container {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 120px;
          overflow: hidden;
          z-index: 1;
        }
        .grass-blade {
          position: absolute;
          bottom: 0;
          width: 4px;
          border-radius: 50% 50% 0 0;
          transform-origin: bottom center;
          animation: grass-sway 3s ease-in-out infinite;
        }
        @keyframes grass-sway {
          0%, 100% { transform: rotate(-2deg); }
          50% { transform: rotate(2deg); }
        }
        /* Variaciones de altura y color */
        .grass-short { height: 40px; }
        .grass-medium { height: 60px; }
        .grass-tall { height: 80px; }
        .grass-very-tall { height: 100px; }
        
        .grass-color-1 { background: linear-gradient(to top, #1a5f1a, #2d8a2d); }
        .grass-color-2 { background: linear-gradient(to top, #1e6b1e, #33a033); }
        .grass-color-3 { background: linear-gradient(to top, #1a7a1a, #3db83d); }
        .grass-color-4 { background: linear-gradient(to top, #165016, #267326); }
        .grass-color-5 { background: linear-gradient(to top, #145214, #1f6f1f); }
        .grass-color-6 { background: linear-gradient(to top, #1d7a1d, #38b838); }
      `}
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
          cursor: pointer;
          transition: transform 0.2s ease;
        }
        .circle-float:hover {
          transform: scale(1.2);
        }
        @keyframes kick-ball {
          0% {
            transform: translateY(0) translateZ(0) scale(1) rotate(0deg);
            opacity: 1;
          }
          20% {
            transform: translateY(-200px) translateZ(100px) scale(1.1) rotate(-180deg);
          }
          40% {
            transform: translateY(-300px) translateZ(200px) scale(0.9) rotate(-360deg);
          }
          50% {
            transform: translateY(-280px) translateZ(250px) scale(0.8) rotate(-450deg);
          }
          60% {
            transform: translateY(-320px) translateZ(300px) scale(0.7) rotate(-540deg);
          }
          70% {
            transform: translateY(-310px) translateZ(320px) scale(0.6) rotate(-630deg);
          }
          80% {
            transform: translateY(-340px) translateZ(350px) scale(0.5) rotate(-720deg);
          }
          90% {
            transform: translateY(-330px) translateZ(360px) scale(0.3) rotate(-810deg);
          }
          100% {
            transform: translateY(-360px) translateZ(400px) scale(0.1) rotate(-900deg);
            opacity: 0;
          }
        }
        .kicked-ball {
          position: fixed;
          animation: kick-ball 3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          z-index: 1000;
          pointer-events: none;
        }
        @keyframes particle-burst {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(var(--tx), var(--ty)) scale(0);
            opacity: 0;
          }
        }
        .particle {
          position: fixed;
          border-radius: 50%;
          pointer-events: none;
          animation: particle-burst 0.8s ease-out forwards;
          z-index: 9999;
        }
      `}</style>

      {/* Botones Flotantes Donación */}
      <div className="hidden sm:flex absolute bottom-6 left-6 flex-col gap-3 z-50">
        {/* Botón Wompi */}
        <button
          onClick={() => handleDonate('wompi')}
          className="bg-white dark:bg-zinc-800  border border-gray-200 dark:border-zinc-700  text-gray-700 px-5 py-3 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 hover:border-[#FF6B35] transition-all flex items-center gap-3 group animate-fade-in"
        >
          <div className="bg-[#FFF4E5] p-2 rounded-full group-hover:scale-110 transition-transform">
            <Coffee size={20} className="text-[#FF6B35] fill-current" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-sm font-bold text-gray-900 dark:text-white  leading-none">Wompi</span>
            <span className="text-xs text-gray-500 font-medium mt-0.5">Apoyar proyecto</span>
          </div>
        </button>
      </div>

      {/* Modal de Donación */}
      {showDonationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-zinc-800  dark:bg-zinc-800 rounded-2xl shadow-2xl p-4 md:p-8  max-w-sm w-full animate-fade-in">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-amber-50 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <Coffee size={28} className="text-amber-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white  dark:text-white">Invítame un café ☕</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Vía <span className="font-semibold capitalize">{selectedPaymentMethod}</span>
              </p>
            </div>

            {/* Input principal */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Cuánto quieres donar?
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-bold text-lg">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  value={donationAmount === '' ? '' : parseInt(donationAmount).toLocaleString('es-CO')}
                  onChange={handleAmountChange}
                  placeholder="5.000"
                  className={`w-full border-2 rounded-xl pl-9 pr-16 py-4 text-xl font-bold focus:outline-none transition-all ${
                    amountError
                      ? 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 focus:border-red-500'
                      : isAmountValid
                      ? 'border-green-400 bg-green-50 dark:bg-green-900/20 text-gray-900 dark:text-white focus:border-green-500'
                      : 'border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-gray-900 dark:text-white focus:border-[#4285F4]'
                  }`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm font-medium">COP</span>
              </div>

              {/* Mensaje de error */}
              {amountError && (
                <div className="mt-2 flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                  <span className="text-base">⚠️</span>
                  <span>{amountError}</span>
                </div>
              )}

              {/* Mensaje de éxito */}
              {isAmountValid && !amountError && (
                <div className="mt-2 flex items-center gap-2 text-green-700 dark:text-green-400 text-sm bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
                  <span className="text-base">✅</span>
                  <span>Monto válido — ¡gracias por tu apoyo!</span>
                </div>
              )}
            </div>

            {/* Atajos de monto */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4  gap-2 mb-6">
              {[2000, 5000, 10000, 20000].map((amount) => (
                <button
                  key={amount}
                  onClick={() => handleQuickAmount(amount)}
                  className={`py-2 rounded-lg text-xs font-semibold transition-all border ${
                    parsedAmount === amount
                      ? 'bg-[#4285F4] text-white border-[#4285F4]'
                      : 'bg-gray-50 dark:bg-zinc-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-zinc-600 hover:border-[#4285F4] hover:text-[#4285F4]'
                  }`}
                >
                  ${(amount / 1000).toFixed(0)}K
                </button>
              ))}
            </div>

            {/* Botones */}
            <div className="flex flex-wrap gap-3 ">
              <button
                onClick={() => { setShowDonationModal(false); setAmountError(''); }}
                className="flex-1 bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-semibold text-sm hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleProceedToConfirm}
                className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${
                  isAmountValid
                    ? 'bg-[#4285F4] text-white hover:bg-[#3367d6] active:scale-95'
                    : 'bg-gray-200 dark:bg-zinc-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }`}
              >
                Continuar →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-zinc-800  dark:bg-zinc-800 rounded-2xl shadow-2xl p-4 md:p-8  max-w-sm w-full animate-fade-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl md:text-3xl ">🎉</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white  dark:text-white">¿Confirmas la donación?</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Revisa los detalles antes de continuar</p>
            </div>

            {/* Detalles */}
            <div className="bg-gray-50 dark:bg-zinc-700 rounded-xl p-5 mb-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400 text-sm">Monto</span>
                <span className="text-xl md:text-2xl  font-bold text-[#4285F4]">
                  ${parsedAmount.toLocaleString('es-CO')} COP
                </span>
              </div>
              <div className="border-t border-gray-200 dark:border-zinc-700  dark:border-zinc-600 pt-3 flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400 text-sm">Método de pago</span>
                <span className="font-semibold capitalize text-gray-900 dark:text-white  dark:text-white bg-white dark:bg-zinc-800  dark:bg-zinc-600 border border-gray-200 dark:border-zinc-700  dark:border-zinc-500 px-3 py-1 rounded-full text-sm">
                  {selectedPaymentMethod}
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-6">
              Serás redirigido a <span className="font-semibold capitalize">{selectedPaymentMethod}</span> para completar el pago de forma segura 🔒
            </p>

            {/* Botones */}
            <div className="flex flex-wrap gap-3 ">
              <button
                onClick={() => { setShowConfirmModal(false); setShowDonationModal(true); }}
                className="flex-1 bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-semibold text-sm hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors"
              >
                ← Atrás
              </button>
              <button
                onClick={handleConfirmDonation}
                className="flex-1 bg-[#4285F4] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#3367d6] transition-colors active:scale-95"
              >
                Pagar ahora 💳
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Balones flotantes interactivos */}
      <div className="absolute inset-0 overflow-hidden">
        {bubbles.map(bubble => (
          worldCupMode ? (
            <img
              key={bubble.id}
              src="/world cup.png"
              alt="Balón Copa Mundial"
              className="circle-float opacity-30 hover:opacity-50 cursor-pointer"
              style={{
                left: bubble.left,
                width: `${bubble.size}px`,
                height: `${bubble.size}px`,
                animationDuration: `${bubble.duration}s`,
                animationDelay: `${bubble.delay}s`,
                pointerEvents: 'auto',
              }}
              onClick={(e) => handleBubbleClick(bubble, e)}
            />
          ) : (
            <div
              key={bubble.id}
              className="circle-float opacity-70 hover:opacity-100 cursor-pointer"
              style={{
                left: bubble.left,
                width: `${bubble.size}px`,
                height: `${bubble.size}px`,
                backgroundColor: bubble.color,
                animationDuration: `${bubble.duration}s`,
                animationDelay: `${bubble.delay}s`,
                pointerEvents: 'auto',
              }}
              onClick={(e) => handleBubbleClick(bubble, e)}
            />
          )
        ))}
      </div>

      {/* Balones pateados (solo modo mundialista) */}
      {worldCupMode && kickedBalls.map(ball => (
        <img
          key={ball.id}
          src="/world cup.png"
          alt="Balón pateado"
          className="kicked-ball"
          style={{
            left: `${ball.x}px`,
            top: `${ball.y}px`,
            width: `${ball.size}px`,
            height: `${ball.size}px`,
          }}
        />
      ))}

      {/* Partículas de explosión */}
      {particles.map(particle => {
        const distance = 80 + Math.random() * 40;
        const tx = Math.cos((particle.angle * Math.PI) / 180) * distance;
        const ty = Math.sin((particle.angle * Math.PI) / 180) * distance;
        
        return (
          <div
            key={particle.id}
            className="particle"
            style={{
              left: `${particle.x}px`,
              top: `${particle.y}px`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color,
              '--tx': `${tx}px`,
              '--ty': `${ty}px`,
            }}
          />
        );
      })}

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Link to="/" className="hover:scale-105 transition-transform active:scale-95">
              <img 
                src={worldCupMode ? "/Arachiz-worldcup.png" : "/ArachizLogoPNG.png"} 
                alt="Arachiz Logo" 
                className="h-16 md:h-20 object-contain dark:invert transition-all duration-300" 
              />
            </Link>
          </div>
          <h2 className="text-xl md:text-2xl  font-bold text-gray-900 dark:text-white  dark:text-white mt-4">Bienvenido de vuelta</h2>
        </div>

        <div className="bg-white dark:bg-zinc-800  dark:bg-zinc-800 rounded-2xl shadow-card p-4 md:p-6  sm:p-4 md:p-8  space-y-5 animate-fade-in border border-gray-100 dark:border-zinc-700  dark:border-zinc-700">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm animate-shake">
              {error}
            </div>
          )}

          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            type="button"
            className="w-full bg-white dark:bg-zinc-800  dark:bg-zinc-700 border border-gray-200 dark:border-zinc-700  dark:border-zinc-600 text-gray-700 dark:text-gray-200 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-50 dark:hover:bg-zinc-600 hover:border-gray-300 dark:hover:border-zinc-500 transition-all active:scale-95 shadow-sm flex items-center justify-center gap-3 group"
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
            <span className="text-xs text-gray-400 font-medium bg-white dark:bg-zinc-800  px-2">o</span>
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
                className="input-field pl-11 focus:ring-2 focus:ring-[#4285F4] focus:border-transparent transition-all w-full border border-gray-200 dark:border-zinc-700  dark:border-zinc-600 rounded-xl py-2.5 text-sm bg-gray-50 dark:bg-zinc-700 dark:text-white focus:bg-white dark:bg-zinc-800  dark:focus:bg-zinc-600"
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
                className="input-field pl-11 focus:ring-2 focus:ring-[#4285F4] focus:border-transparent transition-all w-full border border-gray-200 dark:border-zinc-700  dark:border-zinc-600 rounded-xl py-2.5 text-sm bg-gray-50 dark:bg-zinc-700 dark:text-white focus:bg-white dark:bg-zinc-800  dark:focus:bg-zinc-600"
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
                  {worldCupMode ? <BallLoading size={20} text="" /> : <NormalLoading size={20} text="Cargando..." />}
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

          {/* Donaciones en Móvil */}
          <div className="flex sm:hidden flex-col items-center gap-2 pt-2 border-t border-gray-100 dark:border-zinc-700 ">
            <span className="text-[10px] text-gray-400 font-bold tracking-wider uppercase">Apoyar el proyecto</span>
            <div className="flex flex-wrap gap-4  w-full justify-center">
              <button
                type="button"
                onClick={() => handleDonate('wompi')}
                className="flex items-center gap-1 text-xs font-bold text-[#FF6B35] hover:underline"
              >
                <Coffee size={13} className="fill-current" />
                Wompi
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pasto en la parte inferior (solo modo mundialista) */}
      {worldCupMode && (
        <div className="grass-container">
          {/* Base de tierra */}
          <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-[#3d2817] to-[#5c3d1f]"></div>
          
          {/* Generar briznas de pasto */}
          {Array.from({ length: 150 }).map((_, i) => {
            const heights = ['grass-short', 'grass-medium', 'grass-tall', 'grass-very-tall'];
            const colors = ['grass-color-1', 'grass-color-2', 'grass-color-3', 'grass-color-4', 'grass-color-5', 'grass-color-6'];
            const randomHeight = heights[Math.floor(Math.random() * heights.length)];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            const randomLeft = (i / 150) * 100;
            const randomDelay = Math.random() * 3;
            const randomDuration = 2 + Math.random() * 2;
            
            return (
              <div
                key={i}
                className={`grass-blade ${randomHeight} ${randomColor}`}
                style={{
                  left: `${randomLeft}%`,
                  animationDelay: `${randomDelay}s`,
                  animationDuration: `${randomDuration}s`,
                  opacity: 0.7 + Math.random() * 0.3,
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
