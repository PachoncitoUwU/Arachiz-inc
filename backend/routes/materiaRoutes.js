const express = require('express');
const router = express.Router();
const materiaController = require('../controllers/materiaController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

router.post('/', roleMiddleware(['instructor']), materiaController.createMateria);
router.delete('/:id', roleMiddleware(['instructor']), materiaController.deleteMateria);
router.get('/ficha/:fichaId', materiaController.getMateriasByFicha);
router.get('/my-materias', materiaController.getUserMaterias);

module.exports = router;
