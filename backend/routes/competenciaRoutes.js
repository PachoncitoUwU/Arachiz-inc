const express = require('express');
const router = express.Router();
const competenciaController = require('../controllers/competenciaController');
const authMiddleware = require('../middlewares/authMiddleware');
const { roleMiddleware } = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

router.post('/', roleMiddleware(['instructor', 'administrador']), competenciaController.createCompetencia);
router.put('/:id', roleMiddleware(['instructor', 'administrador']), competenciaController.updateCompetencia);
router.delete('/:id', roleMiddleware(['instructor', 'administrador']), competenciaController.deleteCompetencia);
router.get('/ficha/:fichaId', competenciaController.getCompetenciasByFicha);
router.get('/my-competencias', competenciaController.getUserCompetencias);

module.exports = router;
