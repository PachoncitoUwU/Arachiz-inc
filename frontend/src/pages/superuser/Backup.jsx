import React, { useState } from 'react';
import { Download, AlertTriangle, ShieldCheck } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { superUserApi } from '../../services/superUserApi';
import { useToast } from '../../context/ToastContext';

export default function Backup() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleDownloadBackup = async () => {
    try {
      setLoading(true);
      showToast('Generando backup completo del sistema, esto puede tardar un momento...', 'info');
      
      const blob = await superUserApi.createBackup();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `arachiz_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      showToast('Backup descargado correctamente', 'success');
    } catch (err) {
      showToast('Error al generar el backup', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Copias de Seguridad (Backup)" 
        subtitle="Genera una descarga local en formato JSON con toda la información crítica del sistema" 
      />

      <div className="max-w-3xl bg-white dark:bg-zinc-800 rounded-xl shadow-card border border-gray-100 dark:border-zinc-700 overflow-hidden">
        <div className="p-6 md:p-8 space-y-6">
          
          <div className="flex items-center gap-4 text-orange-600 bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-200 dark:border-orange-900/50">
            <AlertTriangle size={24} className="shrink-0" />
            <div>
              <h4 className="font-bold">Información Sensible</h4>
              <p className="text-sm mt-1">
                El archivo generado contendrá datos personales de usuarios, aprendices, registros de asistencia y contraseñas cifradas. Guárdalo en un entorno seguro y encriptado.
              </p>
            </div>
          </div>

          <div className="space-y-4 text-gray-600 dark:text-gray-300">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="text-blue-500" /> ¿Qué incluye este Backup?
            </h3>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>Todos los usuarios registrados en el sistema (Administradores, Instructores, Aprendices).</li>
              <li>Todas las Fichas y Materias creadas.</li>
              <li>El historial completo e inmutable de Asistencias (NFC).</li>
              <li>Estructura base de horarios.</li>
            </ul>
          </div>

          <div className="pt-6 border-t border-gray-100 dark:border-zinc-700 flex justify-center">
            <button 
              onClick={handleDownloadBackup}
              disabled={loading}
              className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Download size={20} />
              )}
              {loading ? 'Generando Archivo...' : 'Descargar Backup Completo'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
