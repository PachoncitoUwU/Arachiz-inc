import React, { useEffect, useState, useRef } from 'react';
import { Search, MoreVertical, Eye, Edit2, ShieldAlert, KeyRound, Trash2, Shield } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { superUserApi } from '../../services/superUserApi';
import { useToast } from '../../context/ToastContext';
import ConfirmationModal from '../../components/superuser/ConfirmationModal';
import UserDetailModal from '../../components/superuser/UserDetailModal';
import EditUserModal from '../../components/superuser/EditUserModal';
import Modal from '../../components/Modal';

export default function Usuarios() {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');

  // Dropdown state
  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownRef = useRef(null);

  // Modals state
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRole, setNewRole] = useState('');
  
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    loadUsers();
    
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setPage(1);
    loadUsers(1);
  }, [filterRole]);

  useEffect(() => {
    loadUsers(page);
  }, [page]);

  const loadUsers = async (p = page) => {
    try {
      setLoading(true);
      const data = await superUserApi.getAllUsers({ tipo: filterRole, search: searchTerm, page: p, limit: 10 });
      if (data.users) {
        setUsers(data.users);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      } else {
        // Fallback for previous structure
        setUsers(data);
      }
    } catch (err) {
      showToast('Error al cargar usuarios', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      setPage(1);
      loadUsers(1);
    }
  };

  // Actions
  const handleAction = (user, action) => {
    setSelectedUser(user);
    setActiveDropdown(null);
    switch (action) {
      case 'view': setShowDetail(true); break;
      case 'edit': setShowEdit(true); break;
      case 'role': setNewRole(user.userType); setShowRoleModal(true); break;
      case 'reset': setShowConfirmReset(true); break;
      case 'delete': setShowConfirmDelete(true); break;
      default: break;
    }
  };

  const executeChangeRole = async () => {
    try {
      await superUserApi.changeUserType(selectedUser.id, newRole);
      showToast(`Rol actualizado a ${newRole}`, 'success');
      setShowRoleModal(false);
      loadUsers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const executeResetPassword = async () => {
    try {
      const res = await superUserApi.resetUserPassword(selectedUser.id);
      showToast(`Contraseña reseteada. Nueva temporal: ${res.tempPassword}`, 'success');
      setShowConfirmReset(false);
      // Podrías mostrar un alert más persistente para que copien la contraseña
      alert(`La nueva contraseña temporal para ${selectedUser.email} es: \n\n${res.tempPassword}\n\nPor favor, cópiala. Solo se mostrará esta vez.`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const executeDelete = async () => {
    try {
      await superUserApi.deleteUserPermanently(selectedUser.id);
      showToast('Usuario eliminado permanentemente', 'success');
      setShowConfirmDelete(false);
      loadUsers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Gestión Global de Usuarios" 
        subtitle="Administra todos los usuarios de la plataforma sin restricciones"
      />

      {/* Filters */}
      <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-card p-4 flex flex-col md:flex-row gap-4 border border-gray-100 dark:border-zinc-700">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre, email o documento... (Presiona Enter)"
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4285F4] bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearch}
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4285F4] bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
        >
          <option value="">Todos los Roles</option>
          <option value="aprendiz">Aprendiz</option>
          <option value="instructor">Instructor</option>
          <option value="administrador">Administrador</option>
          <option value="super_usuario">Super Usuario</option>
        </select>
        <button onClick={() => { setPage(1); loadUsers(1); }} className="btn-primary">
          Buscar
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-card border border-gray-100 dark:border-zinc-700 overflow-visible">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Cargando...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No se encontraron usuarios.</div>
        ) : (
          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 dark:bg-zinc-900/50 text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-zinc-700">
                <tr>
                  <th className="px-6 py-4 font-semibold text-sm">Usuario</th>
                  <th className="px-6 py-4 font-semibold text-sm">Documento</th>
                  <th className="px-6 py-4 font-semibold text-sm">Rol</th>
                  <th className="px-6 py-4 font-semibold text-sm">Registro</th>
                  <th className="px-6 py-4 font-semibold text-sm text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-700">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                            {u.fullName?.charAt(0) || '?'}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{u.fullName}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{u.document || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize
                        ${u.userType === 'super_usuario' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          u.userType === 'administrador' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                          u.userType === 'instructor' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                          'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}
                      `}>
                        {u.userType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-center relative">
                      <button 
                        onClick={() => setActiveDropdown(activeDropdown === u.id ? null : u.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                      >
                        <MoreVertical size={20} />
                      </button>

                      {activeDropdown === u.id && (
                        <div ref={dropdownRef} className="absolute right-8 top-10 w-48 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-gray-100 dark:border-zinc-700 z-50 py-2">
                          <button onClick={() => handleAction(u, 'view')} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 flex items-center gap-2">
                            <Eye size={16} /> Ver Perfil
                          </button>
                          <button onClick={() => handleAction(u, 'edit')} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 flex items-center gap-2">
                            <Edit2 size={16} /> Editar
                          </button>
                          <button onClick={() => handleAction(u, 'role')} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 flex items-center gap-2">
                            <ShieldAlert size={16} /> Cambiar Rol
                          </button>
                          <button onClick={() => handleAction(u, 'reset')} className="w-full text-left px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 flex items-center gap-2">
                            <KeyRound size={16} /> Reset Password
                          </button>
                          <div className="h-px bg-gray-100 dark:bg-zinc-700 my-1"></div>
                          <button onClick={() => handleAction(u, 'delete')} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                            <Trash2 size={16} /> Eliminar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-100 dark:border-zinc-700">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Mostrando página {page} de {totalPages} ({total} usuarios)
            </span>
            <div className="flex items-center gap-2">
              <button 
                disabled={page === 1} 
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 disabled:opacity-50"
              >
                Anterior
              </button>
              <button 
                disabled={page === totalPages} 
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <UserDetailModal 
        open={showDetail} 
        onClose={() => setShowDetail(false)} 
        userId={selectedUser?.id} 
      />

      <EditUserModal 
        open={showEdit} 
        onClose={() => setShowEdit(false)} 
        user={selectedUser} 
        onSaved={loadUsers} 
      />

      {/* Change Role Modal */}
      {selectedUser && (
        <Modal open={showRoleModal} onClose={() => setShowRoleModal(false)} title={`Cambiar Rol: ${selectedUser.fullName}`}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Selecciona el nuevo nivel de acceso para este usuario. Esto impactará inmediatamente en sus permisos.</p>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4285F4] bg-white dark:bg-zinc-800 text-gray-900 dark:text-white capitalize"
            >
              <option value="aprendiz">Aprendiz</option>
              <option value="instructor">Instructor</option>
              <option value="administrador">Administrador</option>
              <option value="super_usuario">Super Usuario</option>
            </select>
            <div className="flex justify-end gap-3 pt-4">
              <button onClick={() => setShowRoleModal(false)} className="btn-secondary">Cancelar</button>
              <button onClick={executeChangeRole} className="btn-primary">Actualizar Rol</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reset Password Confirmation */}
      <ConfirmationModal 
        isOpen={showConfirmReset}
        onClose={() => setShowConfirmReset(false)}
        onConfirm={executeResetPassword}
        title="Forzar Reseteo de Contraseña"
        message={`Se generará una nueva contraseña temporal aleatoria para ${selectedUser?.email}. No podrás revertir esto.`}
        confirmText={`resetear ${selectedUser?.email}`}
      />

      {/* Delete User Confirmation */}
      <ConfirmationModal 
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={executeDelete}
        title="⚠️ Eliminar Usuario Permanente"
        message={`Estás a punto de borrar permanentemente a ${selectedUser?.email} y todos sus registros en la base de datos (cascada). ¡ESTO NO SE PUEDE DESHACER!`}
        confirmText={`eliminar ${selectedUser?.email}`}
      />

    </div>
  );
}
