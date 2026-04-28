import React, { useEffect, useState } from 'react';
import { Trash2, RotateCcw, X, AlertTriangle, Filter } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../context/ToastContext';
import fetchApi from '../../services/api';

export default function AdminPapelera() {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState('all');

  useEffect(() => {
    loadPapelera();
  }, [filtroTipo]);

  const loadPapelera = async () => {
    try {
      setLoading(true);
      const params = filtroTipo !== 'all' ? `?tipo=${filtroTipo}` : '';
      const data = await fetchApi(`/admin/papelera${params}`);
      setItems(data.items || []);
    } catch (err) {
      console.error('Error cargando papelera:', err);
      showToast('Error cargando papelera', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (item) => {
    try {
      await fetchApi(`/admin/papelera/${item.id}/recuperar`, {
        method: 'POST'
      });
      
      const nombreElemento = item.datosOriginales?.fullName || 
                            item.datosOriginales?.nombre || 
                            item.datosOriginales?.numero || 
                            'Elemento';
      
      showToast(`${nombreElemento} restaurado exitosamente`, 'success');
      setItems(items.filter(i => i.id !== item.id));
    } catch (err) {
      showToast(err.message || 'Error restaurando elemento', 'error');
    }
  };

  const handleDeletePermanently = async () => {
    if (!selectedItem) return;
    
    try {
      await fetchApi(`/admin/papelera/${selectedItem.id}/eliminar`, {
        method: 'DELETE'
      });
      
      const nombreElemento = selectedItem.datosOriginales?.fullName || 
                            selectedItem.datosOriginales?.nombre || 
                            selectedItem.datosOriginales?.numero || 
                            'Elemento';
      
      showToast(`${nombreElemento} eliminado permanentemente`, 'success');
      setItems(items.filter(i => i.id !== selectedItem.id));
      setShowDeleteModal(false);
      setSelectedItem(null);
    } catch (err) {
      showToast(err.message || 'Error eliminando elemento', 'error');
    }
  };

  const getTipoColor = (tipo) => {
    switch (tipo) {
      case 'aprendiz': return 'bg-green-100 text-green-600';
      case 'instructor': return 'bg-blue-100 text-blue-600';
      case 'materia': return 'bg-purple-100 text-purple-600';
      case 'ficha': return 'bg-orange-100 text-orange-600';
      case 'ficha_anterior': return 'bg-gray-100 text-gray-600';
      case 'horario': return 'bg-yellow-100 text-yellow-600';
      case 'excusa': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getTipoLabel = (tipo) => {
    switch (tipo) {
      case 'aprendiz': return 'Aprendiz';
      case 'instructor': return 'Instructor';
      case 'materia': return 'Materia';
      case 'ficha': return 'Ficha';
      case 'ficha_anterior': return 'Ficha Anterior';
      case 'horario': return 'Horario';
      case 'excusa': return 'Excusa';
      default: return tipo;
    }
  };

  const getNombreElemento = (item) => {
    const datos = item.datosOriginales;
    if (!datos) return 'Sin nombre';
    
    return datos.fullName || datos.nombre || datos.numero || 
           `${datos.dia} ${datos.horaInicio}-${datos.horaFin}` || 
           'Sin nombre';
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const tiposDisponibles = [
    { value: 'all', label: 'Todos los elementos' },
    { value: 'ficha', label: 'Fichas' },
    { value: 'ficha_anterior', label: 'Fichas Anteriores' },
    { value: 'materia', label: 'Materias' },
    { value: 'instructor', label: 'Instructores' },
    { value: 'aprendiz', label: 'Aprendices' },
    { value: 'horario', label: 'Horarios' },
    { value: 'excusa', label: 'Excusas' }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Papelera"
        subtitle="Elementos eliminados que pueden ser restaurados"
      />

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-card p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtrar por tipo:</span>
          </div>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            {tiposDisponibles.map(tipo => (
              <option key={tipo.value} value={tipo.value}>
                {tipo.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Cargando papelera...</div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Trash2 size={48} className="text-gray-400" />}
          title="Papelera vacía"
          description={filtroTipo === 'all' ? 
            "No hay elementos eliminados" : 
            `No hay ${tiposDisponibles.find(t => t.value === filtroTipo)?.label.toLowerCase()} eliminados`
          }
        />
      ) : (
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ficha</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Eliminado</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Por</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getTipoColor(item.tipoElemento)}`}>
                        {getTipoLabel(item.tipoElemento)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {getNombreElemento(item)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {item.ficha ? `${item.ficha.numero} - ${item.ficha.nombre}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatearFecha(item.fechaEliminacion)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {item.usuario?.fullName || 'Usuario eliminado'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleRestore(item)}
                          className="btn-icon text-green-600 hover:bg-green-50"
                          title="Restaurar"
                        >
                          <RotateCcw size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setShowDeleteModal(true);
                          }}
                          className="btn-icon text-red-600 hover:bg-red-50"
                          title="Eliminar permanentemente"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación permanente */}
      {showDeleteModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Eliminar Permanentemente</h3>
                <p className="text-sm text-gray-500">Esta acción no se puede deshacer</p>
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-800">
                ¿Estás seguro de que deseas eliminar permanentemente <strong>{getNombreElemento(selectedItem)}</strong>?
              </p>
              <p className="text-xs text-red-600 mt-2">
                Esta acción eliminará todos los datos asociados y no podrá ser revertida.
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedItem(null);
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeletePermanently}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Eliminar Permanentemente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
