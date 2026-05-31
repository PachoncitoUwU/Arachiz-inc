import React, { useContext, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/PageHeader';
import ReleaseNotesModal from '../../components/ReleaseNotesModal';
import { Moon, Sun, Globe, Bell, Shield, Palette, Info } from 'lucide-react';
import { VERSION } from '../../config/version';

function ToggleSwitch({ checked, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</p>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      <button type="button" onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${checked ? 'bg-[#4285F4]' : 'bg-gray-200 dark:bg-gray-700'}`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-1'}`}/>
      </button>
    </div>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <div className="card dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100 dark:border-zinc-700  dark:border-gray-700">
        <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
          <Icon size={16} className="text-[#4285F4]"/>
        </div>
        <h2 className="font-bold text-gray-900 dark:text-white  dark:text-gray-100">{title}</h2>
      </div>
      {children}
    </div>
  );
}

const translations = {
  es: {
    appearance: 'Apariencia',
    theme: 'Tema',
    light: 'Claro',
    dark: 'Oscuro',
    language: 'Idioma',
    englishComingSoon: 'La traducción al inglés estará disponible próximamente',
    notifications: 'Notificaciones',
    emailNotifications: 'Notificaciones por correo',
    emailNotificationsDesc: 'Recibe actualizaciones importantes por email',
    pushNotifications: 'Notificaciones push',
    pushNotificationsDesc: 'Alertas en tiempo real en tu navegador',
    security: 'Seguridad',
    twoFactor: 'Autenticación de dos factores',
    twoFactorDesc: 'Añade una capa extra de seguridad a tu cuenta',
    sessionManagement: 'Gestión de sesiones',
    sessionManagementDesc: 'Controla dónde está activa tu sesión',
    currentSession: 'Sesión actual',
  },
  en: {
    appearance: 'Appearance',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    language: 'Language',
    englishComingSoon: 'English translation coming soon',
    notifications: 'Notifications',
    emailNotifications: 'Email notifications',
    emailNotificationsDesc: 'Receive important updates via email',
    pushNotifications: 'Push notifications',
    pushNotificationsDesc: 'Real-time alerts in your browser',
    security: 'Security',
    twoFactor: 'Two-factor authentication',
    twoFactorDesc: 'Add an extra layer of security to your account',
    sessionManagement: 'Session management',
    sessionManagementDesc: 'Control where your session is active',
    currentSession: 'Current session',
  }
};

export default function ConfiguracionAdmin() {
  const { user } = useContext(AuthContext);
  const { settings, updateSetting, toggleDark } = useSettings();
  const { showToast } = useToast();
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);

  const t = (key) => {
    const lang = settings?.language || 'es';
    return translations[lang]?.[key] || translations['es'][key] || key;
  };

  const LANGUAGES = [
    { code: 'es', label: 'Español', flag: '🇨🇴' },
    { code: 'en', label: 'English', flag: '🇺🇸' }
  ];

  return (
    <div className="animate-fade-in space-y-5 max-w-2xl">
      <PageHeader title="Configuración" subtitle="Personaliza tu experiencia en Arachiz" />

      {/* Apariencia */}
      <Section icon={Palette} title={t('appearance')}>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('theme')}</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: 'light', label: t('light'), icon: Sun },
            { id: 'dark', label: t('dark'), icon: Moon }
          ].map(({ id, label, icon: Icon }) => {
            const active = id === 'dark' ? settings.darkMode : !settings.darkMode;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  if (id === 'dark' && !settings.darkMode) toggleDark();
                  if (id === 'light' && settings.darkMode) toggleDark();
                }}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  active
                    ? 'border-[#4285F4] bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Icon size={22} className={active ? 'text-[#4285F4]' : 'text-gray-400'} />
                <span className={`text-sm font-semibold ${active ? 'text-[#4285F4]' : 'text-gray-500 dark:text-gray-400'}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      {/* Idioma */}
      <Section icon={Globe} title={t('language')}>
        <div className="grid grid-cols-2 gap-3">
          {LANGUAGES.map(({ code, label, flag }) => (
            <button
              key={code}
              type="button"
              onClick={() => {
                updateSetting('language', code);
                showToast(`Idioma: ${label}`, 'info');
              }}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                settings.language === code
                  ? 'border-[#4285F4] bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <span className="text-2xl">{flag}</span>
              <div className="text-left">
                <p className={`text-sm font-semibold ${settings.language === code ? 'text-[#4285F4]' : 'text-gray-700 dark:text-gray-300'}`}>
                  {label}
                </p>
                <p className="text-xs text-gray-400">{code.toUpperCase()}</p>
              </div>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">{t('englishComingSoon')}</p>
      </Section>

      {/* Notificaciones */}
      <Section icon={Bell} title={t('notifications')}>
        <ToggleSwitch
          checked={settings.emailNotifications ?? true}
          onChange={(val) => updateSetting('emailNotifications', val)}
          label={t('emailNotifications')}
          description={t('emailNotificationsDesc')}
        />
        <ToggleSwitch
          checked={settings.pushNotifications ?? false}
          onChange={(val) => updateSetting('pushNotifications', val)}
          label={t('pushNotifications')}
          description={t('pushNotificationsDesc')}
        />
      </Section>

      {/* Seguridad */}
      <Section icon={Shield} title={t('security')}>
        <ToggleSwitch
          checked={settings.twoFactorAuth ?? false}
          onChange={(val) => {
            updateSetting('twoFactorAuth', val);
            showToast(
              val ? 'Autenticación de dos factores activada' : 'Autenticación de dos factores desactivada',
              'info'
            );
          }}
          label={t('twoFactor')}
          description={t('twoFactorDesc')}
        />
        <div className="pt-3 mt-3 border-t border-gray-100 dark:border-zinc-700  dark:border-gray-700">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('sessionManagement')}</p>
          <p className="text-xs text-gray-400 mb-3">{t('sessionManagementDesc')}</p>
          <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              {t('currentSession')}
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">{user?.email}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.userType}</p>
          </div>
        </div>
      </Section>

      {/* Versión */}
      <div className="flex items-center justify-center gap-2 pt-8 pb-12 cursor-pointer select-none hover:opacity-75 transition-opacity" onClick={() => setShowReleaseNotes(true)}>
        <img src="/ArachizLogoPNG.png" alt="Arachiz Logo" className="w-5 h-5 object-contain dark:invert" />
        <p className="text-gray-500 dark:text-gray-400 text-xs font-medium hover:text-gray-700 dark:hover:text-gray-300">Arachiz Version {VERSION}</p>
        <Info size={12} className="text-gray-400 dark:text-gray-500" />
      </div>

      <ReleaseNotesModal open={showReleaseNotes} onClose={() => setShowReleaseNotes(false)} />
    </div>
  );
}
