import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import fetchApi from '../../services/api';
import { Bell, Check, Trash2, Info, CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';

export default function Notificaciones() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetchApi('/notifications');
      setNotifications(res.notifications);
      // Actualizar el badge global si existe
      window.__UNREAD_NOTIFICATIONS__ = res.unreadCount;
    } catch (error) {
      showToast('Error cargando notificaciones', 'error');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await fetchApi(`/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      if (window.__UNREAD_NOTIFICATIONS__ > 0) window.__UNREAD_NOTIFICATIONS__--;
    } catch (error) {
      showToast('Error al marcar como leída', 'error');
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetchApi('/notifications/read-all', { method: 'PUT' });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      window.__UNREAD_NOTIFICATIONS__ = 0;
      showToast('Todas marcadas como leídas', 'success');
    } catch (error) {
      showToast('Error al actualizar', 'error');
    }
  };

  const deleteNotification = async (id) => {
    try {
      await fetchApi(`/notifications/${id}`, { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => n.id !== id));
      showToast('Notificación eliminada', 'success');
    } catch (error) {
      showToast('Error al eliminar', 'error');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle className="text-green-500" size={20} />;
      case 'warning': return <AlertTriangle className="text-yellow-500" size={20} />;
      case 'error': return <XCircle className="text-red-500" size={20} />;
      default: return <Info className="text-blue-500" size={20} />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.round(diffMs / 60000);
    const diffHrs = Math.round(diffMins / 60);
    const diffDays = Math.round(diffHrs / 24);

    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHrs < 24) return `Hace ${diffHrs} hrs`;
    if (diffDays === 1) return 'Ayer';
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-4xl mx-auto pb-10 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Bell className="text-blue-500" />
            Notificaciones
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Tienes {unreadCount} notificaciones sin leer
          </p>
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            className="btn btn-secondary flex items-center gap-2 whitespace-nowrap"
          >
            <Check size={16} />
            Marcar todas como leídas
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center">
            <Bell size={48} className="text-gray-300 dark:text-gray-700 mb-4" />
            <p className="text-lg">No tienes notificaciones</p>
            <p className="text-sm mt-2">Te avisaremos cuando haya novedades en tus materias o excusas.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-zinc-800">
            {notifications.map((notif) => (
              <div 
                key={notif.id} 
                className={`p-4 transition-colors duration-200 flex items-start gap-4 hover:bg-gray-50 dark:hover:bg-zinc-800/50 group
                  ${!notif.read ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                onClick={() => !notif.read && markAsRead(notif.id)}
              >
                <div className="mt-1 shrink-0 bg-white dark:bg-zinc-800 p-2 rounded-full shadow-sm">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className={`text-sm font-semibold truncate ${!notif.read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                      {notif.title}
                    </h3>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock size={12} />
                        {formatDate(notif.createdAt)}
                      </span>
                    </div>
                  </div>
                  <p className={`text-sm mt-1 text-gray-600 dark:text-gray-400`}>
                    {notif.message}
                  </p>
                </div>
                <div className="shrink-0 flex opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
