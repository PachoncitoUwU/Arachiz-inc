import React, { lazy as reactLazy, Suspense } from 'react';
// Push 70: Enrolamiento biométrico de huellas, reposo absoluto de hardware BLE/USB, indicador de sesión activa y optimizaciones de código QR

// Wrapper para evitar errores de chunks perdidos en Vercel (Failed to fetch dynamically imported module)
const lazy = (componentImport) => {
  let retries = 0;
  const load = async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem('page-has-been-force-refreshed') || 'false'
    );
    try {
      const component = await componentImport();
      window.sessionStorage.setItem('page-has-been-force-refreshed', 'false');
      return component;
    } catch (error) {
      if (retries < 2) {
        retries++;
        // Esperar brevemente antes de reintentar
        await new Promise(res => setTimeout(res, 500));
        return load();
      }
      if (!pageHasAlreadyBeenForceRefreshed) {
        window.sessionStorage.setItem('page-has-been-force-refreshed', 'true');
        window.location.reload();
        return { default: () => null };
      }
      // Si ya se recargó y sigue fallando, renderizar fallback visual
      console.error('Error loading component after retries:', error);
      return { default: () => <div className="p-8 text-center text-red-600">Error al cargar la página. Por favor, recarga.</div> };
    }
  };
  return reactLazy(load);
};
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { SettingsProvider } from './context/SettingsContext';
import { WorldCupProvider } from './context/WorldCupContext';
import MainLayout from './layouts/MainLayout';
import ErrorBoundary from './components/ErrorBoundary';
import { Toaster } from 'react-hot-toast';

// ── Páginas críticas (carga inmediata — siempre necesarias) ───────────────────
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import GoogleCallback from './pages/auth/GoogleCallback';
import CompleteProfile from './pages/auth/CompleteProfile';
import Landing from './pages/Landing';

// ── Páginas lazy (se cargan solo cuando el usuario navega a ellas) ────────────
const AboutUs      = lazy(() => import('./pages/AboutUs'));
const Slides       = lazy(() => import('./pages/Slides'));
const Configuracion = lazy(() => import('./pages/Configuracion'));
const JoinFicha    = lazy(() => import('./pages/JoinFicha'));
const ScanQR       = lazy(() => import('./pages/ScanQR'));
const PaymentStatus = lazy(() => import('./pages/PaymentStatus'));
const Perfil       = lazy(() => import('./pages/Perfil'));

// ── Instructor ─────────────────────────────────────────────────────────────────
const InstructorDashboard   = lazy(() => import('./pages/instructor/Dashboard'));
const InstructorFichas      = lazy(() => import('./pages/instructor/Fichas'));
const InstructorFichaDetalle = lazy(() => import('./pages/instructor/FichaDetalle'));
const InstructorMaterias    = lazy(() => import('./pages/instructor/Materias'));
const InstructorHorario     = lazy(() => import('./pages/instructor/Horario'));
const InstructorAsistencia  = lazy(() => import('./pages/instructor/Asistencia'));
const InstructorExcusas     = lazy(() => import('./pages/instructor/Excusas'));
const InstructorEventos     = lazy(() => import('./pages/instructor/Eventos'));

// ── Admin ──────────────────────────────────────────────────────────────────────
const AdminDashboard     = lazy(() => import('./pages/admin/Dashboard'));
const AdminFichas        = lazy(() => import('./pages/admin/Fichas'));
const AdminFichaDetalle  = lazy(() => import('./pages/admin/FichaDetalle'));
const AdminUsuarios      = lazy(() => import('./pages/admin/Usuarios'));
const AdminHorarios      = lazy(() => import('./pages/admin/Horarios'));
const AdminExcusas       = lazy(() => import('./pages/admin/Excusas'));
const AdminReportes      = lazy(() => import('./pages/admin/Reportes'));
const AdminEventos       = lazy(() => import('./pages/admin/Eventos'));
const AdminPapelera      = lazy(() => import('./pages/admin/Papelera'));
const AdminConfiguracion = lazy(() => import('./pages/admin/Configuracion'));
const AdminAuditoria     = lazy(() => import('./pages/admin/Auditoria'));

// ── Super Usuario ──────────────────────────────────────────────────────────────
const SuperDashboard    = lazy(() => import('./pages/superuser/Dashboard'));
const SuperUsuarios     = lazy(() => import('./pages/superuser/Usuarios'));
const SuperFichas       = lazy(() => import('./pages/superuser/Fichas'));
const SuperMaterias     = lazy(() => import('./pages/superuser/Materias'));
const SuperDatabase     = lazy(() => import('./pages/superuser/Database'));
const SuperExcusas      = lazy(() => import('./pages/superuser/Excusas'));
const SuperBackup       = lazy(() => import('./pages/superuser/Backup'));
const SuperLogs         = lazy(() => import('./pages/superuser/Logs'));
const SuperEstadisticas = lazy(() => import('./pages/superuser/Estadisticas'));

