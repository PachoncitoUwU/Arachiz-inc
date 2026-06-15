import React, { useEffect, useState, useRef } from 'react';
import { BookOpen, Plus, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { superUserApi } from '../../services/superUserApi';
import { useToast } from '../../context/ToastContext';
import ConfirmationModal from '../../components/superuser/ConfirmationModal';
import Modal from '../../components/Modal';

export default function Materias() {
  const { showToast } = useToast();
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownRef = useRef(null);

  const [selectedMateria, setSelectedMateria] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  
  const [formData, setFormData] = useState({ nombre: '', codigo: '', creditos: 0, fichaId: '', instructorId: '' });

  useEffect(() => {
    loadMaterias();
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setActiveDropdown(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadMaterias = async () => {
    try {
      setLoading(true);
      const data = await superUserApi.getAllMaterias();
      setMaterias(data);
    } catch (err) {
      showToast('Error al cargar materias', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (mat = null) => {
    setActiveDropdown(null);
    setSelectedMateria(mat);
    if (mat) {
      setFormData({
        nombre: mat.nombre || '',
        codigo: mat.codigo || '',
        creditos: mat.creditos || 0,
        fichaId: mat.fichaId || '',
        instructorId: mat.instructorId || ''
      });
    } else {
      setFormData({ nombre: '', codigo: '', creditos: 0, fichaId: '', instructorId: '' });
    }
    setShowEdit(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const dataToSave = { ...formData, creditos: parseInt(formData.creditos) };
      if (selectedMateria) {
        await superUserApi.updateMateria(selectedMateria.id, dataToSave);
        showToast('Competencia actualizada', 'success');
      } else {
        await superUserApi.createMateria(dataToSave);
        showToast('Competencia creada', 'success');
      }
      setShowEdit(false);
      loadMaterias();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const confirmDelete = (mat) => {
    setActiveDropdown(null);
    setSelectedMateria(mat);
    setShowDelete(true);
  };

  const executeDelete = async () => {
    try {
      await superUserApi.deleteMateriaPermanently(selectedMateria.id);
      showToast('Competencia eliminada', 'success');
      setShowDelete(false);
      loadMaterias();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader title="Gestión de Competencias" subtitle="Administra las competencias y asignaciones globales" />
        <button onClick={() => openEdit(null)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Nueva Competencia
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-card border border-gray-100 dark:border-zinc-700 overflow-visible">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Cargando...</div>
        ) : materias.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No hay competencias registradas.</div>
        ) : (
          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 dark:bg-zinc-900/50 text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-zinc-700">
                <tr>
                  <th className="px-6 py-4 font-semibold text-sm">Competencia</th>
                  <th className="px-6 py-4 font-semibold text-sm">Ficha</th>
                  <th className="px-6 py-4 font-semibold text-sm">Instructor</th>
                  <th className="px-6 py-4 font-semibold text-sm text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-700">
                {materias.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900 dark:text-white">{m.nombre}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Código: {m.codigo || '-'}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {m.ficha?.numero || '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {m.instructor?.fullName || 'Sin Asignar'}
                    </td>
                    <td className="px-6 py-4 text-center relative">
                      <button 
                        onClick={() => setActiveDropdown(activeDropdown === m.id ? null : m.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700"
                      >
                        <MoreVertical size={20} />
                      </button>

                      {activeDropdown === m.id && (
                        <div ref={dropdownRef} className="absolute right-8 top-10 w-48 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-gray-100 dark:border-zinc-700 z-50 py-2">
                          <button onClick={() => openEdit(m)} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 flex items-center gap-2">
                            <Edit2 size={16} /> Editar
                          </button>
                          <div className="h-px bg-gray-100 dark:bg-zinc-700 my-1"></div>
                          <button onClick={() => confirmDelete(m)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
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
      </div>

      {/* Edit/Create Modal */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title={selectedMateria ? 'Editar Competencia' : 'Nueva Competencia'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nombre de la Competencia</label>
            <input type="text" required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Código</label>
              <input type="text" value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Créditos</label>
              <input type="number" value={formData.creditos} onChange={e => setFormData({...formData, creditos: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">ID Ficha</label>
            <input type="text" required value={formData.fichaId} onChange={e => setFormData({...formData, fichaId: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">ID Instructor (Opcional)</label>
            <input type="text" value={formData.instructorId} onChange={e => setFormData({...formData, instructorId: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700" />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setShowEdit(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Guardar</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmationModal 
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={executeDelete}
        title="⚠️ Eliminar Competencia Permanente"
        message={`Estás a punto de borrar la competencia ${selectedMateria?.nombre}. ¡ESTO NO SE PUEDE DESHACER!`}
        confirmText={`eliminar ${selectedMateria?.nombre}`}
      />
    </div>
  );
}
