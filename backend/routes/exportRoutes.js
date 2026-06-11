const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
const authMiddleware = require('../middlewares/authMiddleware');
const { roleMiddleware } = require('../middlewares/roleMiddleware');

router.use(authMiddleware);
router.use(roleMiddleware(['instructor']));

router.get('/ficha/:fichaId/asistencia', exportController.exportAsistenciaFicha);
router.get('/ficha/:fichaId/info', exportController.exportFichaInfo);
router.get('/ficha/:fichaId/info/pdf', exportController.exportFichaInfoPdf);
router.get('/session/:sessionId/asistencia', exportController.exportSessionAsistencia);
router.get('/materia/:materiaId/rango', exportController.exportAsistenciaRango);
router.get('/materia/:materiaId/consolidado', exportController.exportReporteConsolidado);

module.exports = router;
