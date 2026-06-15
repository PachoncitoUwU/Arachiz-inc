import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import fetchApi from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../context/ToastContext';
import FichaForm from '../../components/FichaForm';
import {
  Users, Plus, Copy, Check, Star, Upload
} from 'lucide-react';

const COLORES = [
  { border: '#4285F4', bg: 'bg-blue-50',   text: 'text-[#4285F4]' },
  { border: '#34A853', bg: 'bg-green-50',  text: 'text-[#34A853]' },
  { border: '#8b5cf6', bg: 'bg-purple-50', text: 'text-purple-600' },
  { border: '#FBBC05', bg: 'bg-yellow-50', text: 'text-yellow-600' },
  { border: '#EA4335', bg: 'bg-red-50',    text: 'text-[#EA4335]' },
];

// ─── FichaCard — tarjeta compacta clickeable ─────────────────────────────────
function FichaCard({ ficha, currentUserId, onViewDetails, color, isPinned }) {
  const [copied, setCopied] = useState(false);

  const copyCode = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(ficha.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCardClick = () => {
    onViewDetails(ficha.id);
  };

  return (
    <div 
      onClick={handleCardClick}
      className="card overflow-hidden transition-all duration-200 cursor-pointer hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]" 
      style={{ borderTopWidth: 3, borderTopColor: color.border }}
    >
      {/* Header de la card */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-bold text-gray-900 dark:text-white  dark:text-white">Ficha {ficha.numero}</span>
            {isPinned && (
              <Star size={16} fill="currentColor" className="text-yellow-500" />
            )}
          </div>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{ficha.nombre}</p>
          <p className="text-xs text-gray-400">{ficha.nivel} · {ficha.centro}</p>
          <p className="text-xs text-gray-400">{ficha.jornada}{ficha.region ? ` · ${ficha.region}` : ''}</p>
        </div>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3  gap-2">
        {[
          { label: 'Aprendices', value: ficha._count?.aprendices || 0 },
          { label: 'Materias', value: ficha._count?.materias || 0 },
          { label: 'Instructores', value: ficha._count?.instructores || 0 },
        ].map(s => (
          <div key={s.label} className="text-center p-2 bg-gray-50 rounded-xl">
            <p className="text-base font-bold text-gray-800">{s.value}</p>
            <p className="text-[10px] text-gray-400 uppercase font-semibold">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
const EMPTY_FORM = { numero: '', nombre: '', nivel: 'Tecnólogo', centro: '', jornada: 'Mañana', region: '', duracion: '', fechaInicio: '', fechaFin: '' };

export default function AdminFichas() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const [fichas, setFichas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalCreate, setModalCreate] = useState(false);
  const [modalJoin, setModalJoin] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [joinCode, setJoinCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Estados para búsqueda y filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [filterNivel, setFilterNivel] = useState('all'); // 'all' | 'Técnico' | 'Tecnólogo'

  // Estados para Importación desde Excel
  const [modalImport, setModalImport] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importJornada, setImportJornada] = useState('Mañana');
  const [importNivel, setImportNivel] = useState('Tecnólogo');
  const [selectedCompIdx, setSelectedCompIdx] = useState(0);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchApi('/admin/fichas');
      
      // Ordenar fichas: ancladas primero
      const pinnedFichas = JSON.parse(localStorage.getItem(`pinnedFichas_${user?.id}`) || '[]');
      const sorted = (data.fichas || []).sort((a, b) => {
        const aIsPinned = pinnedFichas.includes(a.id);
        const bIsPinned = pinnedFichas.includes(b.id);
        
        if (aIsPinned && !bIsPinned) return -1;
        if (!aIsPinned && bIsPinned) return 1;
        return 0;
      });
      
      setFichas(sorted);
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleField = useCallback((key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault(); 
    setError(''); 
    setSaving(true);
    try {
      const data = await fetchApi('/admin/fichas', { 
        method: 'POST', 
        body: JSON.stringify(form) 
      });
      setModalCreate(false); 
      setForm(EMPTY_FORM);
      showToast('Ficha creada exitosamente', 'success'); 
      load();
      // Navegar al detalle de la ficha creada
      navigate(`/admin/fichas/${data.ficha.id}`);
    } catch (err) { 
      setError(err.message); 
    } finally { 
      setSaving(false); 
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault(); 
    setError(''); 
    setSaving(true);
    try {
      await fetchApi(`/admin/join/${joinCode.toUpperCase()}`, { 
        method: 'POST'
      });
      setModalJoin(false); 
      setJoinCode('');
      showToast('Te uniste a la ficha exitosamente', 'success'); 
      load();
    } catch (err) { 
      setError(err.message); 
    } finally { 
      setSaving(false); 
    }
  };

  const handleParseExcel = async () => {
    if (!excelFile) return;
    setError('');
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', excelFile);
      const data = await fetchApi('/import/excel-ficha/parse', {
        method: 'POST',
        body: formData
      });
      setParsedData(data);
      setSelectedCompIdx(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!parsedData) return;
    setError('');
    setImporting(true);
    try {
      const payload = {
        ficha: {
          ...parsedData.ficha,
          jornada: importJornada,
          nivel: importNivel
        },
        competencias: parsedData.competencias
      };
      
      const response = await fetchApi('/import/excel-ficha/confirm', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      showToast('Ficha, competencias y resultados importados exitosamente', 'success');
      setModalImport(false);
      setExcelFile(null);
      setParsedData(null);
      load();
      navigate(`/admin/fichas/${response.ficha.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleViewDetails = (fichaId) => {
    navigate(`/admin/fichas/${fichaId}`);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Fichas de Formación"
        subtitle="Gestiona tus grupos académicos"
        action={
          <div className="flex flex-wrap gap-2 ">
            <button onClick={() => { setModalJoin(true); setError(''); }} className="btn-secondary text-sm md:text-base ">Unirse</button>
            <button onClick={() => { setModalImport(true); setExcelFile(null); setParsedData(null); setError(''); }} className="btn-secondary text-sm md:text-base flex items-center gap-2">
              <Upload size={16} /> Importar Excel
            </button>
            <button onClick={() => { setModalCreate(true); setForm(EMPTY_FORM); setError(''); }} className="btn-primary text-sm md:text-base  flex items-center gap-2">
              <Plus size={16}/> Nueva Ficha
            </button>
          </div>
        }
      />

      {/* Búsqueda y Filtros */}
      {!loading && fichas.length > 0 && (
        <div className="card mb-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Buscar por número, nombre o centro..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <select
                value={filterNivel}
                onChange={(e) => setFilterNivel(e.target.value)}
                className="input-field"
              >
                <option value="all">Todos los niveles</option>
                <option value="Técnico">Técnico</option>
                <option value="Tecnólogo">Tecnólogo</option>
              </select>
            </div>
          </div>
          {(searchQuery || filterNivel !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterNivel('all');
              }}
              className="btn-secondary text-sm md:text-base  text-xs mt-3"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1,2,3].map(i => (
            <div key={i} className="card animate-pulse">
              <div className="h-5 bg-gray-100 rounded w-1/2 mb-3"/>
              <div className="h-10 bg-gray-100 rounded-xl mb-3"/>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3  gap-2">{[1,2,3].map(j => <div key={j} className="h-12 bg-gray-100 rounded-lg"/>)}</div>
            </div>
          ))}
        </div>
      ) : fichas.length === 0 ? (
        <div className="card">
          <EmptyState 
            icon={<Users size={32}/>} 
            title="No tienes fichas aún"
            description="Crea tu primera ficha o únete a una existente con un código de invitación."
            action={<button onClick={() => { setModalCreate(true); setForm(EMPTY_FORM); }} className="btn-primary text-sm md:text-base ">Crear Ficha</button>}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {fichas
            .filter(f => {
              // Filtro de búsqueda
              if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchNumero = f.numero.toString().includes(query);
                const matchNombre = f.nombre?.toLowerCase().includes(query);
                const matchCentro = f.centro?.toLowerCase().includes(query);
                if (!matchNumero && !matchNombre && !matchCentro) return false;
              }
              
              // Filtro de nivel
              if (filterNivel !== 'all' && f.nivel !== filterNivel) return false;
              
              return true;
            })
            .map((f, idx) => {
            const pinnedFichas = JSON.parse(localStorage.getItem(`pinnedFichas_${user?.id}`) || '[]');
            const isPinned = pinnedFichas.includes(f.id);
            
            return (
              <FichaCard 
                key={f.id} 
                ficha={f} 
                currentUserId={user?.id}
                color={COLORES[idx % COLORES.length]}
                onViewDetails={handleViewDetails}
                isPinned={isPinned}
              />
            );
          })}
        </div>
      )}

      <Modal open={modalCreate} onClose={() => setModalCreate(false)} title="Crear Nueva Ficha">
        <FichaForm form={form} onChange={handleField} onSubmit={handleCreate}
          onCancel={() => setModalCreate(false)} saving={saving} error={error} isEdit={false}
          canEditNumero={false} initialForm={null}/>
      </Modal>

      <Modal open={modalJoin} onClose={() => setModalJoin(false)} title="Unirse a una Ficha">
        <form onSubmit={handleJoin} className="space-y-4">
          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <p className="text-sm text-gray-500">Ingresa el código de invitación del líder de la ficha.</p>
          <input 
            required 
            className="input-field text-center font-mono text-lg tracking-widest uppercase"
            placeholder="X7B9K2" 
            value={joinCode} 
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
          />
          <div className="flex flex-wrap gap-3 ">
            <button type="button" onClick={() => setModalJoin(false)} className="btn-secondary text-sm md:text-base  flex-1">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary text-sm md:text-base  flex-1">{saving ? 'Uniéndose...' : 'Unirse'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={modalImport} onClose={() => { setModalImport(false); setParsedData(null); setExcelFile(null); setError(''); setSelectedCompIdx(0); }} title="Importar Ficha desde Excel" maxWidth="max-w-5xl">
        {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</p>}
        
        {!parsedData ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Sube el archivo de reporte general de Excel de SofiaPlus. Extraeremos automáticamente los datos de la Ficha y la lista de Competencias (Materias).
            </p>
            
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 text-center hover:border-indigo-500 transition-colors cursor-pointer relative">
              <input 
                type="file" 
                accept=".xlsx" 
                onChange={e => setExcelFile(e.target.files[0])} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload size={36} className="mx-auto text-gray-400 mb-3 animate-bounce" />
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {excelFile ? excelFile.name : 'Haz clic para seleccionar o arrastra tu archivo Excel (.xlsx)'}
              </p>
              <p className="text-xs text-gray-400 mt-1">Solo se admiten archivos Excel</p>
            </div>

            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={() => { setModalImport(false); setExcelFile(null); }} 
                className="btn-secondary text-sm md:text-base flex-1"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                disabled={!excelFile || importing} 
                onClick={handleParseExcel} 
                className="btn-primary text-sm md:text-base flex-1"
              >
                {importing ? 'Analizando...' : 'Analizar Archivo'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl space-y-3">
              <h4 className="font-bold text-gray-900 dark:text-white border-b pb-2 mb-2">Datos de la Ficha Detectados</h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 dark:text-gray-300">
                <div>
                  <span className="font-semibold text-gray-400 block text-xs">NÚMERO DE FICHA</span>
                  <span className="font-mono text-base font-semibold">{parsedData.ficha.numero}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-400 block text-xs">NOMBRE DEL PROGRAMA</span>
                  <span className="font-semibold">{parsedData.ficha.nombre}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-400 block text-xs">REGIONAL</span>
                  <span>{parsedData.ficha.region || 'No especificada'}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-400 block text-xs">CENTRO DE FORMACIÓN</span>
                  <span>{parsedData.ficha.centro || 'No especificado'}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-400 block text-xs">FECHA INICIO</span>
                  <span>{parsedData.ficha.fechaInicio ? new Date(parsedData.ficha.fechaInicio).toLocaleDateString() : 'No especificada'}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-400 block text-xs">FECHA FIN</span>
                  <span>{parsedData.ficha.fechaFin ? new Date(parsedData.ficha.fechaFin).toLocaleDateString() : 'No especificada'}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Jornada</label>
                <select 
                  value={importJornada} 
                  onChange={e => setImportJornada(e.target.value)} 
                  className="input-field"
                >
                  <option value="Mañana">Mañana</option>
                  <option value="Tarde">Tarde</option>
                  <option value="Nocturna">Nocturna</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Nivel de formación</label>
                <select 
                  value={importNivel} 
                  onChange={e => setImportNivel(e.target.value)} 
                  className="input-field"
                >
                  <option value="Tecnólogo">Tecnólogo</option>
                  <option value="Técnico">Técnico</option>
                </select>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-sm flex items-center gap-2">
                <span>Competencias a crear ({parsedData.competencias?.length || 0})</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="max-h-80 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl p-2 bg-white dark:bg-gray-950 space-y-2">
                  {(parsedData.competencias || []).map((comp, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => setSelectedCompIdx(idx)}
                      className={`w-full text-left text-sm py-3 px-4 rounded-lg border transition-all ${selectedCompIdx === idx ? 'bg-blue-50 border-blue-300 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-200 shadow-sm font-bold' : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-100 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700 hover:border-blue-200 hover:shadow-sm'}`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-blue-500 dark:text-blue-400 mt-0.5">•</span>
                        <p className="line-clamp-2 leading-tight">{comp.nombre}</p>
                      </div>
                    </button>
                  ))}
                  {(!parsedData.competencias || parsedData.competencias.length === 0) && (
                    <p className="text-sm text-gray-400 italic p-3">No se detectaron competencias.</p>
                  )}
                </div>
                
                <div className="max-h-80 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-gray-50 dark:bg-zinc-900 shadow-inner">
                  <h5 className="font-bold text-sm text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2 mb-3">
                    Resultados de Aprendizaje
                  </h5>
                  {parsedData.competencias && parsedData.competencias[selectedCompIdx] ? (
                    <ul className="space-y-3 list-disc pl-5">
                      {parsedData.competencias[selectedCompIdx].resultados?.map((res, rIdx) => (
                        <li key={rIdx} className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed marker:text-blue-500">
                          {res}
                        </li>
                      ))}
                      {(!parsedData.competencias[selectedCompIdx].resultados || parsedData.competencias[selectedCompIdx].resultados.length === 0) && (
                        <li className="text-gray-400 text-sm italic list-none -ml-5">Esta competencia no tiene resultados asignados.</li>
                      )}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Selecciona una competencia a la izquierda para ver sus resultados.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                type="button" 
                disabled={importing} 
                onClick={() => setParsedData(null)} 
                className="btn-secondary text-sm md:text-base flex-1"
              >
                Atrás
              </button>
              <button 
                type="button" 
                disabled={importing} 
                onClick={handleConfirmImport} 
                className="btn-primary text-sm md:text-base flex-1"
              >
                {importing ? 'Importando...' : 'Confirmar Importación'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
