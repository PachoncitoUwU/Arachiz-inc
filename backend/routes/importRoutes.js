const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const uploadMiddleware = require('../middlewares/uploadMiddleware');
const importController = require('../controllers/importController');
const { isAdministradorOrInstructor } = require('../middlewares/roleMiddleware');

router.use(authMiddleware);
router.use(isAdministradorOrInstructor);

// Descargar plantillas
router.get('/plantilla/aprendices', importController.downloadPlantillaAprendices);
router.get('/plantilla/materias', importController.downloadPlantillaMaterias);

// Importar archivos
router.post('/ficha/:fichaId/aprendices', uploadMiddleware.single('file'), importController.importAprendices);
router.post('/ficha/:fichaId/materias', uploadMiddleware.single('file'), importController.importMaterias);

module.exports = router;
