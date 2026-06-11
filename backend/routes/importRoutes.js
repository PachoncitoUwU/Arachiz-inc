const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const uploadMiddleware = require('../middlewares/uploadMiddleware');
const importController = require('../controllers/importController');
const { isAdministradorOrInstructor, isAdministrador } = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

// Descargar plantillas
router.get('/plantilla/aprendices', isAdministradorOrInstructor, importController.downloadPlantillaAprendices);
router.get('/plantilla/materias', isAdministradorOrInstructor, importController.downloadPlantillaMaterias);

// Importar archivos
router.post('/ficha/:fichaId/aprendices', isAdministradorOrInstructor, uploadMiddleware.single('file'), importController.importAprendices);
router.post('/ficha/:fichaId/materias', isAdministradorOrInstructor, uploadMiddleware.single('file'), importController.importMaterias);

// Importar Ficha y Materias desde Excel completo (Solo Administrador)
router.post('/excel-ficha/parse', isAdministrador, uploadMiddleware.single('file'), importController.parseExcelFicha);
router.post('/excel-ficha/confirm', isAdministrador, importController.confirmExcelFicha);

module.exports = router;
