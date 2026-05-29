import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, Coffee } from 'lucide-react';
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

      {/* Botones Flotantes Donación */}
      <div className="hidden sm:flex absolute bottom-6 left-6 flex-col gap-3 z-50">
        {/* Botón Wompi */}
        <button
          onClick={() => handleDonate('wompi')}
          className="bg-white border border-gray-200 text-gray-700 px-5 py-3 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 hover:border-[#FF6B35] transition-all flex items-center gap-3 group animate-fade-in"
        >
          <div className="bg-[#FFF4E5] p-2 rounded-full group-hover:scale-110 transition-transform">
            <Coffee size={20} className="text-[#FF6B35] fill-current" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-sm font-bold text-gray-900 leading-none">Wompi</span>
            <span className="text-xs text-gray-500 font-medium mt-0.5">Apoyar proyecto</span>
          </div>
        </button>
      </div>

      {/* Modal de Donación */}
      {showDonationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full animate-fade-in">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Coffee size={28} className="text-amber-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Invítame un café ☕</h3>
              <p className="text-gray-500 text-sm mt-1">
                Vía <span className="font-semibold capitalize">{selectedPaymentMethod}</span>
              </p>
            </div>

            {/* Input principal */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ¿Cuánto quieres donar?
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  value={donationAmount === '' ? '' : parseInt(donationAmount).toLocaleString('es-CO')}
                  onChange={handleAmountChange}
                  placeholder="5.000"
                  className={`w-full border-2 rounded-xl pl-9 pr-16 py-4 text-xl font-bold focus:outline-none transition-all ${
                    amountError
                      ? 'border-red-400 bg-red-50 text-red-700 focus:border-red-500'
                      : isAmountValid
                      ? 'border-green-400 bg-green-50 text-gray-900 focus:border-green-500'
                      : 'border-gray-300 bg-white text-gray-900 focus:border-[#4285F4]'
                  }`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">COP</span>
              </div>

              {/* Mensaje de error */}
              {amountError && (
                <div className="mt-2 flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <span className="text-base">⚠️</span>
                  <span>{amountError}</span>
                </div>
              )}

              {/* Mensaje de éxito */}
              {isAmountValid && !amountError && (
                <div className="mt-2 flex items-center gap-2 text-green-700 text-sm bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <span className="text-base">✅</span>
                  <span>Monto válido — ¡gracias por tu apoyo!</span>
                </div>
              )}
            </div>

            {/* Atajos de monto */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              {[2000, 5000, 10000, 20000].map((amount) => (
                <button
                  key={amount}
                  onClick={() => handleQuickAmount(amount)}
                  className={`py-2 rounded-lg text-xs font-semibold transition-all border ${
                    parsedAmount === amount
                      ? 'bg-[#4285F4] text-white border-[#4285F4]'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[#4285F4] hover:text-[#4285F4]'
                  }`}
                >
                  ${(amount / 1000).toFixed(0)}K
                </button>
              ))}
            </div>

            {/* Botones */}
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDonationModal(false); setAmountError(''); }}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleProceedToConfirm}
                className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${
                  isAmountValid
                    ? 'bg-[#4285F4] text-white hover:bg-[#3367d6] active:scale-95'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
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
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full animate-fade-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎉</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">¿Confirmas la donación?</h3>
              <p className="text-gray-500 text-sm mt-1">Revisa los detalles antes de continuar</p>
            </div>

            {/* Detalles */}
            <div className="bg-gray-50 rounded-xl p-5 mb-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">Monto</span>
                <span className="text-2xl font-bold text-[#4285F4]">
                  ${parsedAmount.toLocaleString('es-CO')} COP
                </span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                <span className="text-gray-500 text-sm">Método de pago</span>
                <span className="font-semibold capitalize text-gray-900 bg-white border border-gray-200 px-3 py-1 rounded-full text-sm">
                  {selectedPaymentMethod}
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-500 text-center mb-6">
              Serás redirigido a <span className="font-semibold capitalize">{selectedPaymentMethod}</span> para completar el pago de forma segura 🔒
            </p>

            {/* Botones */}
            <div className="flex gap-3">
              <button
                onClick={() => { setShowConfirmModal(false); setShowDonationModal(true); }}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
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

        <div className="bg-white rounded-2xl shadow-card p-6 sm:p-8 space-y-5 animate-fade-in">
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

          {/* Donaciones en Móvil */}
          <div className="flex sm:hidden flex-col items-center gap-2 pt-2 border-t border-gray-100">
            <span className="text-[10px] text-gray-400 font-bold tracking-wider uppercase">Apoyar el proyecto</span>
            <div className="flex gap-4 w-full justify-center">
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
    </div>
  );
}
