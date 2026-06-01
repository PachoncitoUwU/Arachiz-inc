const fs = require('fs');
const path = 'C:\\Users\\LENOVO\\Documents\\Arachiz-inc\\frontend\\src\\pages\\admin\\Reportes.jsx';

let content = fs.readFileSync(path, 'utf8');

const startMarker = "{/* VISTA DE ESTADÍSTICAS */}";
const endMarker = "{/* Modal para reporte de materia */}";

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  const newContent = `
      {/* VISTA DE SESIONES */}
      {vistaActual === 'sesiones' && (
        <div className="space-y-5">
          {/* Filtros */}
          <div className="card p-4 md:p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Filter size={20} /> Filtros de Búsqueda
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="input-label">Ficha</label>
                <select
                  value={fichaSeleccionadaVista}
                  onChange={handleFichaVistaChange}
                  className="input-field"
                >
                  <option value="">Seleccione una ficha...</option>
                  {fichas.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.numero} - {f.nombre.substring(0, 30)}...
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="input-label">Materia</label>
                <select
                  value={materiaSeleccionadaVista}
                  onChange={(e) => {
                    setMateriaSeleccionadaVista(e.target.value);
                    setSesiones([]);
                  }}
                  disabled={!fichaSeleccionadaVista || materiasVista.length === 0}
                  className="input-field"
                >
                  <option value="">Seleccione una materia...</option>
                  {materiasVista.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.nombre} - {m.instructor?.fullName || 'Sin asignar'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="input-label">Fecha Desde</label>
                <input
                  type="date"
                  value={filtroFechaDesde}
                  onChange={e => setFiltroFechaDesde(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="input-label">Fecha Hasta</label>
                <input
                  type="date"
                  value={filtroFechaHasta}
                  onChange={e => setFiltroFechaHasta(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>
            
          </div>

          {/* Resultados de Sesiones */}
          {materiaSeleccionadaVista && (
            <div className="card">
              <div className="p-4 md:p-6 border-b border-gray-200 dark:border-zinc-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Calendar size={20} /> 
                    Sesiones Encontradas ({sesiones.length})
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Listado de sesiones de asistencia registradas
                  </p>
                </div>
                
                {sesiones.length > 0 && (
                  <button
                    onClick={async () => {
                      try {
                        setDownloading(\`materia-\${materiaSeleccionadaVista}\`);
                        showToast('Generando reporte de asistencias...', 'info');
                        const params = new URLSearchParams();
                        if (filtroFechaDesde) params.append('fechaDesde', filtroFechaDesde);
                        if (filtroFechaHasta) params.append('fechaHasta', filtroFechaHasta);
                        const response = await fetch(
                          \`\${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/admin/reportes/materia/\${materiaSeleccionadaVista}?\${params.toString()}\`,
                          { headers: { 'Authorization': \`Bearer \${localStorage.getItem('token')}\` } }
                        );
                        if (!response.ok) throw new Error('Error al generar reporte');
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = \`Asistencias_\${Date.now()}.xlsx\`;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                        showToast('Reporte descargado exitosamente', 'success');
                      } catch (err) {
                        showToast('Error descargando reporte', 'error');
                      } finally {
                        setDownloading(null);
                      }
                    }}
                    disabled={downloading === \`materia-\${materiaSeleccionadaVista}\`}
                    className="btn-secondary text-sm flex items-center gap-2"
                  >
                    <Download size={16} />
                    {downloading === \`materia-\${materiaSeleccionadaVista}\` ? 'Generando...' : 'Descargar Materia Completa'}
                  </button>
                )}
              </div>

              <div className="p-4 md:p-6">
                {loadingSesiones ? (
                  <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl" />
                    ))}
                  </div>
                ) : sesiones.length === 0 ? (
                  <EmptyState
                    icon={<Calendar size={48} />}
                    title="No se encontraron sesiones"
                    description="Ajusta los filtros o selecciona otra materia"
                  />
                ) : (
                  <div className="space-y-4">
                    {sesiones.map(sesion => (
                      <div key={sesion.id} className="border border-gray-200 dark:border-zinc-700 rounded-xl overflow-hidden">
                        {/* Cabecera Sesión */}
                        <div 
                          className="p-4 bg-gray-50 dark:bg-gray-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          onClick={() => setSesionExpandida(sesionExpandida === sesion.id ? null : sesion.id)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                              <Clock size={20} />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 dark:text-white">
                                {new Date(sesion.fecha).toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' })}
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
                            
                            <div className="text-gray-400">
                              {sesionExpandida === sesion.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </div>
                          </div>
                        </div>

                        {/* Detalle Aprendices (Expandible) */}
                        {sesionExpandida === sesion.id && (
                          <div className="p-4 border-t border-gray-200 dark:border-zinc-700 bg-white dark:bg-gray-900">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Detalle de Aprendices</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                              {sesion.aprendices.map(aprendiz => (
                                <div key={aprendiz.id} className="flex items-center justify-between p-2 rounded-lg border border-gray-100 dark:border-gray-800">
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                      {aprendiz.nombre}
                                    </span>
                                    <span className="text-xs text-gray-500">{aprendiz.documento}</span>
                                  </div>
                                  <div className="ml-2 flex-shrink-0">
                                    {aprendiz.presente ? (
                                      <CheckCircle2 size={18} className="text-green-500" />
                                    ) : (
                                      <XCircle size={18} className="text-red-500" />
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      `;

  const finalContent = content.substring(0, startIndex) + newContent + content.substring(endIndex);
  fs.writeFileSync(path, finalContent, 'utf8');
  console.log('Update complete');
} else {
  console.log('Markers not found');
}
