import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { QrCode, AlertCircle, Loader, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import fetchApi from '../services/api';
import { useToast } from '../context/ToastContext';

export default function ScanQR() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const code = searchParams.get('code');

  useEffect(() => {
    const registerAttendance = async () => {
      if (!code) {
        setError('Código QR inválido o ausente en la URL.');
        setLoading(false);
        return;
      }

      if (!user) {
        // Redirigir al login con el código en la URL para retomar después
        navigate(`/login?redirect=/scan-qr?code=${code}`);
        return;
      }

      if (user.userType !== 'aprendiz') {
        setError('Solo los aprendices pueden registrar asistencia mediante QR.');
        setLoading(false);
        return;
      }

      try {
        const data = await fetchApi('/qr/validate', {
          method: 'POST',
          body: JSON.stringify({ code })
        });

        setSuccess(true);
        showToast(data.message || 'Asistencia registrada correctamente.', 'success');
        
        // Redirigir a la vista de asistencias del aprendiz después de un breve éxito
        setTimeout(() => {
          navigate('/aprendiz/asistencia', { state: { registered: true } });
        }, 2500);

      } catch (err) {
        setError(err.message || 'Error al validar el código QR.');
      } finally {
        setLoading(false);
      }
    };

    registerAttendance();
  }, [code, user, navigate, showToast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {loading ? (
          <>
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <QrCode size={32} className="text-[#4285F4]" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Procesando código QR</h2>
            <p className="text-gray-600 mb-6">Registrando tu asistencia, por favor espera...</p>
            <Loader size={24} className="animate-spin text-[#4285F4] mx-auto" />
          </>
        ) : error ? (
          <>
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} className="text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button 
              onClick={() => navigate('/aprendiz/asistencia')}
              className="btn-primary w-full"
            >
              Ir a mis asistencias
            </button>
          </>
        ) : success ? (
          <>
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-scale-in">
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">¡Asistencia registrada!</h2>
            <p className="text-gray-600 mb-6">Tu asistencia ha sido registrada con éxito.</p>
            <p className="text-sm text-gray-400">Redirigiendo...</p>
          </>
        ) : null}
      </div>
    </div>
  );
}
