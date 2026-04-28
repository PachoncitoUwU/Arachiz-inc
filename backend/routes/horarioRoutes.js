const express = require('express');
const router = express.Router();
const horarioController = require('../controllers/horarioController');
const authMiddleware = require('../middlewares/authMiddleware');
const { roleMiddleware } = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

router.get('/my-horarios', roleMiddleware(['instructor']), horarioController.getMyHorarios);
router.get('/ficha/:fichaId', horarioController.getHorarioByFicha);
router.post('/', roleMiddleware(['instructor', 'administrador']), horarioController.createHorario);
router.put('/:id', roleMiddleware(['instructor']), horarioController.updateHorario);
router.delete('/:id', roleMiddleware(['instructor', 'administrador']), horarioController.deleteHorario);

// Rutas de admin
router.put('/admin/:id', roleMiddleware(['administrador']), horarioController.updateHorarioAdmin);

// Rutas de conflictos
router.get('/conflictos', roleMiddleware(['instructor']), horarioController.getConflictosInstructor);
router.put('/conflictos/:id/resolver', roleMiddleware(['instructor']), horarioController.resolverConflicto);

module.exports = router;
