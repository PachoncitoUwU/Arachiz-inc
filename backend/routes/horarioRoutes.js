const express = require('express');
const router = express.Router();
const horarioController = require('../controllers/horarioController');
const authMiddleware = require('../middlewares/authMiddleware');
const { roleMiddleware } = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

router.get('/my-horarios', roleMiddleware(['instructor']), horarioController.getMyHorarios);
router.get('/ficha/:fichaId', horarioController.getHorarioByFicha);
router.post('/', roleMiddleware(['instructor']), horarioController.createHorario);
router.put('/:id', roleMiddleware(['instructor']), horarioController.updateHorario);
router.delete('/:id', roleMiddleware(['instructor']), horarioController.deleteHorario);

module.exports = router;
