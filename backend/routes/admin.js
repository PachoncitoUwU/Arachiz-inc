const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { isAdministrador } = require('../middlewares/roleMiddleware');
const { isAdminDeFicha } = require('../middlewares/adminMiddleware');
const adminController = require('../controllers/adminController');

// Todas las rutas requieren autenticación y rol de administrador
router.use(authMiddleware);
router.use(isAdministrador);

// =====================================================
// RUTAS DE FICHAS
// =====================================================

// Obtener todas las fichas del administrador
router.get('/fichas', adminController.getFichasAdmin);

// Crear una nueva ficha
router.post('/fichas', adminController.crearFicha);

// Unirse a una ficha con código
router.post('/join/:code', adminController.unirseAFicha);

// Obtener detalle de una ficha específica
router.get('/fichas/:fichaId', isAdminDeFicha, adminController.getFichaDetalle);

// Actualizar información de una ficha
router.put('/fichas/:fichaId', isAdminDeFicha, adminController.actualizarFicha);

// Eliminar ficha completa
router.delete('/fichas/:fichaId', isAdminDeFicha, adminController.eliminarFicha);

// Regenerar código de invitación
router.post('/fichas/:fichaId/regenerate-code', isAdminDeFicha, adminController.regenerarCodigoFicha);

// Eliminar aprendiz de una ficha
router.delete('/fichas/:fichaId/aprendices/:aprendizId', isAdminDeFicha, adminController.eliminarAprendizDeFicha);

// Eliminar instructor de una ficha
router.delete('/fichas/:fichaId/instructores/:instructorId', isAdminDeFicha, adminController.eliminarInstructorDeFicha);

// Salir de una ficha (cualquier rol)
router.post('/fichas/:fichaId/salir', adminController.salirDeFicha);

// Cambiar el líder de una ficha
router.put('/fichas/:fichaId/cambiar-lider', isAdminDeFicha, adminController.cambiarLiderFicha);

// =====================================================
// RUTAS DE MATERIAS
// =====================================================

// Cambiar el instructor de una materia
router.put('/materias/:materiaId/cambiar-instructor', adminController.cambiarInstructorMateria);

// =====================================================
// RUTAS DE USUARIOS
// =====================================================

// Obtener instructores (opcionalmente filtrado por fichaId)
router.get('/instructores', adminController.getInstructores);

// Obtener aprendices (opcionalmente filtrado por fichaId)
router.get('/aprendices', adminController.getAprendices);

// Obtener todas las fichas de un aprendiz
router.get('/aprendices/:aprendizId/fichas', adminController.getFichasDeAprendiz);

// Obtener todas las fichas de un instructor
router.get('/instructores/:instructorId/fichas', adminController.getFichasDeInstructor);

// Obtener conflictos de un instructor
router.get('/instructores/:instructorId/conflictos', adminController.getConflictosDeInstructor);

// Obtener horarios de un instructor
router.get('/instructores/:instructorId/horarios', adminController.getHorariosDeInstructor);

// Obtener materias de un instructor
router.get('/instructores/:instructorId/materias', adminController.getMateriasDeInstructor);

// =====================================================
// RUTAS DE EXCUSAS
// =====================================================

// Obtener todas las excusas (con filtros)
router.get('/excusas', adminController.getExcusasAdmin);

// Obtener estadísticas de excusas
router.get('/excusas/estadisticas', adminController.getEstadisticasExcusas);

// =====================================================
// RUTAS DE REPORTES
// =====================================================

const reporteController = require('../controllers/reporteController');

// Generar reporte de una ficha
router.get('/reportes/ficha/:fichaId', reporteController.generarReporteFicha);

// Generar reporte de asistencias de una materia
router.get('/reportes/materia/:materiaId', reporteController.generarReporteMateria);

// Generar reporte consolidado
router.get('/reportes/consolidado', reporteController.generarReporteConsolidado);

// Obtener estadísticas avanzadas
router.get('/reportes/estadisticas', reporteController.getEstadisticasReportes);

// =====================================================
// RUTAS DE PAPELERA
// =====================================================

const papeleraController = require('../controllers/papeleraController');

// Obtener elementos de la papelera
router.get('/papelera', papeleraController.getPapelera);

// Recuperar elemento de la papelera
router.post('/papelera/:id/recuperar', papeleraController.recuperarElemento);

// Eliminar permanentemente de la papelera
router.delete('/papelera/:id/eliminar', papeleraController.eliminarPermanentemente);

module.exports = router;
