import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, Users, Clock, FileText, X } from 'lucide-react';
import fetchApi from '../services/api';
import { AuthContext } from '../context/AuthContext';

/**
 * GlobalSearch — buscador rápido activado con Ctrl+K
 * Busca fichas, materias y aprendices sin recargar nada.
 * Ligero: solo hace fetch cuando se abre y escribe.
 */
export default function GlobalSearch() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Abrir con Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus automático al abrir
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults([]);
    }
  }, [open]);

  // Buscar con debounce
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearch(query);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const doSearch = async (q) => {
    setLoading(true);
    try {
      const role = user?.userType;
      const prefix = role === 'administrador' ? 'admin' : role;

      // Buscar fichas y materias en paralelo
      const [fichasRes, materiasRes] = await Promise.allSettled([
        fetchApi(`/fichas/my-fichas`),
        fetchApi(`/materias/my-materias`),
      ]);

      const fichas = fichasRes.status === 'fulfilled' ? (fichasRes.value.fichas || []) : [];
      const materias = materiasRes.status === 'fulfilled' ? (materiasRes.value.materias || []) : [];

      const lower = q.toLowerCase();

      const fichaResults = fichas
        .filter(f =>
          String(f.numero).includes(lower) ||
          (f.nombre || '').toLowerCase().includes(lower) ||
          (f.centro || '').toLowerCase().includes(lower)
        )
        .slice(0, 4)
        .map(f => ({
          id: `ficha-${f.id}`,
          type: 'ficha',
          icon: <Users size={16} />,
          label: `Ficha ${f.numero}`,
          sub: f.nombre || f.nivel,
          path: `/${prefix}/fichas/${f.id}`,
        }));

      const materiaResults = materias
        .filter(m => (m.nombre || '').toLowerCase().includes(lower))
        .slice(0, 4)
        .map(m => ({
          id: `materia-${m.id}`,
          type: 'materia',
          icon: <BookOpen size={16} />,
          label: m.nombre,
          sub: `Ficha ${m.ficha?.numero || ''}`,
          path: `/${prefix}/materias`,
        }));

      setResults([...fichaResults, ...materiaResults]);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (path) => {
    setOpen(false);
    navigate(path);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="Buscar (Ctrl+K)"
        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
      >
        <Search size={13} />
        <span>Buscar</span>
        <kbd className="ml-1 text-[10px] bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-1">Ctrl+K</kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-700 overflow-hidden animate-scale-in">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
          <Search size={18} className="text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar fichas, materias..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X size={16} />
            </button>
          )}
          <kbd className="text-[10px] bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded px-1.5 py-0.5 text-gray-400">Esc</kbd>
        </div>

        {/* Resultados */}
        <div className="max-h-72 overflow-y-auto">
          {loading && (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm">
              No se encontraron resultados para "<span className="font-medium">{query}</span>"
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="py-2">
              {results.map(r => (
                <button
                  key={r.id}
                  onClick={() => handleSelect(r.path)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-500 dark:text-gray-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0">
                    {r.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{r.label}</p>
                    {r.sub && <p className="text-xs text-gray-400 truncate">{r.sub}</p>}
                  </div>
                  <span className="text-xs text-gray-300 dark:text-gray-600 capitalize">{r.type}</span>
                </button>
              ))}
            </div>
          )}

          {!loading && query.length < 2 && (
            <div className="px-4 py-6 text-center text-gray-400 text-xs">
              Escribe al menos 2 caracteres para buscar
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
