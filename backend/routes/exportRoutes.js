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
router.get('/resultado/:resultadoId/rango', exportController.exportAsistenciaRango);
router.get('/resultado/:resultadoId/consolidado', exportController.exportReporteConsolidado);
router.get('/competencia/:competenciaId/consolidado', exportController.exportReporteCompetencia);

module.exports = router;
