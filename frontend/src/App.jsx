import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

import InstructorDashboard  from './pages/instructor/Dashboard';
import InstructorFichas     from './pages/instructor/Fichas';
import InstructorMaterias   from './pages/instructor/Materias';
import InstructorHorario    from './pages/instructor/Horario';
import InstructorAsistencia from './pages/instructor/Asistencia';
import InstructorExcusas    from './pages/instructor/Excusas';

import AprendizDashboard  from './pages/aprendiz/Dashboard';
import AprendizMaterias   from './pages/aprendiz/Materias';
import AprendizHorario    from './pages/aprendiz/Horario';
import AprendizAsistencia from './pages/aprendiz/Asistencia';
import AprendizExcusas    from './pages/aprendiz/Excusas';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/instructor" element={<MainLayout allowedRoles={['instructor']} />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard"  element={<InstructorDashboard />} />
            <Route path="fichas"     element={<InstructorFichas />} />
            <Route path="materias"   element={<InstructorMaterias />} />
            <Route path="horario"    element={<InstructorHorario />} />
            <Route path="asistencia" element={<InstructorAsistencia />} />
            <Route path="excusas"    element={<InstructorExcusas />} />
          </Route>

          <Route path="/aprendiz" element={<MainLayout allowedRoles={['aprendiz']} />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard"  element={<AprendizDashboard />} />
            <Route path="materias"   element={<AprendizMaterias />} />
            <Route path="horario"    element={<AprendizHorario />} />
            <Route path="asistencia" element={<AprendizAsistencia />} />
            <Route path="excusas"    element={<AprendizExcusas />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
