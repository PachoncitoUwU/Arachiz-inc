const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.use(authMiddleware);
router.use(roleMiddleware(['instructor']));

router.get('/ficha/:fichaId/asistencia', exportController.exportAsistenciaFicha);
router.get('/session/:sessionId/asistencia', exportController.exportSessionAsistencia);

module.exports = router;
