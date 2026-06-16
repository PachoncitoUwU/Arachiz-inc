import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import fetchApi from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import EnrollModal from '../../components/EnrollModal';
import AprendizPerfilModal from '../../components/AprendizPerfilModal';
import MateriaInfoModal from '../../components/MateriaInfoModal';
import NotificacionesModal from '../../components/NotificacionesModal';
import ImportModal from '../../components/ImportModal';
import {
  ArrowLeft, Users, BookOpen, Calendar, Copy, RefreshCw, Check, 
  Download, Loader, Edit2, UserMinus, Fingerprint, Link, Clock, Plus, Star, Eye, EyeOff, Bell, QrCode, X, Upload, MessageSquare
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
  
  const [ficha, _setFicha] = useState(null);
  const setFicha = (val) => {
    if (val) {
      val.materias = (val.competencias || []).map(comp => ({
        ...comp,
        instructor: comp.resultados?.[0]?.instructor || null,
        instructorId: comp.resultados?.[0]?.instructorId || null
      }));
      if (val.horarios) {
        val.horarios = val.horarios.map(h => ({
          ...h,
          materiaId: h.resultadoId,
          materia: h.resultado
        }));
      }
    }
    _setFicha(val);
  };
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [showJoinQR, setShowJoinQR] = useState(false);
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
  const [confirmDialog, setConfirmDialog] = useState({ open: false, action: null, data: null });
  
  // Estados para pestañas y búsqueda
  const [activeTab, setActiveTab] = useState('aprendices'); // 'aprendices' | 'materias'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTipo, setFilterTipo] = useState('all'); // 'all' | 'Técnica' | 'Transversal'
  const [filterInstructor, setFilterInstructor] = useState('all'); // 'all' | instructorId
  const [currentMateriaView, setCurrentMateriaView] = useState('competencias');
  const [selectedCompetenciaView, setSelectedCompetenciaView] = useState(null);
  
  // Estado para fichas ancladas
  const [isPinned, setIsPinned] = useState(false);
  
  // Estados para notificaciones e importación
  const [showNotificaciones, setShowNotificaciones] = useState(false);
  const [showImportAprendices, setShowImportAprendices] = useState(false);
  const [showImportMaterias, setShowImportMaterias] = useState(false);
  
  // Estado para salir de ficha
  const [showSalirDialog, setShowSalirDialog] = useState(false);

  // Estados para nuevo resultado
  const [modalNuevoResultado, setModalNuevoResultado] = useState({ open: false, competenciaId: null, nombre: '' });
  const [savingNuevoResultado, setSavingNuevoResultado] = useState(false);

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

  const loadFicha = async (showSkeleton = true) => {
    try {
      if (showSkeleton) setLoading(true);
      else setIsRefreshing(true);
      const data = await fetchApi(`/fichas/${id}`);
      setFicha(data.ficha);
      setSelectedCompetenciaView(prev => {
        if (!prev) return prev;
        const comps = data.ficha.competencias || [];
        const updated = comps.find(c => c.id === prev.id);
        if (updated) {
          return {
            ...updated,
            instructor: updated.resultados?.[0]?.instructor || null,
            instructorId: updated.resultados?.[0]?.instructorId || null
          };
        }
        return prev;
      });
    } catch (err) {
      showToast(err.message || 'Error al cargar la ficha', 'error');
      navigate('/instructor/fichas');
    } finally {
      if (showSkeleton) setLoading(false);
      else setIsRefreshing(false);
    }
  };

  const handleCreateNuevoResultado = async (e) => {
    e.preventDefault();
    if (!modalNuevoResultado.nombre.trim()) return;
    try {
      setSavingNuevoResultado(true);
      await fetchApi('/resultados', {
        method: 'POST',
        body: JSON.stringify({
          competenciaId: modalNuevoResultado.competenciaId,
          nombre: modalNuevoResultado.nombre
        })
      });
      showToast('Resultado de aprendizaje creado exitosamente', 'success');
      setModalNuevoResultado({ open: false, competenciaId: null, nombre: '' });
      loadFicha(true); // Mostrar el spinner principal
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingNuevoResultado(false);
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
    setConfirmDialog({
      open: true,
      action: async () => {
        try {
          await fetchApi(`/fichas/${id}/regenerate-code`, { method: 'POST' });
          showToast('Código regenerado', 'success');
          loadFicha();
        } catch (err) {
          showToast(err.message, 'error');
        }
      },
      data: { type: 'regenerate' }
    });
  };

  const handleExportExcel = async () => {
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
      showToast('Excel exportado exitosamente', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/export/ficha/${id}/info/pdf`, {
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
      a.download = `Ficha${ficha.numero}_Info.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('PDF exportado exitosamente', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleRemoveAprendiz = async (aprendizId) => {
    setConfirmDialog({
      open: true,
      action: async () => {
        try {
          await fetchApi(`/fichas/${id}/aprendices/${aprendizId}`, { method: 'DELETE' });
          showToast('Aprendiz eliminado', 'success');
          loadFicha();
        } catch (err) {
          showToast(err.message, 'error');
        }
      },
      data: { type: 'remove', aprendizId }
    });
  };

  const handleCreateMateria = async (e) => {
    e.preventDefault();
    setErrorMateria('');
    setSavingMateria(true);
    try {
      await fetchApi('/competencias', {
        method: 'POST',
        body: JSON.stringify({
          fichaId: id,
          nombre: formMateria.nombre,
          tipo: formMateria.tipo
        })
      });
      showToast('Competencia creada exitosamente', 'success');
      await loadFicha(false);
      setModalMateria(false);
      setFormMateria({ nombre: '', tipo: 'Técnica' });
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
      await fetchApi(`/fichas/${id}`, {
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

  const handleBiometricUpdate = async () => {
    // Recargar solo los datos de la ficha sin mostrar loading completo
    try {
      const data = await fetchApi(`/fichas/${id}`);
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
    // Mostrar loading o refreshing
    setIsRefreshing(true);
    try {
      const data = await fetchApi(`/fichas/${id}`);
      setFicha(data.ficha);
      if (selectedCompetenciaView) {
        const updatedComp = (data.ficha.materias || []).find(m => m.id === selectedCompetenciaView.id);
        if (updatedComp) {
          setSelectedCompetenciaView(updatedComp);
        }
      }
    } catch (err) {
      console.error('Error al actualizar datos:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSalirDeFicha = async () => {
    try {
      await fetchApi(`/fichas/${id}/salir`, { method: 'POST' });
      showToast('Has salido de la ficha exitosamente', 'success');
      navigate('/instructor/fichas');
    } catch (err) {
      showToast(err.message || 'Error al salir de la ficha', 'error');
    }
  };

  const handleMateriaDelete = async () => {
    // Recargar solo los datos sin mostrar loading completo
    try {
      const data = await fetchApi(`/fichas/${id}`);
      setFicha(data.ficha);
      if (selectedCompetenciaView) {
        const updatedComp = (data.ficha.materias || []).find(m => m.id === selectedCompetenciaView.id);
        if (updatedComp) {
          setSelectedCompetenciaView(updatedComp);
        } else {
          setSelectedCompetenciaView(null);
          setCurrentMateriaView('competencias');
        }
      }
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3  gap-4 mb-6">
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
          <div className="grid grid-cols-1 sm:grid-cols-2  sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!ficha) return null;

  const isLider = ficha.instructorAdminId === user?.id;
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
  // Filtrar materias
  const filteredMaterias = (ficha.competencias || []).filter(materia => {
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
      const hasInstructor = (materia.resultados || []).some(r => r.instructorId === filterInstructor);
      matches = matches && hasInstructor;
    }
    
    return matches;
  });

  // Obtener instructores únicos para el filtro a partir de los resultados
  const uniqueInstructorsMap = new Map();
  (ficha.competencias || []).forEach(comp => {
    (comp.resultados || []).forEach(res => {
      if (res.instructorId && res.instructor) {
        uniqueInstructorsMap.set(res.instructorId, res.instructor.fullName);
      }
    });
  });
  
  const uniqueInstructors = Array.from(uniqueInstructorsMap.entries()).map(([id, name]) => ({
    id,
    name
  }));

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
            onClick={() => navigate('/instructor/fichas')} 
            className="btn-icon text-gray-400 hover:bg-gray-100"
            title="Volver a fichas"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl  font-bold text-gray-900 dark:text-white  dark:text-white">Ficha {ficha.numero}</h1>
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
          <div className="flex bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 shadow-sm overflow-hidden">
            <button 
              onClick={handleExportExcel} 
              disabled={exporting} 
              className="px-3 py-2 text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center gap-1 font-medium transition-colors border-r border-gray-200 dark:border-zinc-700"
              title="Exportar a Excel"
            >
              {exporting ? <Loader size={16} className="animate-spin" /> : <Download size={16} />}
              Excel
            </button>
            <button 
              onClick={handleExportPdf} 
              disabled={exporting} 
              className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-1 font-medium transition-colors"
              title="Exportar a PDF"
            >
              {exporting ? <Loader size={16} className="animate-spin" /> : <Download size={16} />}
              PDF
            </button>
          </div>
          
          <button 
            onClick={() => setShowSalirDialog(true)} 
            className="btn-secondary text-sm md:text-base flex items-center gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            title="Salir de esta ficha"
          >
            <ArrowLeft size={16} />
            Salir
          </button>
        </div>
      </div>

      {/* Estadísticas horizontales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3  gap-4 mb-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide mb-1">
                Instructores
              </p>
              <p className="text-xl md:text-2xl  font-bold text-purple-600 dark:text-purple-400">
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
              <p className="text-xl md:text-2xl  font-bold text-[#4285F4]">
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
                Competencias
              </p>
              <p className="text-xl md:text-2xl  font-bold text-[#34A853]">
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
            <h2 className="text-lg font-bold text-gray-900 dark:text-white  dark:text-white">Información General</h2>
            {isLider && (
              <button onClick={handleOpenEdit} className="btn-icon text-gray-400 hover:bg-gray-100" title="Editar">
                <Edit2 size={16} />
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3  gap-3">
            <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-0.5">Número</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white  dark:text-gray-100">{ficha.numero}</p>
            </div>
            <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-0.5">Nivel</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white  dark:text-gray-100">{ficha.nivel}</p>
            </div>
            <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-0.5">Jornada</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white  dark:text-gray-100">{ficha.jornada}</p>
            </div>
            <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg col-span-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-0.5">Programa</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white  dark:text-gray-100">{ficha.nombre || 'Sin nombre'}</p>
            </div>
            <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg col-span-2">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-0.5">Centro</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white  dark:text-gray-100">{ficha.centro}</p>
            </div>
            <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-0.5">Duración</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white  dark:text-gray-100">
                {ficha.duracion ? `${ficha.duracion}m` : 'N/A'}
              </p>
            </div>
            {ficha.fechaInicio && (
              <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-0.5">Fecha de Inicio</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white dark:text-gray-100">
                  {new Date(ficha.fechaInicio).toLocaleDateString()}
                </p>
              </div>
            )}
            {ficha.fechaFin && (
              <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-0.5">Fecha de Fin</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white dark:text-gray-100">
                  {new Date(ficha.fechaFin).toLocaleDateString()}
                </p>
              </div>
            )}
            {ficha.region && (
              <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg col-span-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-0.5">Región</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white  dark:text-gray-100">{ficha.region}</p>
              </div>
            )}
          </div>
        </div>

        {/* Código de invitación y Notificaciones (1 columna) */}
        <div className="space-y-4">
          {/* Botón de Notificaciones */}
          <div className="card">
            <button
              onClick={() => setShowNotificaciones(true)}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                  <Bell size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white  dark:text-white">
                    Notificaciones
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Ver actividad de la ficha
                  </p>
                </div>
              </div>
              <div className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                →
              </div>
            </button>
          </div>

          {/* Código de Invitación */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              Código de Invitación
            </h3>
          
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl mb-3 relative">
            {showCode ? (
              <p className="text-center font-mono font-bold text-xl text-[#4285F4] tracking-widest select-all">
                {ficha.code}
              </p>
            ) : (
              <p className="text-center font-mono font-bold text-xl text-gray-400 tracking-widest">
                ••••••
              </p>
            )}
            <button
              onClick={() => setShowCode(!showCode)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-blue-100 dark:hover:bg-blue-800/30 rounded-lg transition-colors"
              title={showCode ? 'Ocultar código' : 'Ver código'}
            >
              {showCode ? <EyeOff size={16} className="text-[#4285F4]" /> : <Eye size={16} className="text-[#4285F4]" />}
            </button>
          </div>

          <div className="space-y-2">
            <button 
              onClick={copyCode} 
              className="btn-secondary text-sm md:text-base  w-full flex items-center justify-center gap-2 text-sm py-2"
            >
              {copied ? <Check size={14} className="text-[#34A853]" /> : <Copy size={14} />}
              {copied ? 'Copiado' : 'Copiar código'}
            </button>
            
            <button 
              onClick={copyLink} 
              className="btn-secondary text-sm md:text-base  w-full flex items-center justify-center gap-2 text-sm py-2"
            >
              {copiedLink ? <Check size={14} className="text-[#34A853]" /> : <Link size={14} />}
              {copiedLink ? 'Link copiado' : 'Copiar link'}
            </button>
            
            <button
              onClick={() => setShowJoinQR(true)}
              className="btn-secondary w-full flex items-center justify-center gap-2 text-sm py-2"
            >
              <QrCode size={14} />
              Mostrar QR
            </button>

            {isLider && (
              <button 
                onClick={handleRegenerate} 
                className="btn-secondary text-sm md:text-base  w-full flex items-center justify-center gap-2 text-sm py-2 text-orange-600 hover:bg-orange-50"
              >
                <RefreshCw size={14} />
                Regenerar
              </button>
            )}
          </div>
          </div>
        </div>
      </div>

      {/* Tarjeta con pestañas: Aprendices y Materias */}
      <div className="card mb-6">
        {/* Tabs */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-700  dark:border-gray-700 mb-4">
          <div className="flex flex-wrap gap-1 ">
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
                Competencias ({ficha.materias?.length || 0})
              </div>
              {activeTab === 'materias' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#34A853]" />
              )}
            </button>


          </div>

          <div className="flex items-center gap-2 pb-2">
            {/* Botón recargar listado */}
            <button 
              onClick={() => loadFicha(false)} 
              className="btn-icon p-2 text-gray-500 hover:text-[#4285F4] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700"
              title="Recargar ficha"
            >
              <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
            </button>

            {/* Botones de Materias */}
            {activeTab === 'materias' && isInstructor && (
              <div className="flex gap-2">
                {isLider && (
                  <button 
                    onClick={() => setShowImportMaterias(true)}
                    className="btn-secondary py-1.5 text-sm flex items-center gap-2"
                  >
                    <Upload size={16} />
                    Importar
                  </button>
                )}
                <button 
                  onClick={() => {
                    setModalMateria(true);
                    setErrorMateria('');
                    setFormMateria({ nombre: '', tipo: 'Técnica' });
                  }}
                  className="btn-primary py-1.5 text-sm flex items-center gap-2"
                >
                  <Plus size={16} />
                  Agregar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Contenido de Aprendices */}
        {activeTab === 'aprendices' && (
          <>
            {/* Búsqueda y acciones */}
            <div className="mb-4 flex flex-col sm:flex-row gap-2">
              <div className="flex flex-1 items-center gap-2">
                <input
                  type="text"
                  placeholder="Buscar por nombre, correo o documento..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field flex-1"
                />
              </div>
              {isLider && (
                <button 
                  onClick={() => setShowImportAprendices(true)}
                  className="btn-secondary text-sm md:text-base  flex items-center justify-center gap-2"
                >
                  <Upload size={16} />
                  Importar CSV/Excel
                </button>
              )}
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
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-gray-100 dark:border-zinc-700  dark:border-gray-700 cursor-pointer"
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
                    ? 'No se encontraron competencias con esos filtros' 
                    : 'Sin competencias asignadas aún'}
                </p>
                {!searchQuery && filterTipo === 'all' && filterInstructor === 'all' && isInstructor && (
                  <button 
                    onClick={() => {
                      setModalMateria(true);
                      setErrorMateria('');
                      setFormMateria({ nombre: '', tipo: 'Técnica' });
                    }}
                    className="btn-primary text-sm md:text-base  mt-4 text-sm"
                  >
                    <Plus size={16} className="inline mr-2" />
                    Crear primera competencia
                  </button>
                )}
              </div>
            ) : currentMateriaView === 'resultados' && selectedCompetenciaView ? (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center gap-3 mb-6">
                  <button onClick={() => { setCurrentMateriaView('competencias'); setSelectedCompetenciaView(null); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 font-medium flex items-center gap-2">
                    ← Volver
                  </button>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Competencia</p>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedCompetenciaView.nombre}</h2>
                  </div>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {selectedCompetenciaView.resultados?.map(r => (
                    <div 
                      key={r.id} 
                      onClick={() => handleOpenMateriaInfo({...r, competencia: selectedCompetenciaView, competenciaId: selectedCompetenciaView.id, ficha: { numero: ficha.numero, nombre: ficha.nombre }})} 
                      className="p-4 rounded-xl border border-gray-100 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:shadow-md transition-shadow cursor-pointer flex items-center justify-between gap-4"
                    >
                      <p className="font-bold text-gray-800 dark:text-gray-100 flex-1 min-w-0 truncate">{r.nombre}</p>
                      <p className="text-sm font-medium flex-shrink-0 text-gray-600 dark:text-gray-400">
                        {r.instructor ? r.instructor.fullName : 'Sin instructor asignado'}
                      </p>
                    </div>
                  ))}
                  {(!selectedCompetenciaView.resultados || selectedCompetenciaView.resultados.length === 0) && (
                    <div className="p-8 text-center text-gray-500 bg-gray-50 dark:bg-zinc-800/50 rounded-xl">
                      Esta competencia aún no tiene resultados de aprendizaje asignados.
                    </div>
                  )}
                </div>
                {/* Botón crear resultado */}
                {isInstructor && (
                  <button
                    onClick={() => setModalNuevoResultado({ open: true, competenciaId: selectedCompetenciaView.id, nombre: '' })}
                    className="mt-4 btn-primary text-sm flex items-center gap-2"
                  >
                    <Plus size={14} /> Agregar Resultado de Aprendizaje
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredMaterias.map(materia => {
                  return (
                    <div 
                      key={materia.id} 
                      className="p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-gray-100 dark:border-zinc-700 dark:bg-zinc-800/50"
                    >
                      <div className="flex items-center justify-between cursor-pointer" onClick={() => handleOpenMateriaInfo(materia)}>
                        <div className="flex-1 min-w-0 pr-4">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{materia.nombre}</p>
                          <p className="text-xs text-gray-400">{materia.tipo}</p>
                        </div>
                        <div className="flex-shrink-0">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setSelectedCompetenciaView(materia); setCurrentMateriaView('resultados'); }}
                            className="text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                          >
                            Ver resultados de aprendizaje ({materia.resultados?.length || 0})
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

      </div>

      {/* Administrador e Instructores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Administrador */}
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white  dark:text-white mb-4">
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
                <p className="text-sm font-bold text-gray-900 dark:text-white  dark:text-gray-100 truncate">
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
          <h3 className="text-lg font-bold text-gray-900 dark:text-white  dark:text-white mb-4">
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
                const isLiderInstructor = fi.instructorId === ficha.instructorAdminId;
                
                return (
                  <div 
                    key={fi.id} 
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-zinc-700  dark:border-gray-700"
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
                    {isLiderInstructor && (
                      <span className="badge badge-info shrink-0 text-xs">Líder</span>
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
            <h3 className="text-lg font-bold text-gray-900 dark:text-white  dark:text-white">
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
                    const getHash = (str) => {
                      if (!str) return 0;
                      let hash = 0;
                      for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
                      return Math.abs(hash);
                    };
                    const colorIdx = getHash(horario.materiaId || horario.id);
                    const bgColor = MATERIA_COLORS[colorIdx % MATERIA_COLORS.length];
                    
                    return (
                      <div
                        key={horario.id}
                        className="p-2.5 rounded-lg text-white flex-1 flex flex-col justify-center"
                        style={{ backgroundColor: bgColor }}
                      >
                        <p className="text-[10px] uppercase tracking-wider opacity-75 mb-0.5 truncate leading-tight">
                          {horario.materia?.competencia?.nombre}
                        </p>
                        <p className="text-xs font-bold mb-1 truncate leading-tight">
                          {horario.materia?.nombre}
                        </p>
                        <p className="text-[10px] font-medium text-white/90 truncate flex items-center gap-1 mb-1.5">
                          <Users size={10} />
                          {horario.materia?.instructor?.fullName || 'Sin instructor'}
                        </p>
                        <p className="text-[10px] opacity-90 font-mono flex items-center gap-1">
                          <Clock size={10} />
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
      <Modal open={modalMateria} onClose={() => setModalMateria(false)} title="Agregar Competencia">
        <form onSubmit={handleCreateMateria} className="space-y-4">
          {errorMateria && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl">{errorMateria}</p>}
          
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide mb-1">Ficha</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white  dark:text-gray-100">
              {ficha.numero} - {ficha.nombre}
            </p>
          </div>

          <div>
            <label className="input-label">Nombre de la Competencia</label>
            <input 
              required 
              className="input-field" 
              placeholder="Programación Orientada a Objetos"
              value={formMateria.nombre} 
              onChange={e => setFormMateria(prev => ({ ...prev, nombre: e.target.value }))}
            />
          </div>

          <div>
            <label className="input-label">Tipo</label>
            <select 
              className="input-field" 
              value={formMateria.tipo} 
              onChange={e => setFormMateria(prev => ({ ...prev, tipo: e.target.value }))}
            >
              <option>Técnica</option>
              <option>Transversal</option>
              <option>Básica</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-3  pt-2">
            <button type="button" onClick={() => setModalMateria(false)} className="btn-secondary text-sm md:text-base  flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={savingMateria} className="btn-primary text-sm md:text-base  flex-1">
              {savingMateria ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Crear Nuevo Resultado de Aprendizaje */}
      <Modal open={modalNuevoResultado.open} onClose={() => setModalNuevoResultado({ ...modalNuevoResultado, open: false })} title="Nuevo Resultado de Aprendizaje">
        <form onSubmit={handleCreateNuevoResultado} className="space-y-4">
          <div>
            <label className="input-label">Nombre del Resultado</label>
            <input 
              required 
              className="input-field" 
              placeholder="Escribe el nombre aquí..."
              value={modalNuevoResultado.nombre} 
              onChange={e => setModalNuevoResultado({...modalNuevoResultado, nombre: e.target.value})} 
            />
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <button type="button" onClick={() => setModalNuevoResultado({ ...modalNuevoResultado, open: false })} className="btn-secondary text-sm md:text-base flex-1">Cancelar</button>
            <button type="submit" disabled={savingNuevoResultado} className="btn-primary text-sm md:text-base flex-1">
              {savingNuevoResultado ? 'Creando...' : 'Crear Resultado'}
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

          <div className="grid grid-cols-1 sm:grid-cols-2  gap-3">
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

          <div className="grid grid-cols-1 sm:grid-cols-2  gap-3">
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

          <div className="flex flex-wrap gap-3  pt-2">
            <button type="button" onClick={() => setModalEdit(false)} className="btn-secondary text-sm md:text-base  flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={savingEdit} className="btn-primary text-sm md:text-base  flex-1">
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
          onUpdate={handleBiometricUpdate}
        />
      )}

      {/* Modal de perfil del aprendiz */}
      {selectedAprendiz && (
        <AprendizPerfilModal 
          open={modalPerfil} 
          onClose={handleClosePerfil} 
          aprendiz={selectedAprendiz}
          isAdmin={isLider}
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
          isCreatorOrAdmin={selectedMateria.instructorId === user?.id || isLider}
          isAdmin={isLider}
          canTakeMateria={true}
          instructores={ficha.instructores?.map(fi => fi.instructor) || []}
          currentUserId={user?.id}
          onUpdate={handleMateriaUpdate}
          onDelete={handleMateriaDelete}
        />
      )}

      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, action: null, data: null })}
        onConfirm={confirmDialog.action}
        title={confirmDialog.data?.type === 'regenerate' ? "Regenerar Código" : "Eliminar Aprendiz"}
        message={confirmDialog.data?.type === 'regenerate' 
          ? "¿Regenerar el código? El anterior dejará de funcionar."
          : "¿Eliminar este aprendiz de la ficha? Esta acción no se puede deshacer."}
        confirmText={confirmDialog.data?.type === 'regenerate' ? "Regenerar" : "Eliminar"}
        cancelText="Cancelar"
        danger={true}
      />

      {/* Modal Mostrar QR de Invitación */}
      {showJoinQR && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-900 dark:text-white">QR de Invitación</h3>
              <button onClick={() => setShowJoinQR(false)} className="btn-icon hover:bg-gray-100 dark:hover:bg-gray-800">
                <X size={18} />
              </button>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border-4 border-[#4285F4] flex items-center justify-center mb-4">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`${window.location.origin}/unirse/${ficha.code}`)}`}
                alt="QR Code Invitación"
                className="w-full h-auto max-w-[250px]"
              />
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-center">
              <p className="font-mono font-bold text-lg text-[#4285F4] tracking-widest">{ficha.code}</p>
            </div>
            <p className="text-center text-sm text-gray-500 mt-4">
              Escanea este código o usa el pin para unirte a la ficha
            </p>
          </div>
        </div>
      )}

      {/* Modal de Notificaciones */}
      <NotificacionesModal
        isOpen={showNotificaciones}
        onClose={() => setShowNotificaciones(false)}
        fichaId={id}
      />

      <ImportModal
        isOpen={showImportAprendices}
        onClose={() => setShowImportAprendices(false)}
        type="aprendices"
        fichaId={id}
        onSuccess={loadFicha}
      />

      <ImportModal
        isOpen={showImportMaterias}
        onClose={() => setShowImportMaterias(false)}
        type="materias"
        fichaId={id}
        onSuccess={loadFicha}
      />

      {/* Diálogo de confirmación para salir de ficha */}
      <ConfirmDialog
        open={showSalirDialog}
        onClose={() => setShowSalirDialog(false)}
        onConfirm={handleSalirDeFicha}
        title="Salir de la Ficha"
        message={isLider 
          ? "Eres el líder de esta ficha. Si sales, la ficha quedará sin líder. ¿Estás seguro de que deseas salir?"
          : "¿Estás seguro de que deseas salir de esta ficha? Esta acción no se puede deshacer."}
        confirmText="Salir"
        cancelText="Cancelar"
        danger={true}
      />
    </div>
  );
}
