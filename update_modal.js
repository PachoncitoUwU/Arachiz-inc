const fs = require('fs');
const path = 'C:\\Users\\LENOVO\\Documents\\Arachiz-inc\\frontend\\src\\pages\\admin\\Reportes.jsx';

let content = fs.readFileSync(path, 'utf8');

// Replace state
content = content.replace(
  "const [sesionExpandida, setSesionExpandida] = useState(null);",
  "const [sesionSeleccionada, setSesionSeleccionada] = useState(null);"
);

// Replace spinner
const oldSpinner = `{loadingSesiones ? (
                  <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl" />
                    ))}
                  </div>
                ) : sesiones.length === 0 ? (`;
const newSpinner = `{loadingSesiones ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <Loader2 size={48} className="animate-spin text-red-500" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Cargando sesiones...</p>
                  </div>
                ) : sesiones.length === 0 ? (`;
content = content.replace(oldSpinner, newSpinner);

// Replace mapping block
const oldMappingStart = `<div className="space-y-4">
                    {sesiones.map(sesion => (
                      <div key={sesion.id} className="border border-gray-200 dark:border-zinc-700 rounded-xl overflow-hidden">`;

const oldMappingEnd = `                        )}
                      </div>
                    ))}
                  </div>`;

// Regex to replace everything inside the space-y-4 block where the mapping happens
const regex = /<div className="space-y-4">\s*\{sesiones\.map\(sesion => \([\s\S]*?\)\)}\s*<\/div>/;

const newMapping = `<div className="space-y-4">
                    {sesiones.map(sesion => (
                      <div key={sesion.id} className="border border-gray-200 dark:border-zinc-700 rounded-xl overflow-hidden">
                        {/* Cabecera Sesión */}
                        <div 
                          className="p-4 bg-white dark:bg-gray-900 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          onClick={() => setSesionSeleccionada(sesion)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                              <Clock size={20} />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 dark:text-white">
                                {sesion.fechaReal || new Date(sesion.fecha).toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' })}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Instructor: {sesion.instructor}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-sm text-gray-500 dark:text-gray-400">Asistencia</p>
                              <p className="font-bold text-gray-900 dark:text-white">
                                {sesion.totalPresentes} / {sesion.totalEsperados} ({sesion.porcentajeAsistencia}%)
                              </p>
                            </div>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const materiaObj = materiasVista.find(m => m.id === materiaSeleccionadaVista);
                                handleDownloadReporteSesionIndividual(sesion.id, materiaObj?.nombre || 'Materia', sesion.fecha);
                              }}
                              disabled={downloading === \`sesion-\${sesion.id}\`}
                              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-500 transition-colors"
                              title="Descargar Sesión Individual"
                            >
                              <FileText size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>`;

content = content.replace(regex, newMapping);

// Add the new modal before the last </div>
const modalComponent = `
      {/* Modal para detalles de la sesión seleccionada */}
      {sesionSeleccionada && (
        <Modal
          open={!!sesionSeleccionada}
          onClose={() => setSesionSeleccionada(null)}
          title="Detalles de la Sesión"
        >
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
            
            {/* Header info */}
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Fecha y Hora</p>
                <p className="font-bold text-gray-900 dark:text-white">
                  {sesionSeleccionada.fechaReal || new Date(sesionSeleccionada.fecha).toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Instructor</p>
                <p className="font-bold text-gray-900 dark:text-white">{sesionSeleccionada.instructor}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Duración</p>
                <p className="font-bold text-gray-900 dark:text-white">
                  {sesionSeleccionada.duracion ? \`\${sesionSeleccionada.duracion} minutos\` : 'No especificada'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Asistencia</p>
                <p className="font-bold text-gray-900 dark:text-white">
                  {sesionSeleccionada.totalPresentes} / {sesionSeleccionada.totalEsperados} ({sesionSeleccionada.porcentajeAsistencia}%)
                </p>
              </div>
            </div>

            {/* Lista de aprendices */}
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-3">Lista de Aprendices</h4>
              <div className="border border-gray-200 dark:border-zinc-700 rounded-xl overflow-hidden overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                  <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase font-semibold text-gray-500 dark:text-gray-400">
                    <tr>
                      <th className="px-4 py-3 whitespace-nowrap">Aprendiz</th>
                      <th className="px-4 py-3 whitespace-nowrap">Documento</th>
                      <th className="px-4 py-3 whitespace-nowrap">Estado</th>
                      <th className="px-4 py-3 whitespace-nowrap">Método</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                    {sesionSeleccionada.aprendices.map(aprendiz => (
                      <tr key={aprendiz.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">{aprendiz.nombre}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{aprendiz.documento}</td>
                        <td className="px-4 py-3 whitespace-nowrap flex items-center">
                          {aprendiz.presente ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              <CheckCircle2 size={14} /> Presente
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                              <XCircle size={14} /> Ausente
                            </span>
                          )}
                          {aprendiz.tarde && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 ml-2 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                              Tarde
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 capitalize whitespace-nowrap">{aprendiz.metodo || 'Manual'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6 border-t border-gray-200 dark:border-zinc-700 pt-4">
            <button
              onClick={() => setSesionSeleccionada(null)}
              className="btn-secondary"
            >
              Cerrar
            </button>
            <button
              onClick={() => {
                const materiaObj = materiasVista.find(m => m.id === materiaSeleccionadaVista);
                handleDownloadReporteSesionIndividual(sesionSeleccionada.id, materiaObj?.nombre || 'Materia', sesionSeleccionada.fecha);
              }}
              disabled={downloading === \`sesion-\${sesionSeleccionada.id}\`}
              className="btn-primary flex items-center gap-2"
            >
              <FileText size={18} />
              <span>{downloading === \`sesion-\${sesionSeleccionada.id}\` ? 'Descargando...' : 'Descargar Excel'}</span>
            </button>
          </div>
        </Modal>
      )}

    </div>
  );
}
`;

content = content.replace(/\s*<\/div>\s*<\/div>\s*\);\s*}\s*$/, modalComponent);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully updated Reportes.jsx modal logic');
