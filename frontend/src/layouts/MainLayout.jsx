import React, { useContext, useState, useEffect } from 'react';
import { Outlet, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useWorldCup } from '../context/WorldCupContext';
import ConfirmDialog from '../components/ConfirmDialog';
import PerfilPropioModal from '../components/PerfilPropioModal';
import ArachizAssist from '../components/ArachizAssist';
import {
  LayoutDashboard, Users, BookOpen, Clock, FileText,
  LogOut, Menu, X, Calendar, ChevronRight, GraduationCap,
  Settings, Moon, Sun, FolderOpen, BarChart3, Trash2, Search,
  Database, Save, Activity, ClipboardList, Bell, Ticket
} from 'lucide-react';

const INSTRUCTOR_LINKS = [
  { to: '/instructor/dashboard', icon: LayoutDashboard, labelKey: 'dashboard' },
  { to: '/instructor/fichas', icon: Users, labelKey: 'fichas' },
  { to: '/instructor/materias', icon: BookOpen, labelKey: 'materias' },
  { to: '/instructor/horario', icon: Calendar, labelKey: 'horario' },
  { to: '/instructor/asistencia', icon: Clock, labelKey: 'asistencia' },
  { to: '/instructor/excusas', icon: FileText, labelKey: 'excusas' },
  { to: '/instructor/eventos', icon: Ticket, labelKey: 'eventos' },
];

const ADMIN_LINKS = [
  { to: '/admin/dashboard', icon: LayoutDashboard, labelKey: 'dashboard' },
  { to: '/admin/fichas', icon: FolderOpen, labelKey: 'fichas' },
  { to: '/admin/usuarios', icon: Users, labelKey: 'usuarios' },
  { to: '/admin/horarios', icon: Search, labelKey: 'horarios' },
  { to: '/admin/excusas', icon: FileText, labelKey: 'excusas' },
  { to: '/admin/reportes', icon: BarChart3, labelKey: 'reportes' },
  { to: '/admin/eventos', icon: Ticket, labelKey: 'eventos' },
  { to: '/admin/papelera', icon: Trash2, labelKey: 'papelera' },
  { to: '/admin/auditoria', icon: ClipboardList, labelKey: 'auditoria' },
];

const APRENDIZ_LINKS = [
  { to: '/aprendiz/dashboard', icon: LayoutDashboard, labelKey: 'dashboard' },
  { to: '/aprendiz/fichas', icon: Users, labelKey: 'fichas' },
  { to: '/aprendiz/materias', icon: BookOpen, labelKey: 'materias' },
  { to: '/aprendiz/horario', icon: Calendar, labelKey: 'horario' },
  { to: '/aprendiz/asistencia', icon: Clock, labelKey: 'asistencia' },
  { to: '/aprendiz/excusas', icon: FileText, labelKey: 'excusas' },
];

const SUPER_USUARIO_LINKS = [
  { to: '/super-usuario/dashboard', icon: LayoutDashboard, labelKey: 'dashboard' },
  { to: '/super-usuario/usuarios', icon: Users, labelKey: 'usuarios' },
  { to: '/super-usuario/fichas', icon: FolderOpen, labelKey: 'fichas' },
  { to: '/super-usuario/materias', icon: BookOpen, labelKey: 'materias' },
  { to: '/super-usuario/database', icon: Database, labelKey: 'base_de_datos' },
  { to: '/super-usuario/excusas', icon: FileText, labelKey: 'excusas' },
  { to: '/super-usuario/backup', icon: Save, labelKey: 'backup' },
  { to: '/super-usuario/logs', icon: Activity, labelKey: 'logs' },
  { to: '/super-usuario/estadisticas', icon: BarChart3, labelKey: 'estadisticas' },
];

