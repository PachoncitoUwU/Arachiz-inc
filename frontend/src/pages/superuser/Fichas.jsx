import React, { useEffect, useState, useRef } from 'react';
import { FolderOpen, Plus, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { superUserApi } from '../../services/superUserApi';
import { useToast } from '../../context/ToastContext';
import ConfirmationModal from '../../components/superuser/ConfirmationModal';
import Modal from '../../components/Modal';

export default function Fichas() {
  const { showToast } = useToast();
  const [fichas, setFichas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownRef = useRef(null);

  const [selectedFicha, setSelectedFicha] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  
  const [formData, setFormData] = useState({ numero: '', nombre: '', nivel: '', centro: '' });

  useEffect(() => {
    loadFichas();
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setActiveDropdown(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadFichas = async () => {
    try {
      setLoading(true);
      const data = await superUserApi.getAllFichas();
      setFichas(data);
    } catch (err) {
      showToast('Error al cargar fichas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (ficha = null) => {
    setActiveDropdown(null);
    setSelectedFicha(ficha);
    if (ficha) {
      setFormData({
        numero: ficha.numero || '',
        nombre: ficha.nombre || '',
        nivel: ficha.nivel || '',
        centro: ficha.centro || ''
      });
    } else {
      setFormData({ numero: '', nombre: '', nivel: '', centro: '' });
    }
    setShowEdit(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (selectedFicha) {
        await superUserApi.updateFicha(selectedFicha.id, formData);
        showToast('Ficha actualizada', 'success');
      } else {
        await superUserApi.createFicha(formData);
        showToast('Ficha creada', 'success');
      }
      setShowEdit(false);
      loadFichas();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const confirmDelete = (ficha) => {
    setActiveDropdown(null);
    setSelectedFicha(ficha);
    setShowDelete(true);
  };

  const executeDelete = async () => {
    try {
      await superUserApi.deleteFichaPermanently(selectedFicha.id);
      showToast('Ficha eliminada', 'success');
      setShowDelete(false);
      loadFichas();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader title="Gestión de Fichas" subtitle="Control absoluto de los grupos de formación" />
        <button onClick={() => openEdit(null)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Nueva Ficha
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-card border border-gray-100 dark:border-zinc-700 overflow-visible">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Cargando...</div>
        ) : fichas.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No hay fichas registradas.</div>
        ) : (
          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 dark:bg-zinc-900/50 text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-zinc-700">
                <tr>
                  <th className="px-6 py-4 font-semibold text-sm">Ficha</th>
                  <th className="px-6 py-4 font-semibold text-sm">Programa</th>
                  <th className="px-6 py-4 font-semibold text-sm">Nivel</th>
                  <th className="px-6 py-4 font-semibold text-sm text-center">Aprendices</th>
                  <th className="px-6 py-4 font-semibold text-sm text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-700">
                {fichas.map(f => (
                  <tr key={f.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{f.numero}</td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900 dark:text-white font-medium">{f.nombre}</p>
                      <p className="text-sm text-gray-500">{f.centro}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{f.nivel}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-3 py-1 rounded-full font-bold text-xs">
                        {f._count?.aprendices || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center relative">
                      <button 
                        onClick={() => setActiveDropdown(activeDropdown === f.id ? null : f.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700"
                      >
                        <MoreVertical size={20} />
                      </button>

                      {activeDropdown === f.id && (
                        <div ref={dropdownRef} className="absolute right-8 top-10 w-48 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-gray-100 dark:border-zinc-700 z-50 py-2">
                          <button onClick={() => openEdit(f)} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 flex items-center gap-2">
                            <Edit2 size={16} /> Editar
                          </button>
                          <div className="h-px bg-gray-100 dark:bg-zinc-700 my-1"></div>
                          <button onClick={() => confirmDelete(f)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
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
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title={selectedFicha ? 'Editar Ficha' : 'Nueva Ficha'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Número de Ficha</label>
            <input type="text" required value={formData.numero} onChange={e => setFormData({...formData, numero: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nombre del Programa</label>
            <input type="text" required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nivel</label>
              <input type="text" required value={formData.nivel} onChange={e => setFormData({...formData, nivel: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Centro</label>
              <input type="text" value={formData.centro} onChange={e => setFormData({...formData, centro: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setShowEdit(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Guardar</button>
          </div>
        </form>
      </Modal>

      {/* Delete Ficha Confirmation */}
      <ConfirmationModal 
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={executeDelete}
        title="⚠️ Eliminar Ficha Permanente"
        message={`Estás a punto de borrar permanentemente la ficha ${selectedFicha?.numero} y todos sus registros. ¡ESTO NO SE PUEDE DESHACER!`}
        confirmText={`eliminar ${selectedFicha?.numero}`}
      />
    </div>
  );
}
