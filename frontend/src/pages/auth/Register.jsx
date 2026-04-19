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

  const accentColor = userType === 'instructor' ? '#4285F4' : '#34A853';

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-100 rounded-full opacity-40"/>
        <div className="absolute -top-16 -left-16 w-64 h-64 bg-green-100 rounded-full opacity-30"/>
      </div>

      <div className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img src="/ArachizLogoPNG.png" alt="Arachiz" className="h-14 md:h-16 object-contain dark:invert transition-all duration-300" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{t('register', 'create')}</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-8 space-y-4">
          {/* Tipo de usuario */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
            {['aprendiz', 'instructor'].map(type => (
              <button key={type} type="button" onClick={() => setUserType(type)}
                className={`py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
                  userType === type
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}>
                {type === 'aprendiz' ? t('register', 'learner') : t('register', 'instructor')}
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
