import React, { useState, useEffect } from 'react';
import fetchApi from '../../services/api';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import { useToast } from '../../context/ToastContext';
import { FileText, Check, X, Clock, CheckCircle, XCircle, Eye, Paperclip } from 'lucide-react';

const STATUS_MAP = {
  Pendiente: { badge: 'badge-pending', icon: Clock },
  Aprobada:  { badge: 'badge-success', icon: CheckCircle },
  Rechazada: { badge: 'badge-danger',  icon: XCircle },
};

export default function InstructorExcusas() {
  const { showToast } = useToast();
  const [excusas, setExcusas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Todas');
  const [selected, setSelected] = useState(null);
  const [respuesta, setRespuesta] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const d = await fetchApi('/excusas');
      setExcusas(d.excusas);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleUpdate = async (id, estado) => {
    setSaving(true);
    try {
      await fetchApi(`/excusas/${id}/estado`, {
        method: 'PUT',
        body: JSON.stringify({ estado, respuesta: respuesta || `Excusa ${estado.toLowerCase()} por el instructor.` })
      });
      setSelected(null);
      setRespuesta('');
      showToast(`Excusa ${estado.toLowerCase()} correctamente`, estado === 'Aprobada' ? 'success' : 'warning');
      load();
    } catch (err) { showToast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const filtered = filter === 'Todas' ? excusas : excusas.filter(e => e.estado === filter);
  const counts = {
    Todas: excusas.length,
    Pendiente: excusas.filter(e => e.estado === 'Pendiente').length,
    Aprobada: excusas.filter(e => e.estado === 'Aprobada').length,
    Rechazada: excusas.filter(e => e.estado === 'Rechazada').length,
  };

  const parseFechas = (fechas) => {
    try { return JSON.parse(fechas); } catch { return [fechas]; }
  };

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader title="Evaluación de Excusas" subtitle="Revisa y responde las excusas de inasistencia" />

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(counts).map(([key, count]) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === key
                ? 'bg-[#4285F4] text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            {key} <span className="ml-1 opacity-70">({count})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-[#4285F4] border-t-transparent rounded-full animate-spin"/>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState icon={<FileText size={32}/>} title="Sin excusas" description="No hay excusas en esta categoría." />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(excusa => {
            const { badge, icon: Icon } = STATUS_MAP[excusa.estado] || STATUS_MAP.Pendiente;
            const fechas = parseFechas(excusa.fechas);
            return (
              <div key={excusa.id} className="card hover:shadow-card transition-all">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-bold text-gray-900">{excusa.aprendiz?.fullName}</span>
                      <span className="text-gray-400 text-xs">{excusa.aprendiz?.document}</span>
                      <span className={badge}><Icon size={12}/> {excusa.estado}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-700">{excusa.motivo}</p>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{excusa.descripcion}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {fechas.map((f, i) => (
                        <span key={i} className="badge badge-gray">{f}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span>Enviada: {new Date(excusa.createdAt).toLocaleDateString('es-CO')}</span>
                      {excusa.archivoUrl && (
                        <a href={`http://localhost:3000${excusa.archivoUrl}`} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1 text-[#4285F4] hover:underline">
                          <Paperclip size={12}/> Ver adjunto
                        </a>
                      )}
                    </div>
                    {excusa.respuesta && (
                      <div className="mt-2 p-2.5 bg-gray-50 rounded-lg border-l-2 border-[#4285F4]">
                        <p className="text-xs text-gray-500 font-medium mb-0.5">Respuesta del instructor:</p>
                        <p className="text-xs text-gray-700">{excusa.respuesta}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => { setSelected(excusa); setRespuesta(''); }}
                      className="btn-ghost btn-icon" title="Ver detalle">
                      <Eye size={16}/>
                    </button>
                    {excusa.estado === 'Pendiente' && (
                      <>
                        <button onClick={() => { setSelected(excusa); setRespuesta(''); }}
                          className="btn-success btn-icon" title="Aprobar">
                          <Check size={16}/>
                        </button>
                        <button onClick={() => handleUpdate(excusa.id, 'Rechazada')}
                          className="btn-danger btn-icon" title="Rechazar">
                          <X size={16}/>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal responder */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Responder Excusa">
        {selected && (
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-sm font-semibold text-gray-800">{selected.aprendiz?.fullName}</p>
              <p className="text-sm text-gray-600 mt-1">{selected.motivo}</p>
              <p className="text-sm text-gray-500 mt-1">{selected.descripcion}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {parseFechas(selected.fechas).map((f, i) => (
                  <span key={i} className="badge badge-gray">{f}</span>
                ))}
              </div>
            </div>
            <div>
              <label className="input-label">Comentario (opcional)</label>
              <textarea rows={3} className="input-field resize-none"
                placeholder="Escribe un comentario para el aprendiz..."
                value={respuesta} onChange={e => setRespuesta(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => handleUpdate(selected.id, 'Rechazada')} disabled={saving}
                className="btn-danger flex-1">
                <X size={16}/> Rechazar
              </button>
              <button onClick={() => handleUpdate(selected.id, 'Aprobada')} disabled={saving}
                className="btn-success flex-1">
                <Check size={16}/> Aprobar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
