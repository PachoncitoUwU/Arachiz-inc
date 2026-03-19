const express = require('express');
const router = express.Router();
const fichaController = require('../controllers/fichaController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

router.post('/', roleMiddleware(['instructor']), fichaController.createFicha);
router.get('/my-fichas', fichaController.getUserFichas);
router.post('/join', fichaController.joinFicha);

module.exports = router;