function SidebarContent({ links, user, logout, onClose, configPath, onLogoutClick, onProfileClick }) {
  const { settings, toggleDark, t } = useSettings();
  const { worldCupMode, toggleWorldCupMode } = useWorldCup();

  const [hasActiveSession, setHasActiveSession] = useState(() => {
    return localStorage.getItem('arachiz_active_session') === 'true';
  });

  useEffect(() => {
    const handleSessionChange = () => {
      setHasActiveSession(localStorage.getItem('arachiz_active_session') === 'true');
    };
    window.addEventListener('storage', handleSessionChange);
    window.addEventListener('arachiz_session_update', handleSessionChange);
    return () => {
      window.removeEventListener('storage', handleSessionChange);
      window.removeEventListener('arachiz_session_update', handleSessionChange);
    };
  }, []);

  const initials = user?.fullName
    ? user.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : user?.email?.[0]?.toUpperCase() || '?';

  const roleColor = user?.userType === 'instructor' ? 'bg-[#4285F4]' : user?.userType === 'administrador' ? 'bg-[#EA4335]' : 'bg-[#34A853]';
  const API_BASE = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
  const avatarSrc = user?.avatarUrl ? (user.avatarUrl.startsWith('http') || user.avatarUrl.startsWith('data:') ? user.avatarUrl : `${API_BASE}${user.avatarUrl}`) : null;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center">
          <img 
            src={worldCupMode ? "/Arachiz-worldcup.png" : "/ArachizLogoPNG.png"} 
            alt="Arachiz" 
            className="h-8 object-contain dark:invert transition-all duration-300" 
          />
        </div>
        <div className="flex items-center gap-1">
          {user?.userType === 'aprendiz' && (
            <NavLink to="/aprendiz/notificaciones" onClick={onClose} className="btn-icon relative text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors mr-1">
              <Bell size={18} />
              {window.__UNREAD_NOTIFICATIONS__ > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900" />
              )}
            </NavLink>
          )}
          <button 
            onClick={() => {
              // Si modo oscuro está activo, desactivarlo antes de activar modo mundialista
              if (settings.darkMode && !worldCupMode) {
                toggleDark();
              }
              toggleWorldCupMode();
            }} 
            className="btn-icon text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            title={worldCupMode ? "Desactivar modo mundialista" : "Activar modo mundialista"}
          >
            {worldCupMode ? (
              <span className="text-base">⚽</span>
            ) : (
              <span className="text-base opacity-50">⚽</span>
            )}
          </button>
          <button 
            onClick={() => {
              // Si modo mundialista está activo, desactivarlo antes de activar modo oscuro
              if (worldCupMode && !settings.darkMode) {
                toggleWorldCupMode();
              }
              toggleDark();
            }} 
            className="btn-icon text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {settings.darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          {onClose && (
            <button onClick={onClose} className="btn-icon text-gray-400 hover:bg-gray-100 md:hidden">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {links.map(({ to, icon: Icon, labelKey }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              isActive
                ? 'nav-link-active dark:bg-blue-900/30 dark:text-blue-400'
                : 'nav-link dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'
            }
          >
            <Icon size={18} />
            <span className="flex-1 text-left">{t('sidebar', labelKey)}</span>
            {labelKey === 'asistencia' && hasActiveSession && (
              <span className="relative flex h-2.5 w-2.5 mx-1" title="Sesión activa">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
            )}
            <ChevronRight size={14} className="opacity-30" />
          </NavLink>
        ))}
      </nav>

      {/* Bottom: config + user */}
      <div className="px-3 py-4 border-t border-gray-100 dark:border-gray-800 space-y-1">
        <NavLink
          to={configPath}
          onClick={onClose}
          className={({ isActive }) =>
            isActive
              ? 'nav-link-active dark:bg-blue-900/30 dark:text-blue-400'
              : 'nav-link dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'
          }
        >
          <Settings size={18} />
          <span>{t('sidebar', 'settings')}</span>
          <ChevronRight size={14} className="ml-auto opacity-30" />
        </NavLink>

        <button
          onClick={onProfileClick}
          className="w-full flex items-center gap-3 px-2 py-2 mt-1 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 hover:scale-[1.02] transition-all duration-200 cursor-pointer"
        >
          {avatarSrc ? (
            <img src={avatarSrc} alt="avatar" className={`w-9 h-9 rounded-xl object-cover shrink-0`} />
          ) : (
            <div className={`w-9 h-9 rounded-xl ${roleColor} text-white flex items-center justify-center text-sm font-bold shrink-0`}>
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1 text-left">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{user?.fullName || user?.email}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.userType}</p>
          </div>
        </button>

        <button
          onClick={onLogoutClick}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium"
        >
          <LogOut size={16} />
          {t('sidebar', 'logout')}
        </button>
      </div>
    </div>
  );
}

