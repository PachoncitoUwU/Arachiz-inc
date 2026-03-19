import React, { useContext, useState, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import fetchApi from '../services/api';
import PageHeader from '../components/PageHeader';
import {
  Moon, Sun, Globe, Bell, User, Shield, Palette,
  Save, Monitor, Camera, Loader
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

function ToggleSwitch({ checked, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
          checked ? 'bg-[#4285F4]' : 'bg-gray-200'
        }`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`} />
      </button>
    </div>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
          <Icon size={16} className="text-[#4285F4]" />
        </div>
        <h2 className="font-bold text-gray-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function Configuracion() {
  const { user, updateUser } = useContext(AuthContext);
  const { settings, updateSetting, toggleDark } = useSettings();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [avatarPreview, setAvatarPreview] = useState(
    user?.avatarUrl ? `${API_BASE}${user.avatarUrl}` : null
  );
  const [avatarFile, setAvatarFile] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const initials = user?.fullName
    ? user.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';
  const roleColor = user?.userType === 'instructor' ? 'bg-[#4285F4]' : 'bg-[#34A853]';

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('La imagen no puede superar 5MB', 'error'); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const body = new FormData();
      if (fullName.trim() && fullName !== user?.fullName) body.append('fullName', fullName.trim());
      if (avatarFile) body.append('avatar', avatarFile);

      const d = await fetch(`${API_BASE}/api/auth/profile`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body,
      });
      const json = await d.json();
      if (!d.ok) throw new Error(json.error || 'Error al guardar');

      if (updateUser) updateUser(json.user);
      setAvatarFile(null);
      showToast('Perfil actualizado', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const THEMES = [
    { id: 'light',  label: 'Claro',   icon: Sun },
    { id: 'dark',   label: 'Oscuro',  icon: Moon },
    { id: 'system', label: 'Sistema', icon: Monitor },
  ];

  const LANGUAGES = [
    { code: 'es', label: 'Español', flag: '🇨🇴' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
  ];

  return (
    <div className="animate-fade-in space-y-5 max-w-2xl">
      <PageHeader title="Configuración" subtitle="Personaliza tu experiencia en Arachiz" />

      {/* Perfil */}
      <Section icon={User} title="Perfil">
        <form onSubmit={handleSaveProfile} className="space-y-4">
          {/* Avatar editable */}
          <div className="flex items-center gap-5 mb-2">
            <div className="relative group">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="w-20 h-20 rounded-2xl object-cover shadow-md"
                />
              ) : (
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-md ${roleColor}`}>
                  {initials}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera size={20} className="text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <div>
              <p className="font-bold text-gray-900">{user?.fullName}</p>
              <p className="text-sm text-gray-400">{user?.email}</p>
              <span className={`badge mt-1 ${user?.userType === 'instructor' ? 'badge-info' : 'badge-success'}`}>
                {user?.userType === 'instructor' ? 'Instructor' : 'Aprendiz'}
              </span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="block text-xs text-[#4285F4] hover:underline mt-1"
              >
                Cambiar foto
              </button>
            </div>
          </div>

          <div>
            <label className="input-label">Nombre completo</label>
            <input
              className="input-field"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Tu nombre completo"
            />
          </div>
          <div>
            <label className="input-label">Correo electrónico</label>
            <input
              type="email"
              className="input-field opacity-60 cursor-not-allowed"
              value={user?.email || ''}
              disabled
            />
            <p className="text-xs text-gray-400 mt-1">El correo no puede modificarse</p>
          </div>
          <button type="submit" disabled={savingProfile} className="btn-primary flex items-center gap-2">
            {savingProfile ? <Loader size={15} className="animate-spin" /> : <Save size={15} />}
            {savingProfile ? 'Guardando...' : 'Guardar perfil'}
          </button>
        </form>
      </Section>

      {/* Apariencia */}
      <Section icon={Palette} title="Apariencia">
        <p className="text-sm font-medium text-gray-700 mb-3">Tema</p>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {THEMES.map(({ id, label, icon: Icon }) => {
            const isActive = id === 'dark' ? settings.darkMode : id === 'light' ? !settings.darkMode : false;
            return (
              <button key={id} type="button"
                onClick={() => {
                  if (id === 'dark' && !settings.darkMode) toggleDark();
                  if (id === 'light' && settings.darkMode) toggleDark();
                }}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  isActive
                    ? 'border-[#4285F4] bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                <Icon size={20} className={isActive ? 'text-[#4285F4]' : 'text-gray-400'} />
                <span className={`text-xs font-medium ${isActive ? 'text-[#4285F4]' : 'text-gray-500'}`}>{label}</span>
              </button>
            );
          })}
        </div>
        <div className="divide-y divide-gray-100">
          <ToggleSwitch
            checked={settings.compactMode}
            onChange={v => updateSetting('compactMode', v)}
            label="Modo compacto"
            description="Reduce el espaciado para ver más contenido"
          />
        </div>
      </Section>

      {/* Idioma */}
      <Section icon={Globe} title="Idioma">
        <div className="grid grid-cols-2 gap-3">
          {LANGUAGES.map(({ code, label, flag }) => (
            <button key={code} type="button"
              onClick={() => { updateSetting('language', code); showToast(`Idioma cambiado a ${label}`, 'success'); }}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                settings.language === code
                  ? 'border-[#4285F4] bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
              <span className="text-2xl">{flag}</span>
              <div className="text-left">
                <p className={`text-sm font-semibold ${settings.language === code ? 'text-[#4285F4]' : 'text-gray-700'}`}>{label}</p>
                <p className="text-xs text-gray-400">{code.toUpperCase()}</p>
              </div>
            </button>
          ))}
        </div>
        {settings.language === 'en' && (
          <p className="text-xs text-yellow-600 bg-yellow-50 px-3 py-2 rounded-lg mt-3">
            Full English translation coming soon.
          </p>
        )}
      </Section>

      {/* Notificaciones */}
      <Section icon={Bell} title="Notificaciones">
        <div className="divide-y divide-gray-100">
          <ToggleSwitch
            checked={settings.notifications}
            onChange={v => updateSetting('notifications', v)}
            label="Notificaciones del sistema"
            description="Alertas de sesiones, excusas y actividad"
          />
        </div>
      </Section>

      {/* Seguridad */}
      <Section icon={Shield} title="Seguridad">
        <div className="space-y-3">
          <p className="text-sm text-gray-500">Tu sesión expira automáticamente después de 8 horas de inactividad.</p>
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Sesión actual</p>
            <p className="text-sm text-gray-700">{user?.email}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.userType}</p>
          </div>
        </div>
      </Section>
    </div>
  );
}
