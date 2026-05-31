import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { RELEASE_NOTES } from '../config/version';

export default function ReleaseNotesModal({ open, onClose }) {
  const [expandedVersion, setExpandedVersion] = useState(RELEASE_NOTES[0].version);

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-zinc-800  dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6  border-b border-gray-200 dark:border-zinc-700  dark:border-gray-800 shrink-0">
          <div>
            <h2 className="text-xl md:text-2xl  font-bold text-gray-900 dark:text-white  dark:text-white">Notas de Actualización</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Historial de cambios y mejoras</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4 md:p-6  space-y-4">
          {RELEASE_NOTES.map((release) => (
            <div
              key={release.version}
              className="border border-gray-200 dark:border-zinc-700  dark:border-gray-800 rounded-xl overflow-hidden hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
            >
              {/* Release Header */}
              <button
                onClick={() => setExpandedVersion(
                  expandedVersion === release.version ? null : release.version
                )}
                className="w-full p-4 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-gray-900 dark:text-white  dark:text-white">
                      v{release.version}
                    </h3>
                    {release === RELEASE_NOTES[0] && (
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold rounded-full">
                        Última
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {release.title}
                    </p>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(release.date).toLocaleDateString('es-CO', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
                {expandedVersion === release.version ? (
                  <ChevronUp size={20} className="text-gray-600 dark:text-gray-400 ml-2 shrink-0" />
                ) : (
                  <ChevronDown size={20} className="text-gray-600 dark:text-gray-400 ml-2 shrink-0" />
                )}
              </button>

              {/* Release Details */}
              {expandedVersion === release.version && (
                <div className="p-4 bg-white dark:bg-zinc-800  dark:bg-gray-900 border-t border-gray-200 dark:border-zinc-700  dark:border-gray-800">
                  <ul className="space-y-2">
                    {release.changes.map((change, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="text-blue-500 dark:text-blue-400 font-bold mt-0.5">✓</span>
                        <span className="text-gray-700 dark:text-gray-300 text-sm">
                          {change}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-zinc-700  dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
