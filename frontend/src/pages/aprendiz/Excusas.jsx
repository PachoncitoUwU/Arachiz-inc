import React, { useState, useEffect } from 'react';
import fetchApi from '../../services/api';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import { Send, Clock, CheckCircle, XCircle, Plus, Trash2, Paperclip, Eye } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

const STATUS_MAP = {
  Pendiente: { badge: 'badge-pending', icon: Clock },
  Aprobada:  { badge: 'badge-success', icon: CheckCircle },
  Rechazada: { badge: 'badge-danger',  icon: XCircle },
};

const MOTIVOS = ['Incapacidad Médica', 'Calamidad Doméstica', 'Problemas de Conectividad', 'Motivos Laborales', 'Otro'];

export default function AprendizExcusas() {
  const [excusas, setExcusas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const [form, setForm] = useState({ motivo: 'Incapacidad Médica', descripcion: '', fechas: [''] });
  const [archivo, setArchivo] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { t } = useSettings();

  const load = async () => {
    try {
      setLoading(true);
      const d = await fetchApi('/excusas/my-excusas');
      setExcusas(d.excusas);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const addFecha = () => setForm(prev => ({ ...prev, fechas: [...prev.fechas, ''] }));
  const removeFecha = (i) => setForm(prev => ({ ...prev, fechas: prev.fechas.filter((_, idx) => idx !== i) }));
  const updateFecha = (i, val) => setForm(prev => {
    const fechas = [...prev.fechas];
    fechas[i] = val;
    return { ...prev, fechas };
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      const validFechas = form.fechas.filter(f => f.trim());
      if (validFechas.length === 0) throw new Error('Agrega al menos una fecha');

      const body = new FormData();
      body.append('motivo', form.motivo);
      body.append('descripcion', form.descripcion);
      body.append('fechas', JSON.stringify(validFechas));
      if (archivo) body.append('archivo', archivo);

      await fetchApi('/excusas', { method: 'POST', body });
      setModal(false);
      setForm({ motivo: 'Incapacidad Médica', descripcion: '', fechas: [''] });
      setArchivo(null);
      load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const parseFechas = (fechas) => {
    try { return JSON.parse(fechas); } catch { return [fechas]; }
  };

  const counts = {
    total: excusas.length,
    pendientes: excusas.filter(e => e.estado === 'Pendiente').length,
    aprobadas: excusas.filter(e => e.estado === 'Aprobada').length,
    rechazadas: excusas.filter(e => e.estado === 'Rechazada').length,
  };

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader
        title={t('excuses.title')}
        subtitle={t('excuses.subtitle')}
        action={
          <button onClick={() => { setModal(true); setError(''); }} className="btn-primary flex items-center gap-2">
            <Plus size={16}/> {t('excuses.new')}
          </button>
        }
      />

      {/* Resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: counts.total, cls: 'bg-gray-50 text-gray-700' },
          { label: t('excuses.pending'), value: counts.pendientes, cls: 'bg-yellow-50 text-yellow-700' },
          { label: t('excuses.approved'), value: counts.aprobadas, cls: 'bg-green-50 text-[#34A853]' },
          { label: t('excuses.rejected'), value: counts.rechazadas, cls: 'bg-red-50 text-[#EA4335]' },
        ].map(s => (
          <div key={s.label} className={`card-sm text-center ${s.cls}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-[#4285F4] border-t-transparent rounded-full animate-spin"/>
        </div>
      ) : excusas.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Send size={32}/>}
            title={t('excuses.emptyTitle')}
            description={t('excuses.emptyDesc')}
            action={<button onClick={() => setModal(true)} className="btn-primary">{t('excuses.new')}</button>}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {excusas.map(excusa => {
            const { badge, icon: Icon } = STATUS_MAP[excusa.estado] || STATUS_MAP.Pendiente;
            const fechas = parseFechas(excusa.fechas);
            return (
              <div key={excusa.id} className="card hover:shadow-card transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-bold text-gray-900">{excusa.motivo}</span>
                      <span className={badge}><Icon size={12}/> {excusa.estado}</span>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2">{excusa.descripcion}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {fechas.map((f, i) => <span key={i} className="badge badge-gray">{f}</span>)}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Enviada: {new Date(excusa.createdAt).toLocaleDateString('es-CO')}
                      {excusa.respondedAt && ` · Respondida: ${new Date(excusa.respondedAt).toLocaleDateString('es-CO')}`}
                    </p>
                    {excusa.respuesta && (
                      <div className="mt-2 p-2.5 bg-gray-50 rounded-lg border-l-2 border-[#4285F4]">
                        <p className="text-xs text-gray-500 font-medium mb-0.5">Respuesta del instructor:</p>
                        <p className="text-xs text-gray-700">{excusa.respuesta}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {excusa.archivoUrl && (
                      <a href={`http://localhost:3000${excusa.archivoUrl}`} target="_blank" rel="noreferrer"
                        className="btn-icon text-[#4285F4] hover:bg-blue-50" title="Ver adjunto">
                        <Paperclip size={15}/>
                      </a>
                    )}
                    <button onClick={() => setDetalle(excusa)} className="btn-icon text-gray-400 hover:bg-gray-100">
                      <Eye size={15}/>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal nueva excusa */}
      <Modal open={modal} onClose={() => setModal(false)} title="Enviar Excusa" maxWidth="max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div>
            <label className="input-label">Motivo</label>
            <select required className="input-field" value={form.motivo}
              onChange={e => setForm({...form, motivo: e.target.value})}>
              {MOTIVOS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="input-label">Descripción</label>
            <textarea required rows={3} className="input-field resize-none"
              placeholder="Explica brevemente la razón de tu inasistencia..."
              value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="input-label mb-0">Fechas de Inasistencia</label>
              <button type="button" onClick={addFecha}
                className="text-xs text-[#4285F4] hover:underline flex items-center gap-1">
                <Plus size={12}/> Agregar fecha
              </button>
            </div>
            <div className="space-y-2">
              {form.fechas.map((f, i) => (
                <div key={i} className="flex gap-2">
                  <input type="date" required className="input-field flex-1" value={f}
                    onChange={e => updateFecha(i, e.target.value)} />
                  {form.fechas.length > 1 && (
                    <button type="button" onClick={() => removeFecha(i)}
                      className="btn-icon text-red-400 hover:bg-red-50">
                      <Trash2 size={14}/>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="input-label">Archivo Adjunto (opcional)</label>
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) setArchivo(file);
              }}
              onClick={() => document.getElementById('file-input-excusa').click()}
              className={`relative flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                archivo ? 'border-[#34A853] bg-green-50' : 'border-gray-200 hover:border-[#4285F4] hover:bg-blue-50/30'
              }`}
            >
              <input
                id="file-input-excusa"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="hidden"
                onChange={e => setArchivo(e.target.files[0])}
              />
              {archivo ? (
                <>
                  <CheckCircle size={22} className="text-[#34A853]"/>
                  <p className="text-sm font-medium text-[#34A853]">{archivo.name}</p>
                  <button type="button" onClick={e => { e.stopPropagation(); setArchivo(null); }}
                    className="text-xs text-red-400 hover:underline">Quitar archivo</button>
                </>
              ) : (
                <>
                  <Paperclip size={22} className="text-gray-400"/>
                  <p className="text-sm text-gray-500">Arrastra un archivo aquí o <span className="text-[#4285F4] font-medium">haz clic para seleccionar</span></p>
                  <p className="text-xs text-gray-400">PDF, JPG, PNG, DOC · Máx. 5MB</p>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              <Send size={14}/> {saving ? 'Enviando...' : 'Enviar Excusa'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal detalle */}
      <Modal open={!!detalle} onClose={() => setDetalle(null)} title="Detalle de Excusa">
        {detalle && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900">{detalle.motivo}</span>
              {(() => { const { badge, icon: Icon } = STATUS_MAP[detalle.estado]; return <span className={badge}><Icon size={12}/>{detalle.estado}</span>; })()}
            </div>
            <p className="text-sm text-gray-600">{detalle.descripcion}</p>
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Fechas justificadas:</p>
              <div className="flex flex-wrap gap-1">
                {parseFechas(detalle.fechas).map((f, i) => <span key={i} className="badge badge-gray">{f}</span>)}
              </div>
            </div>
            {detalle.archivoUrl && (
              <a href={`http://localhost:3000${detalle.archivoUrl}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 text-sm text-[#4285F4] hover:underline">
                <Paperclip size={14}/> Ver archivo adjunto
              </a>
            )}
            <div className="text-xs text-gray-400 space-y-0.5">
              <p>Enviada: {new Date(detalle.createdAt).toLocaleDateString('es-CO')}</p>
              {detalle.respondedAt && <p>Respondida: {new Date(detalle.respondedAt).toLocaleDateString('es-CO')}</p>}
            </div>
            {detalle.respuesta && (
              <div className="p-3 bg-gray-50 rounded-xl border-l-2 border-[#4285F4]">
                <p className="text-xs font-semibold text-gray-500 mb-1">Respuesta del instructor:</p>
                <p className="text-sm text-gray-700">{detalle.respuesta}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
