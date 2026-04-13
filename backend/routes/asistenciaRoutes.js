const express = require('express');
const router = express.Router();
const asistenciaController = require('../controllers/asistenciaController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

router.post('/', roleMiddleware(['instructor']), asistenciaController.createSession);
router.get('/my-history', roleMiddleware(['aprendiz']), asistenciaController.getMyAttendance);
router.get('/materia/:materiaId', asistenciaController.getSessionsByMateria);
router.get('/materia/:materiaId/active', asistenciaController.getActiveSession);
router.get('/:id', asistenciaController.getSessionById);
router.post('/registrar', roleMiddleware(['aprendiz']), asistenciaController.registerAttendance);
router.post('/hardware-register', roleMiddleware(['instructor']), asistenciaController.registerHardwareAttendance);
router.put('/:id/finalizar', roleMiddleware(['instructor']), asistenciaController.endSession);

module.exports = router;
