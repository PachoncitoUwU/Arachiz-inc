import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import { Award, Target, Flame, Activity, Clock, Calendar, CheckCircle, XCircle, AlertCircle, Info, Bell, BellOff, Edit2, Upload, Trash2 } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function Perfil() {
  const { user, updateUser } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isSupported, permission, subscribe, loading: pushLoading } = usePushNotifications();
  const { showToast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: '', document: '', avatarBase64: null, deleteAvatar: false, currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);

  const handleOpenEdit = () => {
    setEditForm({
      fullName: stats?.fullName || user?.fullName || '',
      document: stats?.document || user?.document || '',
      avatarBase64: null,
      deleteAvatar: false,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setIsEditing(true);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setEditForm(prev => ({ ...prev, avatarBase64: reader.result, deleteAvatar: false }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    if (editForm.newPassword || editForm.currentPassword) {
      if (editForm.newPassword !== editForm.confirmPassword) {
        return showToast('Las contraseñas nuevas no coinciden', 'error');
      }
      if (!editForm.currentPassword) {
        return showToast('Debes ingresar tu contraseña actual para cambiarla', 'error');
      }
      if (editForm.newPassword.length < 6) {
        return showToast('La nueva contraseña debe tener al menos 6 caracteres', 'error');
      }
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({
          fullName: editForm.fullName,
          document: editForm.document,
          avatarBase64: editForm.avatarBase64,
          deleteAvatar: editForm.deleteAvatar
        })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al guardar perfil');
      }
      
      const data = await res.json();

      if (editForm.newPassword && editForm.currentPassword) {
        const pwRes = await fetch(`${API_BASE}/auth/change-password`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}` 
          },
          body: JSON.stringify({
            currentPassword: editForm.currentPassword,
            newPassword: editForm.newPassword
          })
        });
        
        if (!pwRes.ok) {
          const err = await pwRes.json();
          throw new Error('Perfil guardado, pero error en contraseña: ' + (err.error || 'Inválida'));
        }
      }

      showToast('Perfil actualizado correctamente', 'success');
      
      setStats(prev => ({ ...prev, fullName: data.user.fullName, document: data.user.document, avatarUrl: data.user.avatarUrl }));
      updateUser(data.user);
      setIsEditing(false);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/profile/stats`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#4285F4] border-t-transparent" />
      </div>
    );
  }

  const isAprendiz = user?.userType === 'aprendiz';

  return (
    <div className="animate-fade-in space-y-6 max-w-6xl mx-auto pb-10">
      <PageHeader title="Mi Perfil" subtitle="Tus estadísticas y progreso en Arachiz" />

      {/* Tarjeta principal de perfil */}
      <div className="bg-white dark:bg-zinc-800 rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-zinc-700 flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="relative">
          <div className="w-16 h-16 md:w-24 md:h-24 rounded-full overflow-hidden bg-gray-100 shadow-inner border-4 border-white dark:border-zinc-800">
            {stats?.avatarUrl ? (
              <img src={stats.avatarUrl} alt={stats.fullName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 text-white text-4xl font-bold">
                {stats?.fullName?.charAt(0) || user?.email?.charAt(0) || '?'}
              </div>
            )}
          </div>
          {stats?.rachaAsistencia >= 3 && (
            <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-orange-400 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg border-2 border-white dark:border-zinc-800 flex items-center gap-1 animate-bounce">
              <Flame size={12} />
              {stats.rachaAsistencia}
            </div>
          )}
        </div>

        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{stats?.fullName || 'Usuario'}</h1>
            <button 
              onClick={handleOpenEdit} 
              className="btn-icon text-gray-400 hover:text-[#4285F4] hover:bg-blue-50 dark:hover:bg-blue-900/20"
              title="Editar Perfil"
            >
              <Edit2 size={18} />
            </button>
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium capitalize mt-1 text-lg">{stats?.userType || 'Rol Desconocido'}</p>
          <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-semibold shadow-sm">
              <Award size={16} />
              Nivel: Novato
            </span>
            {isAprendiz && stats?.rachaAsistencia >= 5 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-semibold shadow-sm">
                <Target size={16} />
                Asistencia Perfecta
              </span>
            )}
          </div>
        </div>

        {/* Botón Push */}
        {isSupported && (
          <div className="shrink-0 flex items-center">
            <button
              onClick={subscribe}
              disabled={permission === 'granted' || pushLoading}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all shadow-sm ${
                permission === 'granted'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 cursor-default'
                  : 'bg-[#4285F4] text-white hover:bg-blue-600 active:scale-95 cursor-pointer'
              }`}
            >
              {permission === 'granted' ? <Bell size={18} /> : <BellOff size={18} />}
              {permission === 'granted' ? 'Notificaciones Activas' : 'Activar Alertas Push'}
            </button>
          </div>
        )}
      </div>

      {/* Grid de Estadísticas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-4 rounded-2xl border border-orange-100 dark:border-orange-500/20 flex flex-col items-center justify-center text-center group transition-transform hover:-translate-y-1">
          <div className="w-10 h-10 bg-white dark:bg-zinc-800 rounded-xl shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Flame className="text-orange-500" size={22} />
          </div>
          <p className="text-2xl font-black text-orange-600 dark:text-orange-400">{stats?.rachaAsistencia || 0}</p>
          <p className="text-xs font-bold text-orange-800/60 dark:text-orange-300/60 mt-1 uppercase tracking-wide">Racha Actual</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-500/20 flex flex-col items-center justify-center text-center group transition-transform hover:-translate-y-1">
          <div className="w-10 h-10 bg-white dark:bg-zinc-800 rounded-xl shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Activity className="text-blue-500" size={22} />
          </div>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{stats?.totalAsistencias || 0}</p>
          <p className="text-xs font-bold text-blue-800/60 dark:text-blue-300/60 mt-1 uppercase tracking-wide">
            {isAprendiz ? 'Asistencias Totales' : 'Clases Registradas'}
          </p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-500/20 flex flex-col items-center justify-center text-center group transition-transform hover:-translate-y-1">
          <div className="w-10 h-10 bg-white dark:bg-zinc-800 rounded-xl shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Clock className="text-emerald-500" size={22} />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {Math.floor((stats?.totalAsistencias || 0) * 1.5)}h
          </p>
          <p className="text-xs font-bold text-emerald-800/60 dark:text-emerald-300/60 mt-1 uppercase tracking-wide">
            Horas Totales
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfica de Asistencia por Materia */}
        <div className="bg-white dark:bg-zinc-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-zinc-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
            {isAprendiz ? 'Asistencia por Materia' : 'Clases Impartidas'}
          </h2>
          {stats?.chartData && stats.chartData.length > 0 ? (
            <div className="h-72 w-full">
              {isAprendiz ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={stats.chartData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#9ca3af' }} />
                    <Radar
                      name="Asistencia %"
                      dataKey="percentage"
                      stroke="#4285F4"
                      fill="#4285F4"
                      fillOpacity={0.5}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value}%`, 'Asistencia']}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="clases" fill="#4285F4" radius={[6, 6, 0, 0]} name="Clases" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          ) : (
            <div className="h-72 w-full flex items-center justify-center text-gray-400">
              No hay suficientes datos para generar la gráfica.
            </div>
          )}
        </div>

        {/* Historial Reciente */}
        <div className="bg-white dark:bg-zinc-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-zinc-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Actividad Reciente</h2>
          
          <div className="space-y-6">
            {stats?.recentHistory && stats.recentHistory.length > 0 ? (
              stats.recentHistory.map((item, index) => {
                let Icon = Info;
                let colorClass = 'text-gray-500 bg-gray-100 dark:bg-gray-800';
                
                if (item.status === 'success') {
                  Icon = CheckCircle;
                  colorClass = 'text-[#34A853] bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
                } else if (item.status === 'warning') {
                  Icon = AlertCircle;
                  colorClass = 'text-[#FBBC05] bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
                } else if (item.status === 'danger') {
                  Icon = XCircle;
                  colorClass = 'text-[#EA4335] bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
                } else if (item.status === 'info') {
                  Icon = Info;
                  colorClass = 'text-[#4285F4] bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
                }

                return (
                  <div key={item.id || index} className="flex gap-4 relative">
                    {/* Línea conectora */}
                    {index !== stats.recentHistory.length - 1 && (
                      <div className="absolute top-10 left-5 bottom-[-24px] w-0.5 bg-gray-100 dark:bg-zinc-700" />
                    )}
                    
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border z-10 shrink-0 ${colorClass}`}>
                      <Icon size={20} />
                    </div>
                    
                    <div className="pt-2 pb-4">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{item.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{item.description}</p>
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
                        <Calendar size={12} />
                        {new Date(item.date).toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-gray-500 py-10">No hay actividad reciente.</p>
            )}
          </div>
        </div>
      </div>

      <Modal open={isEditing} onClose={() => setIsEditing(false)} title="Editar Perfil">
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-sm relative group">
              {(editForm.avatarBase64 && !editForm.deleteAvatar) || (stats?.avatarUrl && !editForm.deleteAvatar) ? (
                <img 
                  src={editForm.avatarBase64 || stats.avatarUrl} 
                  alt="Avatar" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 text-white text-3xl font-bold">
                  {(editForm.fullName || stats?.fullName || user?.email || '?').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <label className="cursor-pointer p-2 text-white hover:text-blue-300">
                  <Upload size={20} />
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                </label>
                {(editForm.avatarBase64 || stats?.avatarUrl) && !editForm.deleteAvatar && (
                  <button type="button" onClick={() => setEditForm(p => ({ ...p, avatarBase64: null, deleteAvatar: true }))} className="p-2 text-white hover:text-red-400">
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500">Haz clic en la imagen para cambiarla</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre Completo</label>
            <input
              type="text"
              value={editForm.fullName}
              onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
              className="input-field w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Documento</label>
            <input
              type="text"
              value={editForm.document}
              onChange={(e) => setEditForm({ ...editForm, document: e.target.value })}
              className="input-field w-full"
              required
            />
          </div>

          <div className="pt-4 mt-4 border-t border-gray-100 dark:border-zinc-700">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Cambiar Contraseña (Opcional)</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contraseña Actual</label>
                <input
                  type="password"
                  value={editForm.currentPassword}
                  onChange={(e) => setEditForm({ ...editForm, currentPassword: e.target.value })}
                  className="input-field w-full"
                  placeholder="Dejar en blanco si no quieres cambiarla"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nueva Contraseña</label>
                  <input
                    type="password"
                    value={editForm.newPassword}
                    onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                    className="input-field w-full"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirmar Nueva</label>
                  <input
                    type="password"
                    value={editForm.confirmPassword}
                    onChange={(e) => setEditForm({ ...editForm, confirmPassword: e.target.value })}
                    className="input-field w-full"
                    placeholder="Repetir contraseña"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-gray-100 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
