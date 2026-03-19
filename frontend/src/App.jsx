import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Instructor Pages
import InstructorDashboard from './pages/instructor/Dashboard';
import InstructorFichas from './pages/instructor/Fichas';
import InstructorAsistencia from './pages/instructor/Asistencia';
import InstructorExcusas from './pages/instructor/Excusas';

// Aprendiz Pages
import AprendizDashboard from './pages/aprendiz/Dashboard';
import AprendizAsistencia from './pages/aprendiz/Asistencia';
import AprendizExcusas from './pages/aprendiz/Excusas';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Instructor Routes */}
          <Route path="/instructor" element={<MainLayout allowedRoles={['instructor']} />}>
            <Route path="dashboard" element={<InstructorDashboard />} />
            <Route path="fichas" element={<InstructorFichas />} />
            <Route path="asistencia" element={<InstructorAsistencia />} />
            <Route path="excusas" element={<InstructorExcusas />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          {/* Aprendiz Routes */}
          <Route path="/aprendiz" element={<MainLayout allowedRoles={['aprendiz']} />}>
            <Route path="dashboard" element={<AprendizDashboard />} />
            <Route path="asistencia" element={<AprendizAsistencia />} />
            <Route path="excusas" element={<AprendizExcusas />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          {/* Fallback 404 */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
