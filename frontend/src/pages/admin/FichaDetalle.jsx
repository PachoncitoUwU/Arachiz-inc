import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import fetchApi from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import EnrollModal from '../../components/EnrollModal';
import AprendizPerfilModal from '../../components/AprendizPerfilModal';
import MateriaInfoModal from '../../components/MateriaInfoModal';
import ConfirmModal from '../../components/ConfirmModal';
import {
  ArrowLeft, Users, BookOpen, Calendar, Copy, RefreshCw, Check, 
  Download, Loader, Edit2, UserMinus, Fingerprint, Link, Clock, Plus, Star
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

// Helper para resolver avatarUrl
const resolveAvatar = (url) => {
  if (!url) return null;
  if (url.startsWith('data:') || url.startsWith('http') || url.startsWith('blob:')) return url;
  return `${API_BASE}${url}`;
};

export default function FichaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  
  const [ficha, setFicha] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [modalMateria, setModalMateria] = useState(false);
  const [formMateria, setFormMateria] = useState({ nombre: '', tipo: 'Técnica' });
  const [savingMateria, setSavingMateria] = useState(false);
  const [errorMateria, setErrorMateria] = useState('');
  const [modalEdit, setModalEdit] = useState(false);
  const [formEdit, setFormEdit] = useState({ numero: '', nombre: '', nivel: '', centro: '', jornada: '', region: '', duracion: '' });
  const [savingEdit, setSavingEdit] = useState(false);
  const [errorEdit, setErrorEdit] = useState('');
  const [modalEnroll, setModalEnroll] = useState(false);
  const [selectedAprendiz, setSelectedAprendiz] = useState(null);
  const [modalPerfil, setModalPerfil] = useState(false);
  const [modalMateriaInfo, setModalMateriaInfo] = useState(false);
  const [selectedMateria, setSelectedMateria] = useState(null);
  
  // Estados para modal de instructor
  const [modalInstructorPerfil, setModalInstructorPerfil] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  
  // Estados para pestañas y búsqueda
  const [activeTab, setActiveTab] = useState('aprendices'); // 'aprendices' | 'materias'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTipo, setFilterTipo] = useState('all'); // 'all' | 'Técnica' | 'Transversal'
  const [filterInstructor, setFilterInstructor] = useState('all'); // 'all' | instructorId
  
  // Estados para modales de confirmación
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, action: null, data: null });
  
  // Estado para fichas ancladas
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    loadFicha();
  }, [id]);
  
  useEffect(() => {
    // Cargar estado de anclado desde localStorage
    if (ficha && user) {
      const pinnedFichas = JSON.parse(localStorage.getItem(`pinnedFichas_${user.id}`) || '[]');
      setIsPinned(pinnedFichas.includes(ficha.id));
    }
  }, [ficha, user]);

  const loadFicha = async () => {
    try {
      setLoading(true);
      const data = await fetchApi(`/admin/fichas/${id}`);
      setFicha(data.ficha);
    } catch (err) {
      console.error('Error cargando ficha:', err);
      showToast(err.message || 'Error al cargar la ficha', 'error');
      // Solo navegar si no es un error de red temporal
      if (err.message && !err.message.includes('Failed to fetch')) {
        setTimeout(() => navigate('/admin/fichas'), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(ficha.code);
    setCopied(true);
    showToast('Código copiado', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLink = () => {
    const link = `${window.location.origin}/unirse/${ficha.code}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    showToast(`Link copiado: ${link}`, 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };
  
  const togglePin = () => {
    const pinnedFichas = JSON.parse(localStorage.getItem(`pinnedFichas_${user.id}`) || '[]');
    let newPinnedFichas;
    
    if (isPinned) {
      // Desanclar
      newPinnedFichas = pinnedFichas.filter(fichaId => fichaId !== ficha.id);
      showToast('Ficha desanclada', 'success');
    } else {
      // Anclar
      newPinnedFichas = [...pinnedFichas, ficha.id];
      showToast('Ficha anclada', 'success');
    }
    
    localStorage.setItem(`pinnedFichas_${user.id}`, JSON.stringify(newPinnedFichas));
    setIsPinned(!isPinned);
  };

  const handleRegenerate = async () => {
    setConfirmModal({
      isOpen: true,
      action: 'regenerate',
      data: null
    });
  };

  const confirmRegenerate = async () => {
    try {
      await fetchApi(`/admin/fichas/${id}/regenerate-code`, { method: 'POST' });
      showToast('Código regenerado', 'success');
      loadFicha();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/export/ficha/${id}/info`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Ficha${ficha.numero}_Info_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Información de ficha exportada exitosamente', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleRemoveAprendiz = async (aprendizId) => {
    setConfirmModal({
      isOpen: true,
      action: 'removeAprendiz',
      data: aprendizId
    });
  };

  const confirmRemoveAprendiz = async () => {
    try {
      await fetchApi(`/admin/fichas/${id}/aprendices/${confirmModal.data}`, { method: 'DELETE' });
      showToast('Aprendiz enviado a la papelera', 'success');
      setModalPerfil(false); // Cerrar modal de perfil
      loadFicha(); // Recargar vista
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleRemoveInstructor = async (instructorId, instructorName) => {
    setConfirmModal({
      isOpen: true,
      action: 'removeInstructor',
      data: { instructorId, instructorName }
    });
  };

  const confirmRemoveInstructor = async () => {
    try {
      await fetchApi(`/admin/fichas/${id}/instructores/${confirmModal.data.instructorId}`, { method: 'DELETE' });
      showToast('Instructor enviado a la papelera', 'success');
      loadFicha(); // Recargar vista
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const confirmSalirFicha = async () => {
    try {
      await fetchApi(`/admin/fichas/${id}/salir`, { method: 'POST' });
      showToast('Has salido de la ficha exitosamente', 'success');
      setTimeout(() => navigate('/admin/fichas'), 1500);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const confirmEliminarFicha = async () => {
    try {
      await fetchApi(`/admin/fichas/${id}`, { method: 'DELETE' });
      showToast('Ficha eliminada exitosamente', 'success');
      setTimeout(() => navigate('/admin/fichas'), 1500);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCreateMateria = async (e) => {
    e.preventDefault();
    setErrorMateria('');
    setSavingMateria(true);
    try {
      await fetchApi('/materias', {
        method: 'POST',
        body: JSON.stringify({
          fichaId: id,
          nombre: formMateria.nombre,
          tipo: formMateria.tipo
        })
      });
      setModalMateria(false);
      setFormMateria({ nombre: '', tipo: 'Técnica' });
      showToast('Materia creada exitosamente', 'success');
      loadFicha();
    } catch (err) {
      setErrorMateria(err.message);
    } finally {
      setSavingMateria(false);
    }
  };

  const handleOpenEdit = () => {
    setFormEdit({
      numero: ficha.numero,
      nombre: ficha.nombre || '',
      nivel: ficha.nivel,
      centro: ficha.centro,
      jornada: ficha.jornada,
      region: ficha.region || '',
      duracion: ficha.duracion || ''
    });
    setModalEdit(true);
    setErrorEdit('');
  };

  const handleEditFicha = async (e) => {
    e.preventDefault();
    setErrorEdit('');
    setSavingEdit(true);
    try {
      await fetchApi(`/admin/fichas/${id}`, {
        method: 'PUT',
        body: JSON.stringify(formEdit)
      });
      setModalEdit(false);
      showToast('Ficha actualizada exitosamente', 'success');
      loadFicha();
    } catch (err) {
      setErrorEdit(err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleOpenEnroll = (aprendiz) => {
    setSelectedAprendiz(aprendiz);
    setModalEnroll(true);
  };

  const handleCloseEnroll = () => {
    setModalEnroll(false);
    setSelectedAprendiz(null);
    loadFicha(); // Recargar para actualizar los datos del aprendiz
  };

  const handleOpenPerfil = (aprendiz) => {
    setSelectedAprendiz(aprendiz);
    setModalPerfil(true);
  };

  const handleClosePerfil = () => {
    setModalPerfil(false);
    setSelectedAprendiz(null);
  };

  const handleOpenInstructorPerfil = (instructor) => {
    setSelectedInstructor(instructor);
    setModalInstructorPerfil(true);
  };

  const handleCloseInstructorPerfil = () => {
    setModalInstructorPerfil(false);
    setSelectedInstructor(null);
  };

  const handleDesignarLider = async (instructorId) => {
    // Cerrar el modal de perfil primero
    setModalInstructorPerfil(false);
    
    // Pequeño delay para que se cierre el modal antes de abrir el de confirmación
    setTimeout(() => {
      setConfirmModal({
        isOpen: true,
        action: 'designarLider',
        data: instructorId
      });
    }, 100);
  };

  const confirmDesignarLider = async () => {
    try {
      await fetchApi(`/admin/fichas/${id}/cambiar-lider`, {
        method: 'PUT',
        body: JSON.stringify({ nuevoLiderId: confirmModal.data })
      });
      showToast('Líder designado exitosamente', 'success');
      loadFicha();
      // No necesitamos cerrar el modal de instructor porque ya está cerrado
    } catch (err) {
      showToast(err.message || 'Error al designar líder', 'error');
    }
  };

  const handleBiometricUpdate = async () => {
    // Recargar solo los datos de la ficha sin mostrar loading completo
    try {
      const data = await fetchApi(`/admin/fichas/${id}`);
      setFicha(data.ficha);
      
      // Actualizar el aprendiz seleccionado si existe
      if (selectedAprendiz) {
        const updatedAprendiz = data.ficha.aprendices.find(a => a.id === selectedAprendiz.id);
        if (updatedAprendiz) {
          setSelectedAprendiz(updatedAprendiz);
        }
      }
    } catch (err) {
      console.error('Error al actualizar datos:', err);
    }
  };

  const handleOpenMateriaInfo = (materia) => {
    setSelectedMateria(materia);
    setModalMateriaInfo(true);
  };

  const handleCloseMateriaInfo = () => {
    setModalMateriaInfo(false);
    setSelectedMateria(null);
  };

  const handleMateriaUpdate = async () => {
    // Recargar solo los datos sin mostrar loading completo
    try {
      const data = await fetchApi(`/admin/fichas/${id}`);
      setFicha(data.ficha);
    } catch (err) {
      console.error('Error al actualizar datos:', err);
    }
  };

  const handleMateriaDelete = async () => {
    // Recargar solo los datos sin mostrar loading completo
    try {
      const data = await fetchApi(`/admin/fichas/${id}`);
      setFicha(data.ficha);
    } catch (err) {
      console.error('Error al actualizar datos:', err);
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/instructor/fichas')} className="btn-icon text-gray-400 hover:bg-gray-100">
            <ArrowLeft size={20} />
          </button>
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
            <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-32 animate-pulse" />
          </div>
        </div>
        
        {/* Estadísticas horizontales skeleton */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="card animate-pulse">
              <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded" />
            </div>
          ))}
        </div>

        {/* Información General + Código skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 card animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
            <div className="space-y-3">
              <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded" />
              <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded" />
            </div>
          </div>
          <div className="card animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-4" />
            <div className="space-y-3">
              <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded" />
              <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded" />
            </div>
          </div>
        </div>

        {/* Tarjeta con pestañas skeleton */}
        <div className="card animate-pulse mb-6">
          <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded w-1/2 mb-4" />
          <div className="space-y-3">
            <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded" />
            <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded" />
            <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded" />
          </div>
        </div>

        {/* Instructores skeleton */}
        <div className="card animate-pulse mb-6">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl" />
            ))}
          </div>
        </div>

        {/* Horario skeleton */}
        <div className="card animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!ficha) return null;

  const isAdmin = user?.userType === 'administrador';
  const isInstructor = ficha.instructores?.some(fi => fi.instructorId === user?.id);
  const COLOR = '#4285F4'; // Color principal azul

  // Colores para materias en el horario
  const MATERIA_COLORS = [
    '#4285F4', // Azul
    '#34A853', // Verde
    '#FBBC05', // Amarillo
    '#EA4335', // Rojo
    '#8b5cf6', // Púrpura
    '#06b6d4', // Cyan
    '#f97316', // Naranja
    '#ec4899', // Rosa
  ];

  // Filtrar aprendices
  const filteredAprendices = (ficha.aprendices || []).filter(aprendiz => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      aprendiz.fullName.toLowerCase().includes(query) ||
      aprendiz.email.toLowerCase().includes(query) ||
      aprendiz.document.toLowerCase().includes(query)
    );
  }).sort((a, b) => a.fullName.localeCompare(b.fullName));

  // Filtrar materias
  const filteredMaterias = (ficha.materias || []).filter(materia => {
    let matches = true;
    
    // Filtro de búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      matches = matches && materia.nombre.toLowerCase().includes(query);
    }
    
    // Filtro de tipo
    if (filterTipo !== 'all') {
      matches = matches && materia.tipo === filterTipo;
    }
    
    // Filtro de instructor
    if (filterInstructor !== 'all') {
      matches = matches && materia.instructorId === filterInstructor;
    }
    
    return matches;
  });

  // Obtener instructores únicos para el filtro
  const uniqueInstructors = [...new Set((ficha.materias || []).map(m => m.instructorId))]
    .map(id => {
      const materia = ficha.materias.find(m => m.instructorId === id);
      return {
        id,
        name: materia?.instructor?.fullName || 'Desconocido'
      };
    });

  // Agrupar horarios por día y filtrar días sin materias
  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const horariosPorDia = diasSemana.map(dia => {
    const horariosDelDia = (ficha.horarios || []).filter(h => h.dia === dia);
    return {
      dia,
      horarios: horariosDelDia
    };
  }).filter(d => d.horarios.length > 0); // Solo días con materias

  // Calcular altura máxima de materias por día
  const maxMateriasEnUnDia = Math.max(...horariosPorDia.map(d => d.horarios.length), 1);

  return (
    <div className="animate-fade-in">
      {/* Header con botón de regreso */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/admin/fichas')} 
            className="btn-icon text-gray-400 hover:bg-gray-100"
            title="Volver a fichas"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ficha {ficha.numero}</h1>
              <button
                onClick={togglePin}
                className={`p-1.5 rounded-lg transition-all ${
                  isPinned 
                    ? 'text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20' 
                    : 'text-gray-400 hover:text-yellow-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title={isPinned ? 'Desanclar ficha' : 'Anclar ficha'}
              >
                <Star size={20} fill={isPinned ? 'currentColor' : 'none'} />
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {ficha.nombre || ficha.nivel}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button 
              onClick={() => setConfirmModal({ isOpen: true, action: 'eliminarFicha', data: null })}
              className="btn-secondary flex items-center gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200"
              title="Eliminar ficha permanentemente"
            >
              <UserMinus size={16} />
              Eliminar Ficha
            </button>
          )}
          <button 
            onClick={() => setConfirmModal({ isOpen: true, action: 'salirFicha', data: null })}
            className="btn-secondary flex items-center gap-2"
            title="Salir de esta ficha"
          >
            <ArrowLeft size={16} />
            Salir de Ficha
          </button>
          <button 
            onClick={handleExport} 
            disabled={exporting} 
            className="btn-secondary flex items-center gap-2"
            title="Exportar información completa de la ficha"
          >
            {exporting ? <Loader size={16} className="animate-spin" /> : <Download size={16} />}
            Exportar Info
          </button>
        </div>
      </div>

      {/* Estadísticas horizontales */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide mb-1">
                Instructores
              </p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {ficha.instructores?.length || 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
              <Users size={24} className="text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide mb-1">
                Aprendices
              </p>
              <p className="text-2xl font-bold text-[#4285F4]">
                {ficha.aprendices?.length || 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <Users size={24} className="text-[#4285F4]" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide mb-1">
                Materias
              </p>
              <p className="text-2xl font-bold text-[#34A853]">
                {ficha.materias?.length || 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
              <BookOpen size={24} className="text-[#34A853]" />
            </div>
          </div>
        </div>
      </div>
      {/* Información General + Código */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Información General (2 columnas) */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Información General</h2>
            {isAdmin && (
              <button onClick={handleOpenEdit} className="btn-icon text-gray-400 hover:bg-gray-100" title="Editar">
                <Edit2 size={16} />
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-0.5">Número</p>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{ficha.numero}</p>
            </div>
            <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-0.5">Nivel</p>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{ficha.nivel}</p>
            </div>
            <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-0.5">Jornada</p>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{ficha.jornada}</p>
            </div>
            <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg col-span-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-0.5">Programa</p>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{ficha.nombre || 'Sin nombre'}</p>
            </div>
            <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg col-span-2">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-0.5">Centro</p>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{ficha.centro}</p>
            </div>
            <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-0.5">Duración</p>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {ficha.duracion ? `${ficha.duracion}m` : 'N/A'}
              </p>
            </div>
            {ficha.region && (
              <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg col-span-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-0.5">Región</p>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{ficha.region}</p>
              </div>
            )}
          </div>
        </div>

        {/* Código de invitación (1 columna) */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Código de Invitación
          </h3>
          
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl mb-3">
            <p className="text-center font-mono font-bold text-xl text-[#4285F4] tracking-widest select-all">
              {ficha.code}
            </p>
          </div>

          <div className="space-y-2">
            <button 
              onClick={copyCode} 
              className="btn-secondary w-full flex items-center justify-center gap-2 text-sm py-2"
            >
              {copied ? <Check size={14} className="text-[#34A853]" /> : <Copy size={14} />}
              {copied ? 'Copiado' : 'Copiar código'}
            </button>
            
            <button 
              onClick={copyLink} 
              className="btn-secondary w-full flex items-center justify-center gap-2 text-sm py-2"
            >
              {copiedLink ? <Check size={14} className="text-[#34A853]" /> : <Link size={14} />}
              {copiedLink ? 'Link copiado' : 'Copiar link'}
            </button>

            {isAdmin && (
              <button 
                onClick={handleRegenerate} 
                className="btn-secondary w-full flex items-center justify-center gap-2 text-sm py-2 text-orange-600 hover:bg-orange-50"
              >
                <RefreshCw size={14} />
                Regenerar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tarjeta con pestañas: Aprendices y Materias */}
      <div className="card mb-6">
        {/* Tabs */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 mb-4">
          <div className="flex gap-1">
            <button
              onClick={() => {
                setActiveTab('aprendices');
                setSearchQuery('');
                setFilterTipo('all');
                setFilterInstructor('all');
              }}
              className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                activeTab === 'aprendices'
                  ? 'text-[#4285F4]'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users size={16} />
                Aprendices ({ficha.aprendices?.length || 0})
              </div>
              {activeTab === 'aprendices' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4285F4]" />
              )}
            </button>
            
            <button
              onClick={() => {
                setActiveTab('materias');
                setSearchQuery('');
                setFilterTipo('all');
                setFilterInstructor('all');
              }}
              className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                activeTab === 'materias'
                  ? 'text-[#34A853]'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <BookOpen size={16} />
                Materias ({ficha.materias?.length || 0})
              </div>
              {activeTab === 'materias' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#34A853]" />
              )}
            </button>
          </div>

          {/* Botón agregar materia */}
          {activeTab === 'materias' && (isInstructor || isAdmin) && (
            <button 
              onClick={() => {
                setModalMateria(true);
                setErrorMateria('');
                setFormMateria({ nombre: '', tipo: 'Técnica' });
              }}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Plus size={16} />
              Agregar
            </button>
          )}
        </div>

        {/* Contenido de Aprendices */}
        {activeTab === 'aprendices' && (
          <>
            {/* Búsqueda */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar por nombre, correo o documento..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field"
              />
            </div>

            {/* Lista de aprendices */}
            {filteredAprendices.length === 0 ? (
              <div className="text-center py-8">
                <Users size={32} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">
                  {searchQuery ? 'No se encontraron aprendices' : 'Sin aprendices inscritos aún'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredAprendices.map(aprendiz => {
                  const avatarSrc = resolveAvatar(aprendiz.avatarUrl);
                  return (
                    <div 
                      key={aprendiz.id} 
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-gray-100 dark:border-gray-700 cursor-pointer"
                      onClick={() => handleOpenPerfil(aprendiz)}
                    >
                      {avatarSrc ? (
                        <img 
                          src={avatarSrc} 
                          className="w-10 h-10 rounded-xl object-cover" 
                          alt={aprendiz.fullName} 
                        />
                      ) : (
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                          style={{ backgroundColor: COLOR }}
                        >
                          {aprendiz.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{aprendiz.fullName}</p>
                        <p className="text-xs text-gray-400 font-mono">{aprendiz.document}</p>
                        <p className="text-xs text-gray-400 truncate">{aprendiz.email}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Contenido de Materias */}
        {activeTab === 'materias' && (
          <>
            {/* Búsqueda y filtros */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field"
              />
              
              <select
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
                className="input-field"
              >
                <option value="all">Todos los tipos</option>
                <option value="Técnica">Técnica</option>
                <option value="Transversal">Transversal</option>
              </select>

              <select
                value={filterInstructor}
                onChange={(e) => setFilterInstructor(e.target.value)}
                className="input-field"
              >
                <option value="all">Todos los instructores</option>
                {uniqueInstructors.map(inst => (
                  <option key={inst.id} value={inst.id}>{inst.name}</option>
                ))}
              </select>
            </div>

            {/* Lista de materias */}
            {filteredMaterias.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen size={32} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">
                  {searchQuery || filterTipo !== 'all' || filterInstructor !== 'all' 
                    ? 'No se encontraron materias con esos filtros' 
                    : 'Sin materias asignadas aún'}
                </p>
                {!searchQuery && filterTipo === 'all' && filterInstructor === 'all' && (isInstructor || isAdmin) && (
                  <button 
                    onClick={() => {
                      setModalMateria(true);
                      setErrorMateria('');
                      setFormMateria({ nombre: '', tipo: 'Técnica' });
                    }}
                    className="btn-primary mt-4 text-sm"
                  >
                    <Plus size={16} className="inline mr-2" />
                    Crear primera materia
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredMaterias.map(materia => {
                  return (
                    <div 
                      key={materia.id} 
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-gray-100 dark:border-gray-700 cursor-pointer"
                      onClick={() => handleOpenMateriaInfo(materia)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{materia.nombre}</p>
                        <p className="text-xs text-gray-400">{materia.tipo}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Instructor</p>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[150px]">
                          {materia.instructor?.fullName}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Instructores */}
      {/* Administrador e Instructores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Administrador */}
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Administrador
          </h3>
          {ficha.administrador ? (
            <div 
              className="flex items-center gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30"
            >
              {resolveAvatar(ficha.administrador.avatarUrl) ? (
                <img 
                  src={resolveAvatar(ficha.administrador.avatarUrl)} 
                  className="w-12 h-12 rounded-xl object-cover" 
                  alt={ficha.administrador.fullName} 
                />
              ) : (
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold text-white bg-red-600"
                >
                  {ficha.administrador.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                  {ficha.administrador.fullName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{ficha.administrador.email}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Users size={32} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Sin administrador asignado</p>
            </div>
          )}
        </div>

        {/* Instructores */}
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Instructores ({ficha.instructores?.length || 0})
          </h3>
          {ficha.instructores?.length === 0 ? (
            <div className="text-center py-8">
              <Users size={32} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Sin instructores asignados</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {ficha.instructores?.map(fi => {
                const avatarSrc = resolveAvatar(fi.instructor.avatarUrl);
                const isLider = fi.instructorId === ficha.instructorAdminId;
                
                return (
                  <div 
                    key={fi.id} 
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                  >
                    <div 
                      onClick={() => handleOpenInstructorPerfil(fi.instructor)}
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                    >
                      {avatarSrc ? (
                        <img 
                          src={avatarSrc} 
                          className="w-10 h-10 rounded-xl object-cover" 
                          alt={fi.instructor.fullName} 
                        />
                      ) : (
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                          style={{ backgroundColor: COLOR }}
                        >
                          {fi.instructor.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                          {fi.instructor.fullName}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{fi.instructor.email}</p>
                      </div>
                      {isLider && (
                        <span className="badge badge-info shrink-0 text-xs">Líder</span>
                      )}
                    </div>
                    {!isLider && isAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveInstructor(fi.instructorId, fi.instructor.fullName);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity btn-icon text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Enviar a papelera"
                      >
                        <UserMinus size={16} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Horario Visual */}
      {horariosPorDia.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={20} className="text-[#FBBC05]" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Horario Semanal
            </h3>
          </div>

          <div className={`grid gap-4 ${
            horariosPorDia.length === 1 ? 'grid-cols-1' :
            horariosPorDia.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
            horariosPorDia.length === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
            horariosPorDia.length === 4 ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4' :
            horariosPorDia.length === 5 ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5' :
            horariosPorDia.length === 6 ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6' :
            'grid-cols-2 sm:grid-cols-3 lg:grid-cols-7'
          }`}>
            {horariosPorDia.map((diaData, diaIdx) => (
              <div key={diaData.dia} className="flex flex-col">
                <div className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 px-2">
                  {diaData.dia}
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  {diaData.horarios.map((horario, idx) => {
                    const colorIdx = (ficha.materias || []).findIndex(m => m.id === horario.materiaId);
                    const bgColor = MATERIA_COLORS[colorIdx % MATERIA_COLORS.length];
                    
                    return (
                      <div
                        key={horario.id}
                        className="p-2.5 rounded-lg text-white flex-1 flex flex-col justify-center"
                        style={{ backgroundColor: bgColor }}
                      >
                        <p className="text-xs font-bold mb-0.5 truncate">
                          {horario.materia?.nombre}
                        </p>
                        <p className="text-xs opacity-90 font-mono">
                          {horario.horaInicio} - {horario.horaFin}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <Modal open={modalMateria} onClose={() => setModalMateria(false)} title="Agregar Materia">
        <form onSubmit={handleCreateMateria} className="space-y-4">
          {errorMateria && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl">{errorMateria}</p>}
          
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide mb-1">Ficha</p>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {ficha.numero} - {ficha.nombre}
            </p>
          </div>

          <div>
            <label className="input-label">Nombre de la Materia</label>
            <input 
              required 
              className="input-field" 
              placeholder="Programación Orientada a Objetos"
              value={formMateria.nombre} 
              onChange={e => setFormMateria(prev => ({ ...prev, nombre: e.target.value }))}
            />
          </div>

          <div>
            <label className="input-label">Tipo de Materia</label>
            <select 
              className="input-field" 
              value={formMateria.tipo} 
              onChange={e => setFormMateria(prev => ({ ...prev, tipo: e.target.value }))}
            >
              <option>Técnica</option>
              <option>Transversal</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalMateria(false)} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={savingMateria} className="btn-primary flex-1">
              {savingMateria ? 'Creando...' : 'Crear Materia'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal para editar ficha */}
      <Modal open={modalEdit} onClose={() => setModalEdit(false)} title="Editar Ficha">
        <form onSubmit={handleEditFicha} className="space-y-4">
          {errorEdit && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl">{errorEdit}</p>}
          
          <div>
            <label className="input-label">Número de Ficha</label>
            <input 
              required 
              type="number"
              className="input-field" 
              placeholder="3146013"
              value={formEdit.numero} 
              onChange={e => setFormEdit(prev => ({ ...prev, numero: e.target.value }))}
            />
            <p className="text-xs text-gray-400 mt-1">Debe ser único</p>
          </div>

          <div>
            <label className="input-label">Nombre del Programa</label>
            <input 
              required 
              className="input-field" 
              placeholder="Análisis y Desarrollo de Software"
              value={formEdit.nombre} 
              onChange={e => setFormEdit(prev => ({ ...prev, nombre: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Nivel</label>
              <select 
                className="input-field" 
                value={formEdit.nivel} 
                onChange={e => setFormEdit(prev => ({ ...prev, nivel: e.target.value }))}
              >
                <option>Técnico</option>
                <option>Tecnólogo</option>
              </select>
            </div>
            <div>
              <label className="input-label">Jornada</label>
              <select 
                className="input-field" 
                value={formEdit.jornada} 
                onChange={e => setFormEdit(prev => ({ ...prev, jornada: e.target.value }))}
              >
                <option>Mañana</option>
                <option>Tarde</option>
                <option>Noche</option>
              </select>
            </div>
          </div>

          <div>
            <label className="input-label">Centro de Formación</label>
            <input 
              required 
              className="input-field" 
              placeholder="CTPI Ibagué"
              value={formEdit.centro} 
              onChange={e => setFormEdit(prev => ({ ...prev, centro: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Región</label>
              <input 
                required 
                className="input-field" 
                placeholder="Tolima"
                value={formEdit.region} 
                onChange={e => setFormEdit(prev => ({ ...prev, region: e.target.value }))}
              />
            </div>
            <div>
              <label className="input-label">Duración (meses)</label>
              <input 
                required 
                type="number" 
                min="1" 
                max="30" 
                className="input-field" 
                placeholder="24"
                value={formEdit.duracion} 
                onChange={e => setFormEdit(prev => ({ ...prev, duracion: e.target.value }))}
              />
              <p className="text-xs text-gray-400 mt-1">Máximo 30 meses</p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalEdit(false)} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={savingEdit} className="btn-primary flex-1">
              {savingEdit ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal para registrar métodos biométricos */}
      {selectedAprendiz && (
        <EnrollModal 
          open={modalEnroll} 
          onClose={handleCloseEnroll} 
          aprendiz={selectedAprendiz} 
        />
      )}

      {/* Modal de perfil del aprendiz */}
      {selectedAprendiz && (
        <AprendizPerfilModal 
          open={modalPerfil} 
          onClose={handleClosePerfil} 
          aprendiz={selectedAprendiz}
          isAdmin={isAdmin}
          fichaId={id}
          materias={ficha.materias || []}
          onRemoveAprendiz={handleRemoveAprendiz}
          onBiometricUpdate={handleBiometricUpdate}
        />
      )}

      {/* Modal de información de materia */}
      {selectedMateria && (
        <MateriaInfoModal 
          open={modalMateriaInfo} 
          onClose={handleCloseMateriaInfo} 
          materia={selectedMateria}
          isCreatorOrAdmin={selectedMateria.instructorId === user?.id || isAdmin}
          onUpdate={handleMateriaUpdate}
          onDelete={handleMateriaDelete}
        />
      )}

      {/* Modal de perfil de instructor */}
      {selectedInstructor && (
        <Modal open={modalInstructorPerfil} onClose={handleCloseInstructorPerfil} title="Perfil del Instructor">
          <div className="space-y-4">
            {/* Foto y datos básicos */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              {resolveAvatar(selectedInstructor.avatarUrl) ? (
                <img 
                  src={resolveAvatar(selectedInstructor.avatarUrl)} 
                  className="w-20 h-20 rounded-xl object-cover" 
                  alt={selectedInstructor.fullName} 
                />
              ) : (
                <div 
                  className="w-20 h-20 rounded-xl flex items-center justify-center text-xl font-bold text-white"
                  style={{ backgroundColor: COLOR }}
                >
                  {selectedInstructor.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{selectedInstructor.fullName}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedInstructor.email}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{selectedInstructor.document}</p>
              </div>
            </div>

            {/* Materias a cargo */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Materias a cargo en esta ficha
              </h4>
              {ficha.materias?.filter(m => m.instructorId === selectedInstructor.id).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Sin materias asignadas</p>
              ) : (
                <div className="space-y-2">
                  {ficha.materias?.filter(m => m.instructorId === selectedInstructor.id).map(materia => (
                    <div key={materia.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{materia.nombre}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{materia.tipo}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Botón designar como líder */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              {ficha.instructorAdminId === selectedInstructor.id ? (
                <div className="text-center py-2">
                  <span className="badge badge-info">Líder Actual</span>
                </div>
              ) : (
                <button
                  onClick={() => handleDesignarLider(selectedInstructor.id)}
                  className="btn-primary w-full"
                >
                  Designar como Líder
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de confirmación */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, action: null, data: null })}
        onConfirm={() => {
          if (confirmModal.action === 'regenerate') confirmRegenerate();
          else if (confirmModal.action === 'removeAprendiz') confirmRemoveAprendiz();
          else if (confirmModal.action === 'removeInstructor') confirmRemoveInstructor();
          else if (confirmModal.action === 'salirFicha') confirmSalirFicha();
          else if (confirmModal.action === 'eliminarFicha') confirmEliminarFicha();
          else if (confirmModal.action === 'designarLider') confirmDesignarLider();
        }}
        title={
          confirmModal.action === 'regenerate' ? '¿Regenerar código?' :
          confirmModal.action === 'removeAprendiz' ? '¿Enviar aprendiz a papelera?' :
          confirmModal.action === 'removeInstructor' ? '¿Enviar instructor a papelera?' :
          confirmModal.action === 'salirFicha' ? '¿Salir de esta ficha?' :
          confirmModal.action === 'eliminarFicha' ? '¿Eliminar ficha permanentemente?' :
          confirmModal.action === 'designarLider' ? '¿Designar como Líder?' :
          '¿Estás seguro?'
        }
        message={
          confirmModal.action === 'regenerate' ? 'El código anterior dejará de funcionar.' :
          confirmModal.action === 'removeAprendiz' ? '¿Enviar este aprendiz a la papelera? Podrá ser recuperado desde la sección de papelera.' :
          confirmModal.action === 'removeInstructor' ? `¿Enviar a ${confirmModal.data?.instructorName} a la papelera? Será removido de esta ficha y podrá ser recuperado desde la sección de papelera.` :
          confirmModal.action === 'salirFicha' ? 'Serás removido de esta ficha y podrás verla en "Fichas Anteriores" en la papelera.' :
          confirmModal.action === 'eliminarFicha' ? 'Esta acción eliminará permanentemente la ficha y todos sus datos asociados. Esta acción NO se puede deshacer.' :
          confirmModal.action === 'designarLider' ? 'El líder actual perderá sus permisos y este instructor será el nuevo líder de la ficha.' :
          'Esta acción no se puede deshacer.'
        }
        confirmText="Confirmar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
}
