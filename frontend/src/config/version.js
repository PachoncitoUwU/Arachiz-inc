/**
 * Versión y notas de actualización de Arachiz
 * Se actualiza con cada cambio importante del sistema
 */

export const VERSION = '1.4.335';

export const RELEASE_NOTES = [
  {
    version: '1.4.335',
    date: '2026-06-15',
    title: 'Actualización 1.4.335',
    changes: [
      'caja hongito'
    ]
  },
  {
    version: '1.4.333',
    date: '2026-06-15',
    title: 'Actualización 1.4.333',
    changes: [
      'feat: replace caja_deadpool model with hongito suabe in presentation'
    ]
  },
  {
    version: '1.4.331',
    date: '2026-06-15',
    title: 'Actualización 1.4.331',
    changes: [
      'yerba'
    ]
  },
  {
    version: '1.4.329',
    date: '2026-06-14',
    title: 'Actualización 1.4.329',
    changes: [
      'Fiebre Mundialista',
      'feat: Implementar modo mundialista con toggle, balones Copa Mundial y loading animado'
    ]
  },
  {
    version: '1.4.327',
    date: '2026-06-14',
    title: 'Fiebre Mundialista ⚽',
    changes: [
      '⚽ Modo Mundialista: Activa/desactiva el tema del mundial con un solo click',
      '🎨 Logo dinámico: Cambia entre logo Arachiz y logo con gorra de Colombia',
      '🏆 Balones Copa Mundial: Balones flotantes interactivos reemplazan burbujas',
      '⚡ Efecto de patada: Los balones vuelan al hacer click (modo mundial)',
      '💥 Efecto de explosión: Burbujas explotan en partículas (modo base)',
      '🎮 Loading animado: Balón rebotando con chispas al tocar el suelo',
      '🔄 Persistencia: El modo elegido se guarda automáticamente',
      '🎯 Toggle fácil: Botón ⚽ junto al modo oscuro en todas las vistas'
    ]
  },
  {
    version: '1.4.326',
    date: '2026-06-14',
    title: 'Actualización 1.4.326',
    changes: [
      'feat: show connection badges in asistencia page header'
    ]
  },
  {
    version: '1.4.322',
    date: '2026-06-14',
    title: 'Actualización 1.4.322',
    changes: [
      'agregue nuevo logo en esquina superior derecha de sobre nosotros'
    ]
  },
  {
    version: '1.4.320',
    date: '2026-06-14',
    title: 'Actualización 1.4.320',
    changes: [
      'Merge pull request #55 from PachoncitoUwU/TodoloFue',
      'porfin se arreglo ese pefil',
      'feat: add ArachizAssist AI chatbot + presentation tooltips'
    ]
  },
  {
    version: '1.4.316',
    date: '2026-06-14',
    title: 'Actualización 1.4.316',
    changes: [
      'feat: sistema de notificaciones + cache de sesiones + mejoras en escaner facial'
    ]
  },
  {
    version: '1.4.314',
    date: '2026-06-14',
    title: 'Actualización 1.4.314',
    changes: [
      'Merge branch main of https://github.com/PachoncitoUwU/Arachiz-inc',
      'velocidad como el rayo mcqueen pichauuuu ⚡⚡'
    ]
  },
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
