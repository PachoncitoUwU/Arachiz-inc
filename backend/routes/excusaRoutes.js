const express = require('express');
const router = express.Router();
const {
  createExcusa,
  getMyExcusas,
  getExcusasInstructor,
  updateExcusaEstado,
  updateExcusa,
  getMateriasConHorarios
} = require('../controllers/excusaController');
const authMiddleware = require('../middlewares/authMiddleware');
const { roleMiddleware } = require('../middlewares/roleMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.use(authMiddleware);

// Rutas de aprendiz
router.post('/', roleMiddleware(['aprendiz']), upload.array('archivos', 10), createExcusa);
router.get('/my-excusas', roleMiddleware(['aprendiz']), getMyExcusas);
router.get('/materias-con-horarios', roleMiddleware(['aprendiz']), getMateriasConHorarios);
router.put('/:id', roleMiddleware(['aprendiz']), upload.array('archivos', 10), updateExcusa);

// Rutas de instructor
router.get('/', roleMiddleware(['instructor']), getExcusasInstructor);
router.put('/:id/estado', roleMiddleware(['instructor']), updateExcusaEstado);

module.exports = router;
