const express = require('express');
const router = express.Router();
const resultadoController = require('../controllers/resultadoAprendizajeController');
const authMiddleware = require('../middlewares/authMiddleware');
const { roleMiddleware } = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

router.post('/', roleMiddleware(['instructor', 'administrador']), resultadoController.createResultado);
router.put('/:id', roleMiddleware(['instructor', 'administrador']), resultadoController.updateResultado);
router.delete('/:id', roleMiddleware(['instructor', 'administrador']), resultadoController.deleteResultado);
router.put('/:id/tomar', roleMiddleware(['instructor']), resultadoController.tomarResultado);
router.put('/:id/dejar', roleMiddleware(['instructor']), resultadoController.dejarResultado);
router.put('/:id/asignar-instructor', roleMiddleware(['administrador']), resultadoController.asignarInstructor);
router.get('/competencia/:competenciaId', resultadoController.getResultadosByCompetencia);

module.exports = router;
