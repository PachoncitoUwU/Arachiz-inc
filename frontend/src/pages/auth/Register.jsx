import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, IdCard, GraduationCap } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import fetchApi from '../../services/api';

export default function Register() {
  const navigate = useNavigate();
  const { t } = useSettings();
  const [userType, setUserType]               = useState('aprendiz');
  const [fullName, setFullName]               = useState('');
  const [document, setDocument]               = useState('');
  const [email, setEmail]                     = useState('');
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError]                     = useState('');
  const [loading, setLoading]                 = useState(false);
  const [acceptedTc, setAcceptedTc]           = useState(false);
  const [showTc, setShowTc]                   = useState(false);
  const [particles, setParticles] = useState([]);
  const [bubbles, setBubbles] = useState([
    { id: 1, left: '10%', size: 20, color: '#4285F4', duration: 20, delay: 0 },
    { id: 2, left: '20%', size: 12, color: '#EA4335', duration: 18, delay: 2 },
    { id: 3, left: '30%', size: 32, color: '#FBBC05', duration: 25, delay: 4 },
    { id: 4, left: '40%', size: 16, color: '#34A853', duration: 22, delay: 0 },
    { id: 5, left: '50%', size: 28, color: '#4285F4', duration: 20, delay: 3 },
    { id: 6, left: '60%', size: 14, color: '#EA4335', duration: 23, delay: 1 },
    { id: 7, left: '70%', size: 24, color: '#FBBC05', duration: 19, delay: 5 },
    { id: 8, left: '80%', size: 10, color: '#34A853', duration: 21, delay: 2 },
    { id: 9, left: '85%', size: 36, color: '#4285F4', duration: 24, delay: 0 },
    { id: 10, left: '15%', size: 12, color: '#EA4335', duration: 22, delay: 4 },
  ]);

  const handleBubbleClick = (bubble, event) => {
    event.stopPropagation();
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    const newParticles = Array.from({ length: 12 }, (_, i) => ({
      id: `particle-${Date.now()}-${i}`,
      x,
      y,
      color: bubble.color,
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
    if (!acceptedTc) return setError(t('register', 'acceptTerms'));
    if (password !== confirmPassword) return setError(t('register', 'passMismatch'));
    if (password.length < 6) return setError(t('register', 'passShort'));
    setLoading(true);
    try {
      await fetchApi('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ userType, fullName, document, email, password })
      });
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const accentColor = userType === 'instructor' ? '#4285F4' : userType === 'administrador' ? '#EA4335' : '#34A853';

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#34A853]/[0.05] to-[#4285F4]/[0.08] dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4 relative overflow-hidden">
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
          cursor: pointer;
          transition: transform 0.2s ease;
        }
        .circle-float:hover {
          transform: scale(1.2);
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
      {/* Burbujas flotantes interactivas */}
      <div className="absolute inset-0 overflow-hidden">
        {bubbles.map(bubble => (
          <div
            key={bubble.id}
            className="circle-float opacity-10 hover:opacity-20"
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
        ))}
      </div>

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

      <div className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img src="/ArachizLogoPNG.png" alt="Arachiz" className="h-14 md:h-16 object-contain dark:invert transition-all duration-300" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{t('register', 'create')}</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6 sm:p-8 space-y-4">
          {/* Tipo de usuario */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-xl">
            {['aprendiz', 'instructor', 'administrador'].map(type => (
              <button key={type} type="button" onClick={() => setUserType(type)}
                className={`py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all capitalize ${
                  userType === type
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}>
                {type === 'aprendiz' ? t('register', 'learner') : 
                 type === 'instructor' ? t('register', 'instructor') : 
                 t('register', 'admin')}
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
              <input type="text" required placeholder={t('register', 'fullName')}
                className="input-field pl-11"
                value={fullName} onChange={e => setFullName(e.target.value)} />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <IdCard size={16}/>
              </div>
              <input type="text" required placeholder={t('register', 'document')}
                className="input-field pl-11"
                value={document} onChange={e => setDocument(e.target.value)} />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <Mail size={16}/>
              </div>
              <input type="email" required placeholder={t('register', 'email')}
                className="input-field pl-11"
                value={email} onChange={e => setEmail(e.target.value)} />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <Lock size={16}/>
              </div>
              <input type="password" required placeholder={t('register', 'password')}
                className="input-field pl-11"
                value={password} onChange={e => setPassword(e.target.value)} />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <Lock size={16}/>
              </div>
              <input type="password" required placeholder={t('register', 'confirmPassword')}
                className="input-field pl-11"
                value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            </div>

            <div className="flex items-start gap-2 pt-1">
              <input type="checkbox" id="tc" className="mt-1 w-4 h-4 rounded border-gray-300 text-[#4285F4] focus:ring-[#4285F4]"
                checked={acceptedTc} onChange={e => setAcceptedTc(e.target.checked)} />
              <label htmlFor="tc" className="text-xs text-gray-600 leading-tight">
                {t('register', 'terms')} <span className="text-[#4285F4] font-semibold cursor-pointer hover:underline" onClick={(e)=>{e.preventDefault(); setShowTc(true);}}>{t('register', 'termsLink')}</span> {t('register', 'termsEnd')}
              </label>
            </div>

            <button type="submit" disabled={loading}
              className="w-full text-white py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 disabled:opacity-50 shadow-sm mt-2"
              style={{ backgroundColor: accentColor }}>
              {loading ? t('register', 'submitting') : t('register', 'submit')}
            </button>
          </form>

          <div className="relative flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100"/>
            <div className="w-2 h-2 rounded-full bg-gray-200"/>
            <div className="flex-1 h-px bg-gray-100"/>
          </div>

          <Link to="/login"
            className="block w-full text-center bg-[#4285F4] text-white py-3 rounded-xl font-semibold text-sm hover:bg-blue-600 transition-all active:scale-95 shadow-sm">
            {t('register', 'hasAccount')}
          </Link>
        </div>
      {showTc && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',justifyContent:'center',alignItems:'center',zIndex:50,padding:16}}>
          <div style={{background:'white',borderRadius:20,padding:24,maxWidth:500,maxHeight:'80vh',display:'flex',flexDirection:'column'}}>
            <h2 className="text-xl font-bold mb-4">Términos y Condiciones</h2>
            <div className="overflow-y-auto pr-2 text-sm text-gray-600 space-y-3">
              {/* === INSTRUCTOR: EDITA ESTOS TÉRMINOS AQUÍ === */}
              <p>Al registrarte en Arachiz, aceptas el tratamiento de tus datos personales con fines únicamente académicos y de registro de asistencia.</p>
              <p><strong>Datos recopilados:</strong> Documento de identidad, Nombre completo, Correo electrónico, y credenciales biométricas (como Huella dactilar o UID de tarjetas de proximidad NFC).</p>
              <p>Estos datos no serán compartidos con terceros ajenos a la institución o entidad organizadora, y se alojan de forma segura según las normativas de protección de datos vigentes.</p>
              {/* ============================================= */}
            </div>
            <div className="mt-6 flex justify-end">
              <button type="button" onClick={() => { setAcceptedTc(true); setShowTc(false); }} className="bg-[#4285F4] text-white px-6 py-2 rounded-xl font-bold text-sm">
                Aceptar y Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
