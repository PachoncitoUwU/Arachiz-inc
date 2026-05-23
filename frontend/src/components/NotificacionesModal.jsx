import React, { useState, useEffect } from 'react';
import { X, Bell, Clock, UserPlus, UserMinus, UserCheck, BookOpen, Users, AlertCircle, Loader } from 'lucide-react';
import fetchApi from '../services/api';

const API_BASE = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

// Helper para resolver avatarUrl
const resolveAvatar = (url) => {
  if (!url) return null;
  if (url.startsWith('data:') || url.startsWith('http') || url.startsWith('blob:')) return url;
  return `${API_BASE}${url}`;
};

// Formatear fecha en zona horaria de Colombia
const formatFechaColombia = (fechaISO) => {
  const fecha = new Date(fechaISO);
  
  // Opciones para formato de fecha en Colombia
  const opcionesFecha = {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  };
  
  return fecha.toLocaleString('es-CO', opcionesFecha);
};

// Obtener fecha relativa (hace X tiempo)
const getFechaRelativa = (fechaISO) => {
  const ahora = new Date();
  const fecha = new Date(fechaISO);
  const diffMs = ahora - fecha;
  const diffMinutos = Math.floor(diffMs / 60000);
  const diffHoras = Math.floor(diffMinutos / 60);
  const diffDias = Math.floor(diffHoras / 24);
  
  if (diffMinutos < 1) return 'Justo ahora';
  if (diffMinutos < 60) return `Hace ${diffMinutos} min`;
  if (diffHoras < 24) return `Hace ${diffHoras}h`;
  if (diffDias < 7) return `Hace ${diffDias}d`;
  
  return formatFechaColombia(fechaISO);
};

// Iconos según tipo de evento
const getEventIcon = (tipoEvento) => {
  switch (tipoEvento) {
    case 'aprendiz_unido':
      return <UserPlus size={16} className="text-green-500" />;
    case 'aprendiz_eliminado':
      return <UserMinus size={16} className="text-red-500" />;
    case 'instructor_unido':
      return <UserCheck size={16} className="text-blue-500" />;
    case 'instructor_eliminado':
      return <UserMinus size={16} className="text-orange-500" />;
    case 'lider_cambiado':
      return <Users size={16} className="text-purple-500" />;
    case 'materia_creada':
      return <BookOpen size={16} className="text-green-500" />;
    case 'materia_actualizada':
      return <BookOpen size={16} className="text-blue-500" />;
    case 'materia_eliminada':
      return <BookOpen size={16} className="text-red-500" />;
    case 'instructor_materia_cambiado':
      return <UserCheck size={16} className="text-indigo-500" />;
    case 'instructor_materia_tomada':
      return <UserCheck size={16} className="text-green-600" />;
    case 'instructor_materia_dejada':
      return <UserMinus size={16} className="text-orange-600" />;
    case 'ficha_creada':
      return <AlertCircle size={16} className="text-green-500" />;
    case 'ficha_actualizada':
      return <AlertCircle size={16} className="text-blue-500" />;
    default:
      return <Bell size={16} className="text-gray-500" />;
  }
};

export default function NotificacionesModal({ isOpen, onClose, fichaId, userRole }) {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (isOpen && fichaId) {
      loadNotificaciones();
    }
  }, [isOpen, fichaId]);

  const loadNotificaciones = async (pageNum = 1) => {
    try {
      setLoading(true);
      setError('');
      
      const endpoint = userRole === 'administrador' 
        ? `/admin/fichas/${fichaId}/historial?limit=50&page=${pageNum}`
        : `/fichas/${fichaId}/historial?limit=50&page=${pageNum}`;
      
      const data = await fetchApi(endpoint);
      
      if (pageNum === 1) {
        setNotificaciones(data.historial || []);
      } else {
        setNotificaciones(prev => [...prev, ...(data.historial || [])]);
      }
      
      setHasMore((data.historial || []).length === 50);
      setPage(pageNum);
    } catch (err) {
      console.error('Error cargando notificaciones:', err);
      setError(err.message || 'Error al cargar notificaciones');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadNotificaciones(page + 1);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <Bell size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Notificaciones</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Historial de actividad de la ficha
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && notificaciones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader size={32} className="text-blue-500 animate-spin mb-3" />
              <p className="text-sm text-gray-500">Cargando notificaciones...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle size={32} className="text-red-500 mb-3" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : notificaciones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Bell size={32} className="text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">No hay notificaciones aún</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notificaciones.map((notif) => {
                const avatarSrc = resolveAvatar(notif.usuario?.avatarUrl);
                
                return (
                  <div
                    key={notif.id}
                    className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar o icono */}
                      <div className="flex-shrink-0">
                        {avatarSrc ? (
                          <img
                            src={avatarSrc}
                            alt={notif.usuario?.fullName}
                            className="w-10 h-10 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            {getEventIcon(notif.tipoEvento)}
                          </div>
                        )}
                      </div>

                      {/* Contenido */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {notif.usuario?.fullName || 'Usuario desconocido'}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                            <Clock size={12} />
                            <span>{getFechaRelativa(notif.fechaHora)}</span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                          {notif.descripcion}
                        </p>

                        {/* Fecha completa */}
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {formatFechaColombia(notif.fechaHora)}
                        </p>


                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Botón cargar más */}
              {hasMore && (
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="w-full py-3 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader size={16} className="animate-spin" />
                      Cargando...
                    </span>
                  ) : (
                    'Cargar más'
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="btn-secondary w-full"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
