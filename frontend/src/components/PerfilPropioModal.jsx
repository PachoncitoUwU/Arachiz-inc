import React, { useState, useRef, useEffect } from 'react';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import { User, Mail, FileText, Camera, Save, Loader, X, Trash2 } from 'lucide-react';

// Imports condicionales para evitar errores con administrador
const ReactionTime = React.lazy(() => import('../games/ReactionTime'));
const WordleGame = React.lazy(() => import('../games/WordleGame'));

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const API_BASE = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export default function PerfilPropioModal({ open, onClose, user, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [document, setDocument] = useState(user?.document || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [deleteAvatar, setDeleteAvatar] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const fileInputRef = useRef(null);

  // Easter Eggs - Solo para instructor y aprendiz
  const [nameClicks, setNameClicks] = useState(0);
  const [showReaction, setShowReaction] = useState(false);
  const nameTimer = useRef(null);

  const [emailClicks, setEmailClicks] = useState(0);
  const [showWordle, setShowWordle] = useState(false);
  const emailTimer = useRef(null);

  // Detectar si hay cambios sin guardar
  const hasUnsavedChanges = () => {
    if (!isEditing) return false;
    return (
      fullName !== (user?.fullName || '') ||
      document !== (user?.document || '') ||
      avatarFile !== null ||
      deleteAvatar
    );
  };

  useEffect(() => {
    if (open && user) {
      setFullName(user.fullName || '');
      setDocument(user.document || '');
      setAvatarPreview(null);
      setAvatarFile(null);
      setDeleteAvatar(false);
      setIsEditing(false);
    }
  }, [open, user?.id]); // Solo cuando se abre el modal o cambia el usuario

  // Limpiar timers al desmontar
  useEffect(() => {
    return () => {
      clearTimeout(nameTimer.current);
      clearTimeout(emailTimer.current);
    };
  }, []);

  // Easter egg: 7 clicks en el nombre (Reaction Time)
  const handleNameClick = () => {
    // Solo para instructor y aprendiz, no para administrador
    if (user?.userType === 'administrador') return;
    if (showReaction || isEditing) return;

    setNameClicks(n => {
      const next = n + 1;
      if (next >= 7) {
        setShowReaction(true);
        clearTimeout(nameTimer.current);
        return 0;
      }
      clearTimeout(nameTimer.current);
      nameTimer.current = setTimeout(() => setNameClicks(0), 2000);
      return next;
    });
  };

  // Easter egg: 7 clicks en el email (Wordle)
  const handleEmailClick = () => {
    // Solo para instructor y aprendiz, no para administrador
    if (user?.userType === 'administrador') return;
    if (showWordle || isEditing) return;

    setEmailClicks(n => {
      const next = n + 1;
      if (next >= 7) {
        setShowWordle(true);
        clearTimeout(emailTimer.current);
        return 0;
      }
      clearTimeout(emailTimer.current);
      emailTimer.current = setTimeout(() => setEmailClicks(0), 2000);
      return next;
    });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Solo se permiten imágenes JPG, PNG o WEBP');
      return;
    }

    // Validar tamaño (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no puede superar los 5MB');
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setDeleteAvatar(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      alert('El nombre no puede estar vacío');
      return;
    }

    if (!document.trim()) {
      alert('El documento no puede estar vacío');
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('fullName', fullName.trim());
      formData.append('document', document.trim());
      
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      } else if (deleteAvatar) {
        formData.append('deleteAvatar', 'true');
      }

      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar perfil');
      }

      const data = await response.json();
      
      // Actualizar el usuario en el contexto
      if (onUpdate) {
        onUpdate(data.user);
      }

      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      setDeleteAvatar(false);
    } catch (error) {
      console.error('Error al guardar perfil:', error);
      alert(error.message || 'Error al actualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFullName(user?.fullName || '');
    setDocument(user?.document || '');
    setAvatarFile(null);
    setAvatarPreview(null);
    setDeleteAvatar(false);
    setIsEditing(false);
  };

  const handleClose = () => {
    if (hasUnsavedChanges()) {
      setShowExitConfirm(true);
    } else {
      onClose();
    }
  };

  const confirmClose = () => {
    setShowExitConfirm(false);
    setIsEditing(false);
    setFullName(user?.fullName || '');
    setDocument(user?.document || '');
    setAvatarFile(null);
    setAvatarPreview(null);
    setDeleteAvatar(false);
    onClose();
  };

  if (!user) return null;

  const initials = user.fullName
    ? user.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : user.email?.[0]?.toUpperCase() || '?';

  const roleColor = 
    user.userType === 'instructor' ? 'bg-[#4285F4]' : 
    user.userType === 'administrador' ? 'bg-[#EA4335]' : 
    'bg-[#34A853]';

  const roleLabel = 
    user.userType === 'instructor' ? 'Instructor' : 
    user.userType === 'administrador' ? 'Administrador' : 
    'Aprendiz';

  const avatarSrc = avatarPreview || (deleteAvatar ? null : (user.avatarUrl 
    ? (user.avatarUrl.startsWith('http') || user.avatarUrl.startsWith('data:') 
      ? user.avatarUrl 
      : `${API_BASE}${user.avatarUrl}`)
    : null));

  return (
    <>
      {/* Easter Eggs - Solo para instructor y aprendiz */}
      {showReaction && user?.userType !== 'administrador' && (
        <React.Suspense fallback={<div>Cargando...</div>}>
          <ReactionTime onClose={() => setShowReaction(false)} currentUser={user} />
        </React.Suspense>
      )}
      {showWordle && user?.userType !== 'administrador' && (
        <React.Suspense fallback={<div>Cargando...</div>}>
          <WordleGame onClose={() => setShowWordle(false)} currentUser={user} />
        </React.Suspense>
      )}

      <Modal open={open} onClose={handleClose} title="Mi Perfil">
      <div className="space-y-6">
        {/* Avatar y nombre */}
        <div className="flex flex-col items-center gap-4 pb-6 border-b border-gray-100">
          <div className="relative">
            {avatarSrc ? (
              <img 
                src={avatarSrc} 
                alt="Avatar" 
                className="w-24 h-24 rounded-2xl object-cover shadow-lg"
              />
            ) : (
              <div className={`w-24 h-24 rounded-2xl ${roleColor} text-white flex items-center justify-center text-3xl font-bold shadow-lg`}>
                {initials}
              </div>
            )}
            
            {isEditing && (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#4285F4] hover:bg-[#3367D6] text-white rounded-xl flex items-center justify-center shadow-lg transition-colors"
                >
                  <Camera size={18} />
                </button>
                {(avatarPreview || (user.avatarUrl && !deleteAvatar)) && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center shadow-lg transition-colors"
                    title="Eliminar foto"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </>
            )}
          </div>

          {!isEditing && (
            <>
              <div className="text-center">
                <h3 
                  className="text-xl font-bold text-gray-900 cursor-default select-none" 
                  onClick={handleNameClick}
                >
                  {user.fullName}
                </h3>
                <p 
                  className="text-sm text-gray-500 mt-1 cursor-default select-none" 
                  onClick={handleEmailClick}
                >
                  {user.email}
                </p>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white ${roleColor}`}>
                {roleLabel}
              </span>

              {/* Indicadores de easter eggs - Solo para instructor y aprendiz */}
              {user.userType !== 'administrador' && (
                <>
                  {nameClicks > 0 && nameClicks < 7 && (
                    <div className="text-center">
                      <p className="text-xs font-medium text-blue-500 animate-pulse">
                        ⚡ {7 - nameClicks} {7 - nameClicks === 1 ? 'clic más' : 'clics más'}...
                      </p>
                    </div>
                  )}
                  {emailClicks > 0 && emailClicks < 7 && (
                    <div className="text-center">
                      <p className="text-xs font-medium text-purple-500 animate-pulse">
                        🎮 {7 - emailClicks} {7 - emailClicks === 1 ? 'clic más' : 'clics más'}...
                      </p>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Información del perfil */}
        {!isEditing ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                <User size={16} className="text-[#4285F4]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre completo</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{user.fullName}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center shrink-0">
                <Mail size={16} className="text-purple-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Correo electrónico</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5 break-all">{user.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
                <FileText size={16} className="text-green-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Documento</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{user.document}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre completo
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4285F4] focus:border-transparent transition-all"
                placeholder="Tu nombre completo"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Correo electrónico
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">El correo no puede modificarse</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Documento
              </label>
              <input
                type="text"
                value={document}
                onChange={(e) => setDocument(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4285F4] focus:border-transparent transition-all"
                placeholder="Tu número de documento"
              />
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex gap-3 pt-4 border-t border-gray-100">
          {!isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 btn-primary"
              >
                Editar perfil
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Cerrar
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Guardar cambios
                  </>
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>

    {/* Modal de confirmación para salir con cambios sin guardar */}
    <ConfirmDialog
      open={showExitConfirm}
      onClose={() => setShowExitConfirm(false)}
      onConfirm={confirmClose}
      title="¿Descartar cambios?"
      message="Tienes cambios sin guardar. ¿Estás seguro de que deseas salir sin guardar?"
      confirmText="Descartar"
      cancelText="Continuar editando"
      danger={true}
    />
  </>
  );
}
