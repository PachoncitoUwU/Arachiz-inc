/**
 * Versión y notas de actualización de Arachiz
 * Se actualiza con cada cambio importante del sistema
 */

export const VERSION = '1.4.311';

export const RELEASE_NOTES = [
  {
    version: '1.4.311',
    date: '2026-06-14',
    title: 'Actualización 1.4.311',
    changes: [
      'Merge branch main of https://github.com/PachoncitoUwU/Arachiz-inc',
      'ya quite eso cansonsonsonn'
    ]
  },
  {
    version: '1.4.308',
    date: '2026-06-14',
    title: 'Actualización 1.4.308',
    changes: [
      'Merge branch main of https://github.com/PachoncitoUwU/Arachiz-inc',
      'ashh la extraño'
    ]
  },
  {
    version: '1.4.305',
    date: '2026-06-14',
    title: 'Actualización 1.4.305',
    changes: [
      'Merge branch main of https://github.com/PachoncitoUwU/Arachiz-inc',
      'soy una mariposotaa'
    ]
  },
  {
    version: '1.5.0',
    date: '2026-06-11',
    title: 'Importación de Excel y Restricciones de Fichas',
    changes: [
      'Importación completa de Ficha y sus Materias directamente desde reportes de Excel de SofiaPlus',
      'Limpieza automática de códigos y prefijos numéricos de regionales y competencias de materias',
      'Flujo de previsualización interactivo en el frontend para validar datos de ficha y materias',
      'Selectores dinámicos en importación para configurar la Jornada y el Nivel de Formación',
      'Soporte extendido de archivos Excel (.xlsx, .xls) y CSV (.csv) en el middleware del servidor',
      'Restricción de edición del número de ficha (solo permitido para Superusuario con validación de duplicados)',
      'Validación de cambios sin guardar con modal de confirmación en formularios de Ficha',
      'Inclusión visual de fechas de inicio y fin en detalles e información general de Ficha'
    ]
  },
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
