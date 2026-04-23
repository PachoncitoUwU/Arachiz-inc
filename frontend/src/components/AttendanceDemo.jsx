import React, { useState } from 'react';
import { 
  Play, 
  Smartphone, 
  Camera, 
  Fingerprint, 
  Wifi, 
  UserCheck,
  CheckCircle2,
  Clock,
  Users,
  Zap
} from 'lucide-react';

export default function AttendanceDemo() {
  const [activeDemo, setActiveDemo] = useState(null);
  const [demoStep, setDemoStep] = useState(0);

  const demoScenarios = [
    {
      id: 'complete-hardware',
      name: 'Aula con Hardware Completo',
      description: 'Lector NFC/huella + cámara disponible',
      icon: Fingerprint,
      color: 'bg-purple-500',
      steps: [
        'Sistema detecta lector NFC/huella conectado',
        'Detecta cámara con permisos',
        'Prioriza hardware serial como método principal',
        'Ofrece reconocimiento facial como respaldo',
        'Estudiante acerca tarjeta NFC → Registro instantáneo',
        'Si no tiene tarjeta → Reconocimiento facial automático'
      ]
    },
    {
      id: 'camera-only',
      name: 'Solo Cámara Disponible',
      description: 'Computadora con cámara web',
      icon: Camera,
      color: 'bg-blue-500',
      steps: [
        'Sistema detecta cámara disponible',
        'Verifica caras registradas en la base de datos',
        'Activa reconocimiento facial automáticamente',
        'Genera código QR para estudiantes sin cara registrada',
        'Detección facial a 3 FPS para velocidad óptima',
        'Registro manual como respaldo'
      ]
    },
    {
      id: 'mobile-instructor',
      name: 'Instructor con Móvil',
      description: 'Tablet/celular con NFC',
      icon: Smartphone,
      color: 'bg-green-500',
      steps: [
        'Detecta soporte Web NFC API',
        'Verifica cámara frontal disponible',
        'Ofrece NFC móvil como opción principal',
        'Código QR para otros estudiantes',
        'Registro manual mejorado con selección múltiple',
        'Interfaz optimizada para pantalla táctil'
      ]
    },
    {
      id: 'basic-setup',
      name: 'Configuración Básica',
      description: 'Solo navegador web',
      icon: UserCheck,
      color: 'bg-gray-500',
      steps: [
        'No detecta hardware especial',
        'Activa registro manual mejorado',
        'Búsqueda instantánea de estudiantes',
        'Selección múltiple con Ctrl+A',
        'Registro masivo paralelo',
        'Vista en cuadrícula y lista'
      ]
    }
  ];

  const startDemo = (scenarioId) => {
    setActiveDemo(scenarioId);
    setDemoStep(0);
  };

  const nextStep = () => {
    const scenario = demoScenarios.find(s => s.id === activeDemo);
    if (demoStep < scenario.steps.length - 1) {
      setDemoStep(demoStep + 1);
    } else {
      setActiveDemo(null);
      setDemoStep(0);
    }
  };

  const resetDemo = () => {
    setActiveDemo(null);
    setDemoStep(0);
  };

  if (activeDemo) {
    const scenario = demoScenarios.find(s => s.id === activeDemo);
    const Icon = scenario.icon;
    
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-12 h-12 rounded-xl ${scenario.color} flex items-center justify-center`}>
              <Icon size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {scenario.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {scenario.description}
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
              <span>Paso {demoStep + 1} de {scenario.steps.length}</span>
              <span>{Math.round(((demoStep + 1) / scenario.steps.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${scenario.color}`}
                style={{ width: `${((demoStep + 1) / scenario.steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Current Step */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full ${scenario.color} flex items-center justify-center flex-shrink-0 mt-1`}>
                <span className="text-white font-bold text-sm">{demoStep + 1}</span>
              </div>
              <div>
                <p className="text-gray-900 dark:text-white font-medium">
                  {scenario.steps[demoStep]}
                </p>
                
                {/* Visual indicators for specific steps */}
                {scenario.steps[demoStep].includes('detecta') && (
                  <div className="flex items-center gap-2 mt-3 text-sm text-green-600 dark:text-green-400">
                    <CheckCircle2 size={16} />
                    <span>Hardware detectado correctamente</span>
                  </div>
                )}
                
                {scenario.steps[demoStep].includes('Registro') && (
                  <div className="flex items-center gap-2 mt-3 text-sm text-blue-600 dark:text-blue-400">
                    <Clock size={16} />
                    <span>Proceso completado en &lt;2 segundos</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* All Steps Preview */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">
              Flujo Completo:
            </h3>
            <div className="space-y-2">
              {scenario.steps.map((step, index) => (
                <div 
                  key={index}
                  className={`flex items-center gap-3 text-sm p-2 rounded-lg transition-all ${
                    index <= demoStep 
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                    index <= demoStep 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                  }`}>
                    {index < demoStep ? '✓' : index + 1}
                  </div>
                  <span className={index === demoStep ? 'font-medium' : ''}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={resetDemo}
              className="btn-secondary"
            >
              Cerrar Demo
            </button>
            <button
              onClick={nextStep}
              className="btn-primary flex items-center gap-2"
            >
              {demoStep < scenario.steps.length - 1 ? (
                <>Siguiente Paso</>
              ) : (
                <>Finalizar Demo</>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Zap size={32} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Sistema de Asistencia Inteligente
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Descubre cómo el sistema se adapta automáticamente a tu hardware disponible
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {demoScenarios.map(scenario => {
          const Icon = scenario.icon;
          return (
            <button
              key={scenario.id}
              onClick={() => startDemo(scenario.id)}
              className="p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all text-left group"
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg ${scenario.color} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={20} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 mb-1">
                    {scenario.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {scenario.description}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-blue-600 dark:text-blue-400">
                    <Play size={12} />
                    <span>Ver demostración</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Users size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">
              Ventajas del Sistema Inteligente
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• <strong>Detección automática</strong> de hardware disponible</li>
              <li>• <strong>Priorización inteligente</strong> de métodos más eficientes</li>
              <li>• <strong>Respaldo múltiple</strong> para garantizar registro exitoso</li>
              <li>• <strong>Interfaz adaptativa</strong> según capacidades del dispositivo</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}