import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { IdCard, UserCheck } from 'lucide-react';
import fetchApi from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';

export default function CompleteProfile() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const { login } = useContext(AuthContext);
  const { t } = useSettings();

  const [userType, setUserType] = useState('aprendiz');
  const [document, setDocument] = useState('');
  const [acceptedTc, setAcceptedTc] = useState(false);
  const [showTc, setShowTc] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!acceptedTc) return setError(t('register', 'acceptTerms'));
    if (!document) return setError(t('register', 'document'));

    setLoading(true);
    try {
      // Usaremos el token actual temporalmente para autorizar la petición
      const data = await fetchApi('/auth/complete-profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userType, document })
      });
      
      // El backend nos devuelve un nuevo token con los datos actualizados
      login(data.token, data.user);
    } catch (err) {
      setError(err.message || 'Error al completar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const accentColor = userType === 'instructor' ? '#4285F4' : userType === 'administrador' ? '#EA4335' : '#34A853';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4285F4]/10 via-[#34A853]/10 to-[#FBBC05]/10 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-800 rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full relative overflow-hidden">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserCheck size={32} className="text-[#4285F4]" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Falta un paso más</h2>
          <p className="text-gray-500 text-sm mt-2">
            Como es tu primera vez iniciando sesión con Google, necesitamos un par de datos para configurar tu cuenta.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">¿Qué eres en Arachiz?</label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-zinc-700 rounded-xl mb-4">
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

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
              <IdCard size={17}/>
            </div>
            <input type="text" required placeholder={t('register', 'document')}
              className="input-field pl-11 focus:ring-2 focus:ring-[#4285F4] w-full border border-gray-200 rounded-xl py-3 text-sm bg-gray-50"
              value={document} onChange={e => setDocument(e.target.value)} />
          </div>

          <div className="flex items-start gap-2 pt-2">
            <input type="checkbox" id="tc" className="mt-1 w-4 h-4 rounded border-gray-300 text-[#4285F4] focus:ring-[#4285F4]"
              checked={acceptedTc} onChange={e => setAcceptedTc(e.target.checked)} />
            <label htmlFor="tc" className="text-xs text-gray-600 leading-tight">
              {t('register', 'terms')} <span className="text-[#4285F4] font-semibold cursor-pointer hover:underline" onClick={(e)=>{e.preventDefault(); setShowTc(true);}}>{t('register', 'termsLink')}</span> {t('register', 'termsEnd')}
            </label>
          </div>

          <button type="submit" disabled={loading}
            className="w-full text-white py-3 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50 shadow-md mt-4"
            style={{ backgroundColor: accentColor }}>
            {loading ? 'Guardando...' : 'Comenzar ahora'}
          </button>
        </form>

        {showTc && (
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',justifyContent:'center',alignItems:'center',zIndex:50,padding:16}}>
            <div style={{background:'white',borderRadius:20,padding:24,maxWidth:500,maxHeight:'80vh',display:'flex',flexDirection:'column'}}>
              <h2 className="text-xl font-bold mb-4">Términos y Condiciones</h2>
              <div className="overflow-y-auto pr-2 text-sm text-gray-600 space-y-3">
                <p>Al registrarte en Arachiz, aceptas el tratamiento de tus datos personales con fines únicamente académicos y de registro de asistencia.</p>
                <p><strong>Datos recopilados:</strong> Documento de identidad, Nombre completo, Correo electrónico, y credenciales biométricas.</p>
                <p>Estos datos no serán compartidos con terceros ajenos a la institución o entidad organizadora, y se alojan de forma segura según las normativas de protección de datos vigentes.</p>
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
