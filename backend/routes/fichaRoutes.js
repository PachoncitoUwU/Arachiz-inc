const express = require('express');
const router = express.Router();
const fichaController = require('../controllers/fichaController');
const authMiddleware = require('../middlewares/authMiddleware');
const { roleMiddleware } = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

router.post('/', roleMiddleware(['instructor']), fichaController.createFicha);
router.get('/my-fichas', fichaController.getUserFichas);
router.get('/:id', fichaController.getFichaById);
router.put('/:id', roleMiddleware(['instructor']), fichaController.updateFicha);
router.post('/:id/regenerate-code', roleMiddleware(['instructor']), fichaController.regenerateCode);
router.post('/join', fichaController.joinFicha);
router.delete('/:fichaId/aprendices/:aprendizId', roleMiddleware(['instructor']), fichaController.removeAprendiz);

module.exports = router;
