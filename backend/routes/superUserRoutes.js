const express = require('express');
const router = express.Router();
const superUserMiddleware = require('../middlewares/superUserMiddleware');
const superUserController = require('../controllers/superUserController');

// Aplicar middleware a todas las rutas
router.use(superUserMiddleware);

// Dashboard
router.get('/dashboard', superUserController.getDashboard);

// Usuarios
router.get('/usuarios', superUserController.getAllUsers);
router.get('/usuarios/:id', superUserController.getUserDetail);
router.put('/usuarios/:id', superUserController.updateUser);
router.put('/usuarios/:id/tipo', superUserController.changeUserType);
router.post('/usuarios/:id/resetear-password', superUserController.resetUserPassword);
router.put('/usuarios/:id/toggle-status', superUserController.toggleUserStatus);
router.delete('/usuarios/:id', superUserController.deleteUserPermanently);
router.get('/usuarios/:id/historial', superUserController.getUserHistory);

// Fichas
router.get('/fichas', superUserController.getAllFichas);
router.get('/fichas/:id', superUserController.getFichaDetail);
router.post('/fichas', superUserController.createFicha);
router.put('/fichas/:id', superUserController.updateFicha);
router.delete('/fichas/:id', superUserController.deleteFicha);
router.delete('/fichas/:id/permanente', superUserController.deleteFichaPermanently);

// Materias
router.get('/materias', superUserController.getAllMaterias);
router.get('/materias/:id', superUserController.getMateriaDetail);
router.post('/materias', superUserController.createMateria);
router.put('/materias/:id', superUserController.updateMateria);
router.put('/materias/:id/instructor', superUserController.changeInstructorMateria);
router.delete('/materias/:id', superUserController.deleteMateria);
router.delete('/materias/:id/permanente', superUserController.deleteMateriaPermanently);

// Visor de BD
router.get('/database/tables', superUserController.getAllTables);
router.get('/database/tables/:tableName', superUserController.getTableData);
router.post('/database/tables/:tableName', superUserController.createRecord);
router.put('/database/tables/:tableName/:id', superUserController.updateRecord);
router.delete('/database/tables/:tableName/:id', superUserController.deleteRecord);
router.get('/database/tables/:tableName/export', superUserController.exportTableToExcel);

// Excusas
router.get('/excusas', superUserController.getAllExcusas);
router.post('/excusas/:id/aprobar', superUserController.approveExcusa);
router.post('/excusas/:id/rechazar', superUserController.rejectExcusa);
router.delete('/excusas/:id', superUserController.deleteExcusa);

// Backup
router.post('/backup', superUserController.createBackup);

// Logs
router.get('/logs', superUserController.getLogs);
router.get('/logs/:id', superUserController.getLogDetail);

// Super Usuarios
router.get('/super-usuarios', superUserController.getAllSuperUsers);
router.post('/super-usuarios', superUserController.createSuperUser);
router.put('/super-usuarios/:id/toggle-status', superUserController.toggleSuperUserStatus);
router.post('/super-usuarios/:id/resetear-password', superUserController.resetSuperUserPassword);

// Estadísticas
router.get('/estadisticas', superUserController.getStatistics);

module.exports = router;
