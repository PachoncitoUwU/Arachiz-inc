const express = require('express');
const router = express.Router();
const materiaController = require('../controllers/materiaController');
const authMiddleware = require('../middlewares/authMiddleware');
const { roleMiddleware } = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

router.post('/', roleMiddleware(['instructor', 'administrador']), materiaController.createMateria);
router.put('/:id', roleMiddleware(['instructor', 'administrador']), materiaController.updateMateria);
router.delete('/:id', roleMiddleware(['instructor', 'administrador']), materiaController.deleteMateria);
router.get('/ficha/:fichaId', materiaController.getMateriasByFicha);
router.get('/my-materias', materiaController.getUserMaterias);

module.exports = router;
