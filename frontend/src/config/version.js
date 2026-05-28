/**
 * Versión y notas de actualización de Arachiz
 * Se actualiza con cada cambio importante del sistema
 */

export const VERSION = '1.4.220';

export const RELEASE_NOTES = [
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
