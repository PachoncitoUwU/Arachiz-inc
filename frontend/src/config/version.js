/**
 * Versión y notas de actualización de Arachiz
 * Se actualiza con cada cambio importante del sistema
 */

export const VERSION = '1.4.263';

export const RELEASE_NOTES = [
  {
    version: '1.4.263',
    date: '2026-05-31',
    title: 'Modo Oscuro, Responsividad y Biometría',
    changes: [
      'Modo oscuro global y automático aplicado a más de 35 páginas y 24 componentes clave',
      'Actualización del diseño de Landing Page y Sobre Nosotros a un esquema Zinc consistente',
      'Optimización responsiva móvil en 34 páginas y 18 componentes del sistema',
      'Rediseño adaptativo y optimización de la tabla de horarios para dispositivos móviles',
      'Mejoras de precisión en reconocimiento facial, sensores NFC y registro de asistencia',
      'Añadida animación interactiva de burbujas en la interfaz de usuario',
      'Logotipo interactivo de Arachiz que redirige directamente a la Landing Page'
    ]
  },
  {
    version: '1.4.220',
    date: '2026-05-27',
    title: 'Perfiles y Configuración',
    changes: [
      'Todos los usuarios pueden ver y editar sus perfiles',
      'Cada rol tiene su propia sección de configuración',
      'Sistema de versionado con notas de actualización',
      'Nuevo modal de información de versión',
      'Mejoras en la interfaz de configuración'
    ]
  },
  {
    version: '1.4.219',
    date: '2026-05-26',
    title: 'Corrección de Rutas',
    changes: [
      'Corregido problema de redirección en botón de configuración del administrador',
      'Mapeo correcto de rutas para diferentes roles',
      'Mejoras en la navegación del sidebar'
    ]
  },
  {
    version: '1.4.218',
    date: '2026-05-25',
    title: 'Interfaz de Usuario',
    changes: [
      'Mejoras en el diseño del sidebar',
      'Optimización de componentes de navegación',
      'Mejor soporte para modo oscuro'
    ]
  }
];

export const getLatestReleaseNotes = () => RELEASE_NOTES[0];

export const getReleaseNotesByVersion = (version) => 
  RELEASE_NOTES.find(note => note.version === version);
