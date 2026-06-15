const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const uploadMiddleware = require('../middlewares/uploadMiddleware');
const importController = require('../controllers/importController');
const { isAdministradorOrInstructor, isAdministrador } = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

// Descargar plantillas
router.get('/plantilla/aprendices', isAdministradorOrInstructor, importController.downloadPlantillaAprendices);
router.get('/plantilla/competencias', isAdministradorOrInstructor, importController.downloadPlantillaCompetencias);

// Importar archivos
router.post('/ficha/:fichaId/aprendices', isAdministradorOrInstructor, uploadMiddleware.single('file'), importController.importAprendices);
router.post('/ficha/:fichaId/competencias', isAdministradorOrInstructor, uploadMiddleware.single('file'), importController.importCompetencias);

// Importar Ficha completa y Competencias desde Excel (Administrador e Instructor)
router.post('/excel-ficha/parse', isAdministradorOrInstructor, uploadMiddleware.single('file'), importController.parseExcelFicha);
router.post('/excel-ficha/confirm', isAdministradorOrInstructor, importController.confirmExcelFicha);

module.exports = router;
