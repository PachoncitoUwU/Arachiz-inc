import React, { useEffect, useState, useRef } from 'react';
import { FileText, CheckCircle, XCircle, Trash2, MoreVertical } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { superUserApi } from '../../services/superUserApi';
import { useToast } from '../../context/ToastContext';
import ConfirmationModal from '../../components/superuser/ConfirmationModal';
import Modal from '../../components/Modal';

export default function Excusas() {
  const { showToast } = useToast();
  const [excusas, setExcusas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownRef = useRef(null);

  const [selectedExcusa, setSelectedExcusa] = useState(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyType, setReplyType] = useState(''); // 'approve' | 'reject'
  const [respuesta, setRespuesta] = useState('');
  
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    loadExcusas();
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setActiveDropdown(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadExcusas = async () => {
    try {
      setLoading(true);
      const data = await superUserApi.getAllExcusas();
      setExcusas(data);
    } catch (err) {
      showToast('Error cargando excusas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openReply = (excusa, type) => {
    setActiveDropdown(null);
    setSelectedExcusa(excusa);
    setReplyType(type);
    setRespuesta(excusa.respuesta || '');
    setShowReplyModal(true);
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    try {
      if (replyType === 'approve') {
        await superUserApi.approveExcusa(selectedExcusa.id, respuesta);
        showToast('Excusa aprobada', 'success');
      } else {
        await superUserApi.rejectExcusa(selectedExcusa.id, respuesta);
        showToast('Excusa rechazada', 'success');
      }
      setShowReplyModal(false);
      loadExcusas();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const confirmDelete = (excusa) => {
    setActiveDropdown(null);
    setSelectedExcusa(excusa);
    setShowDelete(true);
  };

  const executeDelete = async () => {
    try {
      await superUserApi.deleteExcusa(selectedExcusa.id);
      showToast('Excusa eliminada', 'success');
      setShowDelete(false);
      loadExcusas();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Gestión de Excusas" subtitle="Audita, aprueba o rechaza cualquier excusa del sistema" />

      <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-card border border-gray-100 dark:border-zinc-700 overflow-visible">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Cargando excusas...</div>
        ) : excusas.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No hay excusas registradas.</div>
        ) : (
          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 dark:bg-zinc-900/50 text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-zinc-700">
                <tr>
                  <th className="px-6 py-4 font-semibold text-sm">Fecha</th>
                  <th className="px-6 py-4 font-semibold text-sm">Aprendiz</th>
                  <th className="px-6 py-4 font-semibold text-sm">Materia/Ficha</th>
                  <th className="px-6 py-4 font-semibold text-sm">Estado</th>
                  <th className="px-6 py-4 font-semibold text-sm text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-700">
                {excusas.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(e.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900 dark:text-white">{e.aprendiz?.fullName}</p>
                      <p className="text-sm text-gray-500">{e.aprendiz?.document}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      <p>{e.materia?.nombre}</p>
                      <p className="text-sm text-gray-500">Ficha: {e.materia?.ficha?.numero}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold
                        ${e.estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          e.estado === 'Aprobada' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}
                      `}>
                        {e.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center relative">
                      <button 
                        onClick={() => setActiveDropdown(activeDropdown === e.id ? null : e.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700"
                      >
                        <MoreVertical size={20} />
                      </button>

                      {activeDropdown === e.id && (
                        <div ref={dropdownRef} className="absolute right-8 top-10 w-48 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-gray-100 dark:border-zinc-700 z-50 py-2">
                          {e.estado === 'Pendiente' && (
                            <>
                              <button onClick={() => openReply(e, 'approve')} className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 flex items-center gap-2">
                                <CheckCircle size={16} /> Aprobar
                              </button>
                              <button onClick={() => openReply(e, 'reject')} className="w-full text-left px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 flex items-center gap-2">
                                <XCircle size={16} /> Rechazar
                              </button>
                              <div className="h-px bg-gray-100 dark:bg-zinc-700 my-1"></div>
                            </>
                          )}
                          <button onClick={() => confirmDelete(e)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
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

      <Modal open={showReplyModal} onClose={() => setShowReplyModal(false)} title={replyType === 'approve' ? 'Aprobar Excusa' : 'Rechazar Excusa'}>
        <form onSubmit={handleReplySubmit} className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {replyType === 'approve' ? 'Estás a punto de aprobar esta excusa. Puedes dejar un comentario opcional para el aprendiz.' : 'Estás a punto de rechazar esta excusa. Es recomendable dejar un motivo.'}
          </p>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Comentario / Respuesta (Opcional)</label>
            <textarea 
              value={respuesta} 
              onChange={e => setRespuesta(e.target.value)} 
              rows={3} 
              className="w-full mt-1 p-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700 resize-none focus:ring-2 focus:ring-[#4285F4]"
              placeholder="Ej: Justificación aceptada..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setShowReplyModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className={`px-4 py-2 text-sm font-semibold text-white rounded-xl ${replyType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
              Confirmar
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal 
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={executeDelete}
        title="Eliminar Excusa"
        message="¿Estás seguro de que quieres eliminar esta excusa de la base de datos?"
        confirmText="eliminar excusa"
      />
    </div>
  );
}
