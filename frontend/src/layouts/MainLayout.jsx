import React, { useContext, useState } from 'react';
import { Outlet, Navigate, NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import ConfirmDialog from '../components/ConfirmDialog';
import PerfilPropioModal from '../components/PerfilPropioModal';
import GlobalSearch from '../components/GlobalSearch';
import {
  LayoutDashboard, Users, BookOpen, Clock, FileText,
  LogOut, Menu, X, Calendar, ChevronRight, GraduationCap,
  Settings, Moon, Sun, FolderOpen, BarChart3, Trash2, Search
} from 'lucide-react';

const INSTRUCTOR_LINKS = [
  { to: '/instructor/dashboard', icon: LayoutDashboard, labelKey: 'dashboard' },
  { to: '/instructor/fichas', icon: Users, labelKey: 'fichas' },
  { to: '/instructor/materias', icon: BookOpen, labelKey: 'materias' },
  { to: '/instructor/horario', icon: Calendar, labelKey: 'horario' },
  { to: '/instructor/asistencia', icon: Clock, labelKey: 'asistencia' },
  { to: '/instructor/excusas', icon: FileText, labelKey: 'excusas' },
  { to: '/instructor/reportes', icon: BarChart3, labelKey: 'reportes' },
];

const ADMIN_LINKS = [
  { to: '/admin/dashboard', icon: LayoutDashboard, labelKey: 'dashboard' },
  { to: '/admin/fichas', icon: FolderOpen, labelKey: 'fichas' },
  { to: '/admin/usuarios', icon: Users, labelKey: 'usuarios' },
  { to: '/admin/horarios', icon: Search, labelKey: 'horarios' },
  { to: '/admin/excusas', icon: FileText, labelKey: 'excusas' },
  { to: '/admin/reportes', icon: BarChart3, labelKey: 'reportes' },
  { to: '/admin/papelera', icon: Trash2, labelKey: 'papelera' },
];

const APRENDIZ_LINKS = [
  { to: '/aprendiz/dashboard', icon: LayoutDashboard, labelKey: 'dashboard' },
  { to: '/aprendiz/fichas', icon: Users, labelKey: 'fichas' },
  { to: '/aprendiz/materias', icon: BookOpen, labelKey: 'materias' },
  { to: '/aprendiz/horario', icon: Calendar, labelKey: 'horario' },
  { to: '/aprendiz/asistencia', icon: Clock, labelKey: 'asistencia' },
  { to: '/aprendiz/excusas', icon: FileText, labelKey: 'excusas' },
];

function SidebarContent({ links, user, logout, onClose, configPath, onLogoutClick, onProfileClick }) {
  const { settings, toggleDark, t } = useSettings();

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
          <img src="/ArachizLogoPNG.png" alt="Arachiz" className="h-8 object-contain dark:invert transition-all duration-300" />
        </div>
        <div className="flex items-center gap-1">
          <button onClick={toggleDark} className="btn-icon text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
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
            <span>{t('sidebar', labelKey)}</span>
            <ChevronRight size={14} className="ml-auto opacity-30" />
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4285F4]"></div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.userType)) {
    return <Navigate to={`/${user?.userType}/dashboard`} replace />;
  }

  const links = user?.userType === 'instructor' ? INSTRUCTOR_LINKS : user?.userType === 'administrador' ? ADMIN_LINKS : APRENDIZ_LINKS;
  
  // Mapear el userType a la ruta correcta
  const routePrefix = user?.userType === 'administrador' ? 'admin' : user?.userType;
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
    // We need to use navigate from react-router-dom
    window.location.href = path; // Fallback since we don't have useNavigate here easily without adding hook
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
            <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shrink-0 shadow-sm transition-all duration-300">
              <button onClick={() => setSidebarOpen(true)} className="btn-icon text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <Menu size={20} />
              </button>
              <div className="flex items-center">
                <img src="/ArachizLogoPNG.png" alt="Arachiz" className="h-6 object-contain dark:invert transition-all duration-300" />
              </div>
              <button onClick={() => {
                // Dispatch a fake Ctrl+K to open GlobalSearch on mobile
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
              }} className="btn-icon text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <Search size={18} />
              </button>
            </header>


            <main className="flex-1 overflow-y-auto p-4 md:p-6 dark:bg-gray-950">
              <Outlet />
            </main>
          </div>
        </div>
      </div>

      {/* Buscador global — activo con Ctrl+K en toda la app */}
      <GlobalSearch />

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
    </>
  );
}
