const express = require('express');
const router = express.Router();
const asistenciaController = require('../controllers/asistenciaController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

router.post('/', roleMiddleware(['instructor']), asistenciaController.createSession);
router.get('/materia/:materiaId', asistenciaController.getSessionsByMateria);
router.post('/registrar', asistenciaController.registerAttendance);
router.put('/:id/finalizar', roleMiddleware(['instructor']), asistenciaController.endSession);

module.exports = router;
