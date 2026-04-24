import React, { useState } from 'react';
import Modal from './Modal';
import EnrollModal from './EnrollModal';
import MateriasEvitadasModal from './MateriasEvitadasModal';
import { User, Mail, CreditCard, Fingerprint, ScanFace, BookOpen, Trash2, UserMinus } from 'lucide-react';

const API_BASE = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

// Helper para resolver avatarUrl
const resolveAvatar = (url) => {
  if (!url) return null;
  if (url.startsWith('data:') || url.startsWith('http') || url.startsWith('blob:')) return url;
  return `${API_BASE}${url}`;
};

export default function AprendizPerfilModal({ 
  open, 
  onClose, 
  aprendiz, 
  isAdmin,
  fichaId,
  materias,
  onRemoveAprendiz,
  onBiometricUpdate 
}) {
  const [modalEnroll, setModalEnroll] = useState(false);
  const [modalMateriasEvitadas, setModalMateriasEvitadas] = useState(false);
  const [localAprendiz, setLocalAprendiz] = useState(aprendiz);
  const COLOR = '#4285F4';

  // Actualizar localAprendiz cuando aprendiz cambie
  React.useEffect(() => {
    setLocalAprendiz(aprendiz);
  }, [aprendiz]);

  if (!localAprendiz) return null;

  const avatarSrc = resolveAvatar(localAprendiz.avatarUrl);
  const hasNfc = !!localAprendiz.nfcUid;
  const fingerprintCount = localAprendiz.huellas?.length || 0;
  const hasFace = localAprendiz.faceDescriptor && localAprendiz.faceDescriptor.length === 128;

  const handleOpenEnroll = () => {
    setModalEnroll(true);
  };

  const handleCloseEnroll = async () => {
    setModalEnroll(false);
    if (onBiometricUpdate) {
      await onBiometricUpdate();
    }
  };

  const handleOpenMateriasEvitadas = () => {
    setModalMateriasEvitadas(true);
  };

  const handleCloseMateriasEvitadas = async () => {
    setModalMateriasEvitadas(false);
    if (onBiometricUpdate) {
      await onBiometricUpdate();
    }
  };

  const handleRemove = () => {
    if (onRemoveAprendiz) {
      onRemoveAprendiz(localAprendiz.id);
    }
  };

  return (
    <>
      <Modal open={open} onClose={onClose} title="Perfil del Aprendiz" maxWidth="max-w-2xl">
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          {/* Información Personal */}
          <div className="flex items-start gap-4 pb-4 border-b border-gray-100 dark:border-gray-700">
            {avatarSrc ? (
              <img 
                src={avatarSrc} 
                className="w-20 h-20 rounded-2xl object-cover" 
                alt={localAprendiz.fullName} 
              />
            ) : (
              <div 
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-xl font-bold text-white"
                style={{ backgroundColor: COLOR }}
              >
                {localAprendiz.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
              </div>
            )}
            
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {localAprendiz.fullName}
              </h3>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <User size={14} />
                  <span className="font-mono">{localAprendiz.document}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Mail size={14} />
                  <span>{localAprendiz.email}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Métodos Biométricos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Métodos de Registro
              </h4>
              {isAdmin && (
                <button 
                  onClick={handleOpenEnroll}
                  className="btn-primary text-xs py-1.5 px-3"
                >
                  Gestionar
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* NFC */}
              <div className={`p-4 rounded-xl border-2 ${hasNfc ? 'border-blue-200 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-100 bg-gray-50 dark:bg-gray-800 dark:border-gray-700'}`}>
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${hasNfc ? 'bg-blue-100 text-[#4285F4]' : 'bg-gray-200 text-gray-400'}`}>
                    <CreditCard size={20} />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">NFC</span>
                  <span className={`text-xs ${hasNfc ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
                    {hasNfc ? '✓ Registrado' : 'No registrado'}
                  </span>
                </div>
              </div>

              {/* Huellas */}
              <div className={`p-4 rounded-xl border-2 ${fingerprintCount > 0 ? 'border-purple-200 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-100 bg-gray-50 dark:bg-gray-800 dark:border-gray-700'}`}>
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${fingerprintCount > 0 ? 'bg-purple-100 text-purple-500' : 'bg-gray-200 text-gray-400'}`}>
                    <Fingerprint size={20} />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Huellas</span>
                  <span className={`text-xs ${fingerprintCount > 0 ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'}`}>
                    {fingerprintCount > 0 ? `${fingerprintCount} registrada${fingerprintCount > 1 ? 's' : ''}` : 'No registradas'}
                  </span>
                </div>
              </div>

              {/* Facial */}
              <div className={`p-4 rounded-xl border-2 ${hasFace ? 'border-green-200 bg-green-50 dark:bg-green-900/20' : 'border-gray-100 bg-gray-50 dark:bg-gray-800 dark:border-gray-700'}`}>
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${hasFace ? 'bg-green-100 text-[#34A853]' : 'bg-gray-200 text-gray-400'}`}>
                    <ScanFace size={20} />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Facial</span>
                  <span className={`text-xs ${hasFace ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                    {hasFace ? '✓ Registrado' : 'No registrado'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Materias Evitadas */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Materias Evitadas
              </h4>
              {isAdmin && (
                <button 
                  onClick={handleOpenMateriasEvitadas}
                  className="btn-primary text-xs py-1.5 px-3"
                >
                  Gestionar
                </button>
              )}
            </div>

            {localAprendiz.materiasEvitadas && localAprendiz.materiasEvitadas.length > 0 ? (
              <div className="space-y-2">
                {localAprendiz.materiasEvitadas.map(me => (
                  <div 
                    key={me.id}
                    className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800"
                  >
                    <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                      <BookOpen size={16} />
                      <span className="font-medium">{me.materia.nombre}</span>
                    </div>
                    <p className="text-xs text-red-500 dark:text-red-500 ml-6">
                      {me.materia.tipo}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <BookOpen size={16} />
                  <span>Participa en todas las materias de esta ficha</span>
                </div>
              </div>
            )}
          </div>

          {/* Acciones de Admin */}
          {isAdmin && (
            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
              <button 
                onClick={handleRemove}
                className="btn-secondary w-full flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200"
              >
                <UserMinus size={16} />
                Eliminar aprendiz de esta ficha
              </button>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal de EnrollModal para gestionar biométricos */}
      {modalEnroll && (
        <EnrollModal 
          open={modalEnroll} 
          onClose={handleCloseEnroll} 
          aprendiz={localAprendiz} 
        />
      )}

      {/* Modal de Materias Evitadas */}
      {modalMateriasEvitadas && (
        <MateriasEvitadasModal 
          open={modalMateriasEvitadas} 
          onClose={handleCloseMateriasEvitadas} 
          aprendiz={localAprendiz}
          fichaId={fichaId}
          materias={materias || []}
          onUpdate={handleCloseMateriasEvitadas}
        />
      )}
    </>
  );
}
