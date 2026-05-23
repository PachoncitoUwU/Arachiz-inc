import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { SettingsProvider } from './context/SettingsContext';
import MainLayout from './layouts/MainLayout';
import ErrorBoundary from './components/ErrorBoundary';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import GoogleCallback from './pages/auth/GoogleCallback';
import Landing from './pages/Landing';
import AboutUs from './pages/AboutUs';

import InstructorDashboard  from './pages/instructor/Dashboard';
import InstructorFichas     from './pages/instructor/Fichas';
import InstructorFichaDetalle from './pages/instructor/FichaDetalle';
import InstructorMaterias   from './pages/instructor/Materias';
import InstructorHorario    from './pages/instructor/Horario';
import InstructorAsistencia from './pages/instructor/Asistencia';
import InstructorExcusas    from './pages/instructor/Excusas';

import AdminDashboard from './pages/admin/Dashboard';
import AdminFichas from './pages/admin/Fichas';
import AdminFichaDetalle from './pages/admin/FichaDetalle';
import AdminUsuarios from './pages/admin/Usuarios';
import AdminHorarios from './pages/admin/Horarios';
import AdminExcusas from './pages/admin/Excusas';
import AdminReportes from './pages/admin/Reportes';
import AdminPapelera from './pages/admin/Papelera';

import AprendizDashboard  from './pages/aprendiz/Dashboard';
import AprendizFichas     from './pages/aprendiz/Fichas';
import AprendizFichaDetalle from './pages/aprendiz/FichaDetalle';
import AprendizMaterias   from './pages/aprendiz/Materias';
import AprendizHorario    from './pages/aprendiz/Horario';
import AprendizAsistencia from './pages/aprendiz/Asistencia';
import AprendizExcusas    from './pages/aprendiz/Excusas';
import AprendizCompañeros from './pages/aprendiz/Compañeros';

import Configuracion from './pages/Configuracion';
import JoinFicha from './pages/JoinFicha';
import ScanQR from './pages/ScanQR';
import PaymentStatus from './pages/PaymentStatus';

export default function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <SettingsProvider>
        <ToastProvider>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/about-us" element={<AboutUs />} />
              <Route path="/login"    element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/auth/callback" element={<GoogleCallback />} />
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
                <Route path="configuracion"  element={<Configuracion />} />
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
                <Route path="papelera"       element={<AdminPapelera />} />
                <Route path="configuracion"  element={<Configuracion />} />
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
                <Route path="compañeros"     element={<AprendizCompañeros />} />
                <Route path="configuracion"  element={<Configuracion />} />
              </Route>

              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </SettingsProvider>
    </BrowserRouter>
    </ErrorBoundary>
  );
}