// ── Aprendiz ───────────────────────────────────────────────────────────────────
const AprendizDashboard   = lazy(() => import('./pages/aprendiz/Dashboard'));
const AprendizFichas      = lazy(() => import('./pages/aprendiz/Fichas'));
const AprendizFichaDetalle = lazy(() => import('./pages/aprendiz/FichaDetalle'));
const AprendizMaterias    = lazy(() => import('./pages/aprendiz/Materias'));
const AprendizHorario     = lazy(() => import('./pages/aprendiz/Horario'));
const AprendizAsistencia  = lazy(() => import('./pages/aprendiz/Asistencia'));
const AprendizExcusas     = lazy(() => import('./pages/aprendiz/Excusas'));
const Notificaciones      = lazy(() => import('./pages/aprendiz/Notificaciones'));
const AprendizCompañeros  = lazy(() => import('./pages/aprendiz/Compañeros'));

// ── Spinner mínimo para Suspense ───────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Toaster position="top-right" />
      {/* Indicador Global del Número del Push */}
      <div className="fixed top-2 left-2 z-[9999] pointer-events-none">
        <span className="px-2.5 py-1 bg-[#4285F4] text-white rounded-md font-extrabold text-xs shadow-xl border border-white/20">
          70
        </span>
      </div>
      <BrowserRouter>
        <WorldCupProvider>
        <SettingsProvider>
        <ToastProvider>
          <AuthProvider>
            <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/about" element={<AboutUs />} />
              {/* Ruta secreta — no aparece en menús */}
              <Route path="/arachiz-slides-2025" element={<Slides />} />
              <Route path="/login"    element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/auth/callback" element={<GoogleCallback />} />
              <Route path="/complete-profile" element={<CompleteProfile />} />
              <Route path="/unirse/:code" element={<JoinFicha />} />
              <Route path="/scan-qr" element={<ScanQR />} />
              <Route path="/payment-status" element={<PaymentStatus />} />

              <Route path="/instructor" element={<MainLayout allowedRoles={['instructor']} />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard"      element={<InstructorDashboard />} />
                <Route path="fichas"         element={<InstructorFichas />} />
                <Route path="fichas/:id"     element={<InstructorFichaDetalle />} />
                <Route path="materias"       element={<InstructorMaterias />} />
                <Route path="horario"        element={<InstructorHorario />} />
                <Route path="asistencia"     element={<InstructorAsistencia />} />
                <Route path="excusas"        element={<InstructorExcusas />} />
                <Route path="eventos"        element={<InstructorEventos />} />
                <Route path="configuracion"  element={<Configuracion />} />
                <Route path="perfil"         element={<Perfil />} />
              </Route>

              <Route path="/admin" element={<MainLayout allowedRoles={['administrador']} />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard"      element={<AdminDashboard />} />
                <Route path="fichas"         element={<AdminFichas />} />
                <Route path="fichas/:id"     element={<AdminFichaDetalle />} />
                <Route path="usuarios"       element={<AdminUsuarios />} />
                <Route path="horarios"       element={<AdminHorarios />} />
                <Route path="excusas"        element={<AdminExcusas />} />
                <Route path="reportes"       element={<AdminReportes />} />
                <Route path="eventos"        element={<AdminEventos />} />
                <Route path="papelera"       element={<AdminPapelera />} />
                <Route path="auditoria"      element={<AdminAuditoria />} />
                <Route path="configuracion"  element={<AdminConfiguracion />} />
                <Route path="perfil"         element={<Perfil />} />
              </Route>

              <Route path="/aprendiz" element={<MainLayout allowedRoles={['aprendiz']} />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard"      element={<AprendizDashboard />} />
                <Route path="fichas"         element={<AprendizFichas />} />
                <Route path="fichas/:id"     element={<AprendizFichaDetalle />} />
                <Route path="materias"       element={<AprendizMaterias />} />
                <Route path="horario"        element={<AprendizHorario />} />
                <Route path="asistencia"     element={<AprendizAsistencia />} />
                <Route path="excusas"        element={<AprendizExcusas />} />
                <Route path="notificaciones" element={<Notificaciones />} />
                <Route path="compañeros"     element={<AprendizCompañeros />} />
                <Route path="configuracion"  element={<Configuracion />} />
                <Route path="perfil"         element={<Perfil />} />
              </Route>

              <Route path="/super-usuario" element={<MainLayout allowedRoles={['super_usuario']} />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<SuperDashboard />} />
                <Route path="usuarios" element={<SuperUsuarios />} />
                <Route path="fichas" element={<SuperFichas />} />
                <Route path="materias" element={<SuperMaterias />} />
                <Route path="database" element={<SuperDatabase />} />
                <Route path="excusas" element={<SuperExcusas />} />
                <Route path="backup" element={<SuperBackup />} />
                <Route path="logs" element={<SuperLogs />} />
                <Route path="estadisticas" element={<SuperEstadisticas />} />
                <Route path="configuracion" element={<Configuracion />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </Suspense>
          </AuthProvider>
        </ToastProvider>
      </SettingsProvider>
      </WorldCupProvider>
    </BrowserRouter>
    </ErrorBoundary>
  );
}
