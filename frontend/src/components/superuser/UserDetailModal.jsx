import React, { useEffect, useState } from 'react';
import { Mail, CreditCard, Calendar, Activity, Shield, Hash, Image as ImageIcon } from 'lucide-react';
import Modal from '../Modal';
import { superUserApi } from '../../services/superUserApi';

export default function UserDetailModal({ open, onClose, userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && userId) {
      loadUser();
    }
  }, [open, userId]);

  const loadUser = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await superUserApi.getUserDetail(userId);
      setUser(data);
    } catch (err) {
      setError(err.message || 'Error cargando detalles del usuario');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Detalles Completos del Usuario">
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>
      ) : user ? (
        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex items-center gap-4 bg-gray-50 dark:bg-zinc-800 p-4 rounded-xl border border-gray-100 dark:border-zinc-700">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-2xl font-bold">
                {user.fullName?.charAt(0) || '?'}
              </div>
            )}
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{user.fullName}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{user.userType}</p>
              <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-zinc-700 rounded-full font-mono mt-1 inline-block">
                ID: {user.id}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                <Mail size={16} className="text-gray-400" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                <CreditCard size={16} className="text-gray-400" />
                <span>{user.document || 'No registrado'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                <Calendar size={16} className="text-gray-400" />
                <span>Creado: {new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                <Hash size={16} className="text-gray-400" />
                <span>NFC UID: {user.nfcUid || 'No asignado'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 break-all">
                <ImageIcon size={16} className="text-gray-400 shrink-0" />
                <span className="truncate" title={user.avatarUrl}>{user.avatarUrl || 'Sin avatar'}</span>
              </div>
            </div>
          </div>

          {/* Relaciones */}
          <div className="border-t border-gray-100 dark:border-zinc-700 pt-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Relaciones</h4>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>• <strong>Fichas como Aprendiz:</strong> {user.fichasApr?.length || 0}</p>
              <p>• <strong>Fichas como Instructor:</strong> {user.fichasInst?.length || 0}</p>
              <p>• <strong>Fichas Administradas:</strong> {user.fichasAdmin?.length || user.fichasAdministradas?.length || 0}</p>
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
