import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, IdCard, CheckCircle, ArrowLeft } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useWorldCup } from '../../context/WorldCupContext';
import fetchApi from '../../services/api';

export default function Register() {
  const navigate = useNavigate();
  const { t } = useSettings();
  const { worldCupMode } = useWorldCup();

  // ── Paso actual: 1 | 2 | 3 ──────────────────────────────────────────────
  const [step, setStep] = useState(1);

  // ── Datos del formulario ─────────────────────────────────────────────────
  const [userType, setUserType]               = useState('aprendiz');
  const [fullName, setFullName]               = useState('');
  const [document, setDocument]               = useState('');
  const [email, setEmail]                     = useState('');
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTc, setAcceptedTc]           = useState(false);
  const [showTc, setShowTc]                   = useState(false);

  // ── Estado OTP ───────────────────────────────────────────────────────────
  const [emailVerified, setEmailVerified]   = useState(false);
  const [otpSent, setOtpSent]               = useState(false);
  const [otp, setOtp]                       = useState(['', '', '', '', '', '']);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [otpError, setOtpError]             = useState('');
  const [otpMessage, setOtpMessage]         = useState('');

  // ── Feedback general ─────────────────────────────────────────────────────
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  // ── Burbujas decorativas ─────────────────────────────────────────────────
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

  const accentColor = userType === 'instructor' ? '#4285F4' : userType === 'administrador' ? '#EA4335' : '#34A853';

  // ── Handlers burbujas ────────────────────────────────────────────────────
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
        x, y,
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

  // ── Paso 1 → 2 ──────────────────────────────────────────────────────────
  const handleStep1 = (e) => {
    e.preventDefault();
    setError('');
    if (!fullName.trim())    return setError('Ingresa tu nombre completo.');
    if (!document.trim())    return setError('Ingresa tu número de documento.');
    setStep(2);
  };

  // ── Enviar OTP ───────────────────────────────────────────────────────────
  const handleSendOTP = async () => {
    if (!email) { setOtpError('Ingresa tu correo primero.'); return; }
    setOtpError('');
    setOtpMessage('');
    setVerifyingEmail(true);
    try {
      await fetchApi('/password/verify-email', {
        method: 'POST',
        body: JSON.stringify({ email, fullName }),
      });
      setOtpSent(true);
      setOtpMessage('Código enviado. Revisa tu bandeja de entrada.');
    } catch (err) {
      // Mostrar error descriptivo
      const msg = err.message || '';
      if (msg.toLowerCase().includes('registrado')) {
        setOtpError('Este correo ya tiene una cuenta. Inicia sesión.');
      } else if (msg.toLowerCase().includes('enviar') || msg.toLowerCase().includes('código')) {
        setOtpError('No se pudo enviar el correo. Verifica que la dirección sea correcta e inténtalo de nuevo.');
      } else {
        setOtpError(msg || 'Error al enviar el código. Inténtalo de nuevo.');
      }
    } finally {
      setVerifyingEmail(false);
    }
  };

  // ── Cambio en cajas OTP ──────────────────────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      const pasted = value.slice(0, 6).split('');
      const newOtp = [...otp];
      pasted.forEach((char, i) => { if (i < 6) newOtp[i] = char; });
      setOtp(newOtp);
      if (pasted.length === 6) verifyOtp(newOtp.join(''));
      return;
    }
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) document.getElementById(`otp-${index + 1}`).focus();
    if (value && index === 5 && newOtp.every(v => v !== '')) verifyOtp(newOtp.join(''));
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0)
      document.getElementById(`otp-${index - 1}`).focus();
  };

  const verifyOtp = async (code) => {
    setVerifyingEmail(true);
    setOtpError('');
    try {
      await fetchApi('/password/confirm-email', {
        method: 'POST',
        body: JSON.stringify({ email, otp: code }),
      });
      setEmailVerified(true);
      setOtpSent(false);
      setOtpMessage('¡Correo verificado!');
      // Avanzar al paso 3 automáticamente tras verificar
      setTimeout(() => setStep(3), 900);
    } catch (err) {
      setOtpError(err.message);
      setOtp(['', '', '', '', '', '']);
      document.getElementById('otp-0')?.focus();
    } finally {
      setVerifyingEmail(false);
    }
  };

  // ── Envío final ──────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!acceptedTc)                return setError(t('register', 'acceptTerms'));
    if (!emailVerified)             return setError('Debes verificar tu correo primero.');
    if (password !== confirmPassword) return setError(t('register', 'passMismatch'));
    if (password.length < 6)        return setError(t('register', 'passShort'));
    setLoading(true);
    try {
      await fetchApi('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ userType, fullName, document, email, password }),
      });
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Indicador de pasos ───────────────────────────────────────────────────
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[1, 2, 3].map((s) => (
        <React.Fragment key={s}>
          <div
            className="flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all"
            style={{
              backgroundColor: step >= s ? accentColor : '#e5e7eb',
              color: step >= s ? '#fff' : '#9ca3af',
            }}
          >
            {step > s ? (
              <CheckCircle size={16} />
            ) : s}
          </div>
          {s < 3 && (
            <div
              className="h-0.5 w-8 rounded transition-all"
              style={{ backgroundColor: step > s ? accentColor : '#e5e7eb' }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#34A853]/[0.05] to-[#4285F4]/[0.08] dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800 flex items-center justify-center p-4 relative overflow-hidden">
      <style>{`
        @keyframes float-up {
          0%   { transform: translateY(0) rotate(0deg);      opacity: 1; }
          100% { transform: translateY(-120vh) rotate(720deg); opacity: 0; }
        }
        .circle-float {
          position: absolute; bottom: -150px; border-radius: 50%;
          animation: float-up linear infinite; cursor: pointer;
          transition: transform 0.2s ease;
        }
        .circle-float:hover { transform: scale(1.2); }
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
          0%   { transform: translate(0,0) scale(1); opacity: 1; }
          100% { transform: translate(var(--tx),var(--ty)) scale(0); opacity: 0; }
        }
        .particle {
          position: fixed; border-radius: 50%; pointer-events: none;
          animation: particle-burst 0.8s ease-out forwards; z-index: 9999;
        }
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .step-enter { animation: fadeSlide 0.3s ease forwards; }
      `}</style>

      {/* Balones */}
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

      {/* Partículas */}
      {particles.map(particle => {
        const distance = 80 + Math.random() * 40;
        const tx = Math.cos((particle.angle * Math.PI) / 180) * distance;
        const ty = Math.sin((particle.angle * Math.PI) / 180) * distance;
        return (
          <div
            key={particle.id}
            className="particle"
            style={{
              left: `${particle.x}px`, top: `${particle.y}px`,
              width: `${particle.size}px`, height: `${particle.size}px`,
              backgroundColor: particle.color,
              '--tx': `${tx}px`, '--ty': `${ty}px`,
            }}
          />
        );
      })}

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Link to="/" className="hover:scale-105 transition-transform active:scale-95">
              <img src="/ArachizLogoPNG.png" alt="Arachiz" className="h-14 md:h-16 object-contain dark:invert transition-all duration-300" />
            </Link>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {t('register', 'create')}
          </h1>
        </div>

        <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-card p-4 md:p-6 space-y-4 border border-gray-100 dark:border-zinc-700">

          <StepIndicator />

          {/* ─── PASO 1: Nombre y documento ──────────────────────────────── */}
          {step === 1 && (
            <div className="step-enter space-y-4">
              {/* Tipo de usuario */}
              <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 dark:bg-zinc-700 rounded-xl">
                {['aprendiz', 'instructor', 'administrador'].map(type => (
                  <button key={type} type="button" onClick={() => setUserType(type)}
                    className={`py-2 rounded-lg text-xs font-semibold transition-all capitalize ${
                      userType === type
                        ? 'bg-white dark:bg-zinc-600 shadow-sm text-gray-900 dark:text-white'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}>
                    {type === 'aprendiz' ? t('register', 'learner') :
                     type === 'instructor' ? t('register', 'instructor') :
                     t('register', 'admin')}
                  </button>
                ))}
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleStep1} className="space-y-3">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <User size={16} />
                  </div>
                  <input type="text" required placeholder={t('register', 'fullName')}
                    className="input-field pl-11 bg-gray-50 dark:bg-zinc-700 dark:text-white dark:border-zinc-600 focus:bg-white dark:focus:bg-zinc-600"
                    value={fullName} onChange={e => setFullName(e.target.value)} />
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <IdCard size={16} />
                  </div>
                  <input type="text" required placeholder={t('register', 'document')}
                    className="input-field pl-11 bg-gray-50 dark:bg-zinc-700 dark:text-white dark:border-zinc-600 focus:bg-white dark:focus:bg-zinc-600"
                    value={document} onChange={e => setDocument(e.target.value)} />
                </div>

                <button type="submit"
                  className="w-full text-white py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 shadow-sm"
                  style={{ backgroundColor: accentColor }}>
                  Continuar
                </button>
              </form>

              <Link to="/login"
                className="block w-full text-center bg-[#4285F4] text-white py-3 rounded-xl font-semibold text-sm hover:bg-blue-600 transition-all active:scale-95 shadow-sm">
                {t('register', 'hasAccount')}
              </Link>
            </div>
          )}

          {/* ─── PASO 2: Verificación de email ───────────────────────────── */}
          {step === 2 && (
            <div className="step-enter space-y-4">
              <button type="button" onClick={() => { setStep(1); setError(''); setOtpError(''); setOtpMessage(''); setOtpSent(false); setEmailVerified(false); setOtp(['','','','','','']); }}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                <ArrowLeft size={15} /> Volver
              </button>

              <div className="text-center space-y-1">
                <p className="font-semibold text-gray-800 dark:text-white text-sm">Verifica tu correo electrónico</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Te enviaremos un código de 6 dígitos</p>
              </div>

              {!emailVerified && (
                <>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                      <Mail size={16} />
                    </div>
                    <input type="email" required placeholder={t('register', 'email')}
                      disabled={otpSent}
                      className="input-field pl-11 bg-gray-50 dark:bg-zinc-700 dark:text-white dark:border-zinc-600 focus:bg-white dark:focus:bg-zinc-600 disabled:opacity-60"
                      value={email} onChange={e => { setEmail(e.target.value); setOtpSent(false); setOtpError(''); setOtpMessage(''); }} />
                  </div>

                  {!otpSent && (
                    <button type="button" onClick={handleSendOTP} disabled={verifyingEmail || !email}
                      className="w-full text-white py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 shadow-sm disabled:opacity-50"
                      style={{ backgroundColor: accentColor }}>
                      {verifyingEmail ? 'Enviando...' : 'Enviar código'}
                    </button>
                  )}

                  {otpSent && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                      <p className="text-sm text-blue-800 dark:text-blue-300 mb-3 font-medium text-center">
                        Código enviado a <strong>{email}</strong>
                      </p>
                      <div className="flex gap-2 justify-center mb-2">
                        {otp.map((digit, index) => (
                          <input
                            key={index}
                            id={`otp-${index}`}
                            type="text"
                            inputMode="numeric"
                            maxLength="6"
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            className="w-10 h-10 text-center font-bold text-lg rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#4285F4] focus:border-[#4285F4] dark:bg-zinc-700 dark:border-zinc-600 dark:text-white"
                          />
                        ))}
                      </div>
                      {verifyingEmail && <p className="text-xs text-center text-blue-600 mt-2">Verificando...</p>}
                      {otpError && <p className="text-xs text-center text-red-500 mt-2">{otpError}</p>}
                      <button type="button" onClick={() => { setOtpSent(false); setOtp(['','','','','','']); setOtpError(''); setOtpMessage(''); }}
                        className="w-full mt-3 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 underline">
                        Cambiar correo
                      </button>
                    </div>
                  )}
                </>
              )}

              {emailVerified && (
                <div className="flex flex-col items-center gap-2 py-4">
                  <CheckCircle size={40} className="text-green-500" />
                  <p className="text-sm font-semibold text-green-600 dark:text-green-400">¡Correo verificado!</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Continuando al siguiente paso...</p>
                </div>
              )}

              {otpError && !otpSent && (
                <p className="text-xs text-center text-red-500">{otpError}</p>
              )}
            </div>
          )}

          {/* ─── PASO 3: Contraseña y T&C ─────────────────────────────────── */}
          {step === 3 && (
            <div className="step-enter space-y-3">
              <button type="button" onClick={() => { setStep(2); setError(''); }}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                <ArrowLeft size={15} /> Volver
              </button>

              <div className="text-center">
                <p className="font-semibold text-gray-800 dark:text-white text-sm">Crea tu contraseña</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Mínimo 6 caracteres</p>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 px-3 py-2 rounded-xl text-xs">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <Lock size={16} />
                  </div>
                  <input type="password" required placeholder={t('register', 'password')}
                    className="input-field pl-11 bg-gray-50 dark:bg-zinc-700 dark:text-white dark:border-zinc-600 focus:bg-white dark:focus:bg-zinc-600"
                    value={password} onChange={e => setPassword(e.target.value)} />
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <Lock size={16} />
                  </div>
                  <input type="password" required placeholder={t('register', 'confirmPassword')}
                    className="input-field pl-11 bg-gray-50 dark:bg-zinc-700 dark:text-white dark:border-zinc-600 focus:bg-white dark:focus:bg-zinc-600"
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                </div>

                {/* T&C siempre visible */}
                <div className="bg-gray-50 dark:bg-zinc-700/50 rounded-xl p-3 flex items-start gap-2">
                  <input type="checkbox" id="tc"
                    className="mt-0.5 w-4 h-4 flex-shrink-0 rounded border-gray-300 dark:border-zinc-600 text-[#4285F4] focus:ring-[#4285F4] dark:bg-zinc-700"
                    checked={acceptedTc} onChange={e => setAcceptedTc(e.target.checked)} />
                  <label htmlFor="tc" className="text-xs text-gray-600 dark:text-gray-400 leading-snug cursor-pointer">
                    {t('register', 'terms')}{' '}
                    <span className="text-[#4285F4] font-semibold hover:underline"
                      onClick={(e) => { e.preventDefault(); setShowTc(true); }}>
                      {t('register', 'termsLink')}
                    </span>{' '}
                    {t('register', 'termsEnd')}
                  </label>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full text-white py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                  style={{ backgroundColor: accentColor }}>
                  {loading ? t('register', 'submitting') : t('register', 'submit')}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Modal T&C */}
      {showTc && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50, padding: 16 }}>
          <div className="bg-white dark:bg-zinc-800 rounded-2xl p-4 md:p-6 max-w-md w-full max-h-[80vh] flex flex-col border border-gray-200 dark:border-zinc-700">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Términos y Condiciones</h2>
            <div className="overflow-y-auto pr-2 text-sm text-gray-600 dark:text-gray-400 space-y-3">
              <p>Al registrarte en Arachiz, aceptas el tratamiento de tus datos personales con fines únicamente académicos y de registro de asistencia.</p>
              <p><strong>Datos recopilados:</strong> Documento de identidad, Nombre completo, Correo electrónico, y credenciales biométricas (como Huella dactilar o UID de tarjetas de proximidad NFC).</p>
              <p>Estos datos no serán compartidos con terceros ajenos a la institución o entidad organizadora, y se alojan de forma segura según las normativas de protección de datos vigentes.</p>
            </div>
            <div className="mt-6 flex justify-end">
              <button type="button" onClick={() => { setAcceptedTc(true); setShowTc(false); }}
                className="bg-[#4285F4] text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-[#3367d6] transition-colors">
                Aceptar y Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
