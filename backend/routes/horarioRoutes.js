const express = require('express');
const router = express.Router();
const horarioController = require('../controllers/horarioController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

router.post('/', roleMiddleware(['instructor']), horarioController.createHorario);
router.delete('/:id', roleMiddleware(['instructor']), horarioController.deleteHorario);
router.get('/ficha/:fichaId', horarioController.getHorarioByFicha);

module.exports = router;
