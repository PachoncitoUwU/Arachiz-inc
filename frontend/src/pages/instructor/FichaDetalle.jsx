import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import fetchApi from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import EnrollModal from '../../components/EnrollModal';
import AprendizPerfilModal from '../../components/AprendizPerfilModal';
import MateriaInfoModal from '../../components/MateriaInfoModal';
import {
  ArrowLeft, Users, BookOpen, Calendar, Copy, RefreshCw, Check, 
  Download, Loader, Edit2, UserMinus, Fingerprint, Link, Clock, Plus
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

  useEffect(() => {
    loadFicha();
  }, [id]);

  const loadFicha = async () => {
    try {
      setLoading(true);
      const data = await fetchApi(`/fichas/${id}`);
      setFicha(data.ficha);
    } catch (err) {
      showToast(err.message || 'Error al cargar la ficha', 'error');
      navigate('/instructor/fichas');
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

  const handleRegenerate = async () => {
    if (!confirm('¿Regenerar el código? El anterior dejará de funcionar.')) return;
    try {
      await fetchApi(`/fichas/${id}/regenerate-code`, { method: 'POST' });
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
      const res = await fetch(`${API_BASE}/api/export/ficha/${id}/asistencia`, {
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
      a.download = `Ficha${ficha.numero}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Archivo exportado exitosamente', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleRemoveAprendiz = async (aprendizId) => {
    if (!confirm('¿Eliminar este aprendiz de la ficha?')) return;
    try {
      await fetchApi(`/fichas/${id}/aprendices/${aprendizId}`, { method: 'DELETE' });
      showToast('Aprendiz eliminado', 'success');
      loadFicha();
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

  const handleBiometricUpdate = () => {
    loadFicha(); // Recargar para actualizar los datos del aprendiz
  };

  const handleOpenMateriaInfo = (materia) => {
    console.log('Materia seleccionada:', materia);
    console.log('Horarios de la materia:', materia.horarios);
    setSelectedMateria(materia);
    setModalMateriaInfo(true);
  };

  const handleCloseMateriaInfo = () => {
    setModalMateriaInfo(false);
    setSelectedMateria(null);
  };

  const handleMateriaUpdate = () => {
    loadFicha(); // Recargar para actualizar los datos
  };

  const handleMateriaDelete = () => {
    loadFicha(); // Recargar para actualizar la lista
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="card animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
                <div className="space-y-3">
                  <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded" />
                  <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-5/6" />
                  <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-4/6" />
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-6">
            {[1, 2].map(i => (
              <div key={i} className="card animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-4" />
                <div className="space-y-3">
                  <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded" />
                  <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!ficha) return null;

  const isAdmin = ficha.instructorAdminId === user?.id;
  const isInstructor = ficha.instructores?.some(fi => fi.instructorId === user?.id);
  const COLOR = '#4285F4'; // Color principal azul

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
            <h1 className="text-2xl font-bold text-gray-900">Ficha {ficha.numero}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {ficha.nivel} · {ficha.centro}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleExport} 
            disabled={exporting} 
            className="btn-secondary flex items-center gap-2"
            title="Exportar asistencia"
          >
            {exporting ? <Loader size={16} className="animate-spin" /> : <Download size={16} />}
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal de la info */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Información general */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Información General</h2>
              {isAdmin && (
                <button onClick={handleOpenEdit} className="btn-icon text-gray-400 hover:bg-gray-100" title="Editar">
                  <Edit2 size={16} />
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide mb-1">Número</p>
                <p className="text-base font-bold text-gray-900 dark:text-gray-100">{ficha.numero}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide mb-1">Nivel</p>
                <p className="text-base font-bold text-gray-900 dark:text-gray-100">{ficha.nivel}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl col-span-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide mb-1">Nombre del Programa</p>
                <p className="text-base font-bold text-gray-900 dark:text-gray-100">{ficha.nombre || 'Sin nombre'}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide mb-1">Jornada</p>
                <p className="text-base font-bold text-gray-900 dark:text-gray-100">{ficha.jornada}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide mb-1">Duración</p>
                <p className="text-base font-bold text-gray-900 dark:text-gray-100">
                  {ficha.duracion ? `${ficha.duracion} meses` : 'No especificada'}
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl col-span-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide mb-1">Centro de Formación</p>
                <p className="text-base font-bold text-gray-900 dark:text-gray-100">{ficha.centro}</p>
              </div>
              {ficha.region && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl col-span-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide mb-1">Región</p>
                  <p className="text-base font-bold text-gray-900 dark:text-gray-100">{ficha.region}</p>
                </div>
              )}
            </div>
          </div>

          {/* Lista de Aprendices */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-[#4285F4]" />
                <h2 className="text-lg font-bold text-gray-900">
                  Aprendices ({ficha.aprendices?.length || 0})
                </h2>
              </div>
            </div>

            {ficha.aprendices?.length === 0 ? (
              <div className="text-center py-8">
                <Users size={32} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Sin aprendices inscritos aún</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {[...(ficha.aprendices || [])].sort((a, b) => a.fullName.localeCompare(b.fullName)).map(aprendiz => {
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
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{aprendiz.fullName}</p>
                        <p className="text-xs text-gray-400 font-mono">{aprendiz.document}</p>
                        <p className="text-xs text-gray-400">{aprendiz.email}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Lista de Materias */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpen size={20} className="text-[#34A853]" />
                <h2 className="text-lg font-bold text-gray-900">
                  Materias ({ficha.materias?.length || 0})
                </h2>
              </div>
              {isInstructor && (
                <button 
                  onClick={() => {
                    setModalMateria(true);
                    setErrorMateria('');
                    setFormMateria({ nombre: '', tipo: 'Técnica' });
                  }}
                  className="btn-primary flex items-center gap-2 text-sm"
                >
                  <Plus size={16} />
                  Agregar Materia
                </button>
              )}
            </div>

            {ficha.materias?.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen size={32} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Sin materias asignadas aún</p>
                {isInstructor && (
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
              <div className="space-y-2">
                {ficha.materias.map(materia => {
                  const isCreatorOrAdmin = materia.instructorId === user?.id || isAdmin;
                  return (
                    <div 
                      key={materia.id} 
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-gray-100 dark:border-gray-700 cursor-pointer"
                      onClick={() => handleOpenMateriaInfo(materia)}
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{materia.nombre}</p>
                        <p className="text-xs text-gray-400">{materia.tipo}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Instructor</p>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{materia.instructor?.fullName}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Horarios */}
          {ficha.horarios && ficha.horarios.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={20} className="text-[#FBBC05]" />
                <h2 className="text-lg font-bold text-gray-900">
                  Horarios ({ficha.horarios.length})
                </h2>
              </div>

              <div className="space-y-2">
                {ficha.horarios.map(horario => (
                  <div 
                    key={horario.id} 
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{horario.dia}</p>
                      <p className="text-xs text-gray-400">{horario.materia?.nombre}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono font-medium text-gray-700 dark:text-gray-300">
                        {horario.horaInicio} - {horario.horaFin}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Columna lateral */}
        <div className="space-y-6">
          
          {/* Código de invitación */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              Código de Invitación
            </h3>
            
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl mb-3">
              <p className="text-center font-mono font-bold text-2xl text-[#4285F4] tracking-widest select-all">
                {ficha.code}
              </p>
            </div>

            <div className="space-y-2">
              <button 
                onClick={copyCode} 
                className="btn-secondary w-full flex items-center justify-center gap-2"
              >
                {copied ? <Check size={16} className="text-[#34A853]" /> : <Copy size={16} />}
                {copied ? 'Copiado' : 'Copiar código'}
              </button>
              
              <button 
                onClick={copyLink} 
                className="btn-secondary w-full flex items-center justify-center gap-2"
              >
                {copiedLink ? <Check size={16} className="text-[#34A853]" /> : <Link size={16} />}
                {copiedLink ? 'Link copiado' : 'Copiar link'}
              </button>

              {isAdmin && (
                <button 
                  onClick={handleRegenerate} 
                  className="btn-secondary w-full flex items-center justify-center gap-2 text-orange-600 hover:bg-orange-50"
                >
                  <RefreshCw size={16} />
                  Regenerar código
                </button>
              )}
            </div>
          </div>

          {/* Instructores */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              Instructores ({ficha.instructores?.length || 0})
            </h3>

            <div className="space-y-2">
              {ficha.instructores?.map(fi => {
                const avatarSrc = resolveAvatar(fi.instructor.avatarUrl);
                const isAdminInstructor = fi.role === 'admin';
                
                return (
                  <div 
                    key={fi.id} 
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800"
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
                    {isAdminInstructor && (
                      <span className="badge badge-info shrink-0">Admin</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Estadísticas rápidas */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Estadísticas
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-[#4285F4]" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Aprendices</span>
                </div>
                <span className="text-lg font-bold text-[#4285F4]">
                  {ficha.aprendices?.length || 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <div className="flex items-center gap-2">
                  <BookOpen size={16} className="text-[#34A853]" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Materias</span>
                </div>
                <span className="text-lg font-bold text-[#34A853]">
                  {ficha.materias?.length || 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Instructores</span>
                </div>
                <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  {ficha.instructores?.length || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para crear materia */}
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
    </div>
  );
}
