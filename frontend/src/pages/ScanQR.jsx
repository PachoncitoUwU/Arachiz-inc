import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { QrCode, AlertCircle, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ScanQR() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState('');
  const code = searchParams.get('code');

  useEffect(() => {
    if (!code) {
      setError('Código QR inválido');
      return;
    }

    if (!user) {
      // Redirigir al login con el código en la URL
      navigate(`/login?redirect=/scan-qr?code=${code}`);
      return;
    }

    if (user.userType !== 'aprendiz') {
      setError('Solo los aprendices pueden escanear códigos QR');
      return;
    }

    // Redirigir a la página de asistencia con el scanner abierto
    navigate('/aprendiz/asistencia', { 
      state: { openQRScanner: true, qrCode: code } 
    });
  }, [code, user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {error ? (
          <>
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} className="text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button 
              onClick={() => navigate('/')}
              className="btn-primary w-full"
            >
              Volver al inicio
            </button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <QrCode size={32} className="text-[#4285F4]" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Procesando QR</h2>
            <p className="text-gray-600 mb-6">Redirigiendo...</p>
            <Loader size={24} className="animate-spin text-[#4285F4] mx-auto" />
          </>
        )}
      </div>
    </div>
  );
}