export default function MainLayout({ allowedRoles }) {
  const { user, isAuthenticated, logout, updateUser, loading } = useContext(AuthContext);
  const { settings } = useSettings();
  const { worldCupMode } = useWorldCup();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.id && user?.userType === 'aprendiz') {
      import('../services/api').then(({ default: fetchApi }) => {
        fetchApi('/notifications').then(res => {
          setUnreadNotifications(res.unreadCount || 0);
          window.__UNREAD_NOTIFICATIONS__ = res.unreadCount || 0;
        }).catch(() => {});
      });
    }
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4285F4]"></div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  // Mapear el userType a la ruta correcta
  let routePrefix = user?.userType;
  if (user?.userType === 'administrador') routePrefix = 'admin';
  if (user?.userType === 'super_usuario') routePrefix = 'super-usuario';

  if (allowedRoles && !allowedRoles.includes(user?.userType)) {
    return <Navigate to={`/${routePrefix}/dashboard`} replace />;
  }

  let links = APRENDIZ_LINKS;
  if (user?.userType === 'instructor') links = INSTRUCTOR_LINKS;
  if (user?.userType === 'administrador') links = ADMIN_LINKS;
  if (user?.userType === 'super_usuario') links = SUPER_USUARIO_LINKS;
  
  const configPath = `/${routePrefix}/configuracion`;

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
  };

  const handleProfileClick = () => {
    // Navigate to dedicated profile page instead of modal
    const path = `/${routePrefix}/perfil`;
    navigate(path);
    setSidebarOpen(false);
  };

  return (
    <>
      <div className="flex h-screen overflow-hidden">
        <div className="flex h-full w-full bg-[#F5F5F5] dark:bg-gray-950">
          {/* Desktop Sidebar */}
          <aside className="hidden md:flex w-60 flex-col shrink-0">
            <SidebarContent links={links} user={user} logout={logout} configPath={configPath} onLogoutClick={handleLogoutClick} onProfileClick={handleProfileClick} />
          </aside>

          {/* Mobile Sidebar Overlay */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-40 md:hidden">
              <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
              <aside className="absolute left-0 top-0 h-full w-64 shadow-xl z-50">
                <SidebarContent links={links} user={user} logout={logout} onClose={() => setSidebarOpen(false)} configPath={configPath} onLogoutClick={handleLogoutClick} onProfileClick={handleProfileClick} />
              </aside>
            </div>
          )}

          {/* Main */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Mobile topbar */}
            <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shrink-0 shadow-sm transition-all duration-300 relative z-10">
              <button onClick={() => setSidebarOpen(true)} className="btn-icon text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <Menu size={20} />
              </button>
              <div className="flex items-center">
                <img 
                  src={worldCupMode ? "/Arachiz-worldcup.png" : "/ArachizLogoPNG.png"} 
                  alt="Arachiz" 
                  className="h-6 object-contain dark:invert transition-all duration-300" 
                />
              </div>
              <div className="flex items-center gap-1">
                {user?.userType === 'aprendiz' && (
                  <NavLink to="/aprendiz/notificaciones" className="btn-icon relative text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors mr-1">
                    <Bell size={20} />
                    {unreadNotifications > 0 && (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900" />
                    )}
                  </NavLink>
                )}
                <div className="w-4" />
              </div>
            </header>


            <main className="flex-1 overflow-y-auto p-4 md:p-6 dark:bg-gray-950">
              <Outlet />
            </main>
          </div>
        </div>
      </div>

      {/* Modal de confirmación para cerrar sesión */}
      <ConfirmDialog
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
        title="¿Cerrar sesión?"
        message="¿Estás seguro de que deseas cerrar sesión?"
        confirmText="Cerrar sesión"
        cancelText="Cancelar"
        danger={true}
      />
      <ArachizAssist />
    </>
  );
}
