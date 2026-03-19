import React, { useContext } from 'react';
import { Outlet, Navigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogOut, Home, Users, BookOpen, Calendar, Clock, FileText } from 'lucide-react';

export default function MainLayout({ allowedRoles }) {
  const { user, isAuthenticated, logout } = useContext(AuthContext);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.userType)) {
    // Redirect to their own dashboard if they try to access a route for another role
    return <Navigate to={`/${user.userType}/dashboard`} replace />;
  }

  const instructorLinks = [
    { to: '/instructor/dashboard', icon: <Home size={20} />, label: 'Dashboard' },
    { to: '/instructor/fichas', icon: <Users size={20} />, label: 'Fichas' },
    { to: '/instructor/asistencia', icon: <Clock size={20} />, label: 'Asistencia' },
    { to: '/instructor/excusas', icon: <FileText size={20} />, label: 'Excusas' },
  ];

  const aprendizLinks = [
    { to: '/aprendiz/dashboard', icon: <Home size={20} />, label: 'Dashboard' },
    { to: '/aprendiz/asistencia', icon: <Clock size={20} />, label: 'Asistencia' },
    { to: '/aprendiz/excusas', icon: <FileText size={20} />, label: 'Mis Excusas' },
  ];

  const navLinks = user.userType === 'instructor' ? instructorLinks : aprendizLinks;

  return (
    <div className="flex h-screen bg-gray-50 flex-col md:flex-row">
      {/* Sidebar (Desktop) / Bottom Nav (Mobile - basic fallback for now) */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex flex-col justify-between hidden md:flex">
        <div>
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-google-blue flex items-center gap-2">
              <BookOpen className="text-google-yellow" /> Arachiz
            </h1>
            <p className="text-sm text-gray-500 mt-1 capitalize">{user.userType}</p>
          </div>
          <nav className="p-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-google-blue hover:text-white rounded transition-colors"
                // active styles could be handled via NavLink in React Router
              >
                {link.icon}
                <span className="font-medium">{link.label}</span>
              </Link>
            ))}
          </nav>
        </div>
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-google-green text-white flex justify-center items-center font-bold">
              {user.email[0].toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="font-medium text-sm truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 w-full px-4 py-2 text-google-red border border-google-red rounded hover:bg-google-red hover:text-white transition-colors"
          >
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header (Visible only on small screens) */}
        <header className="md:hidden bg-white p-4 border-b border-gray-200 flex justify-between items-center">
          <h1 className="text-xl font-bold text-google-blue">Arachiz</h1>
          <button onClick={logout} className="text-google-red"><LogOut size={20}/></button>
        </header>

        {/* Dynamic Mobile Nav (Visible only on small screens) */}
        <nav className="md:hidden bg-white border-b border-gray-200 flex overflow-x-auto">
           {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="flex flex-col items-center justify-center p-3 text-gray-700 min-w-[80px]"
              >
                {link.icon}
                <span className="text-xs mt-1">{link.label}</span>
              </Link>
            ))}
        </nav>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
