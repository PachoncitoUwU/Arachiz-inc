const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { roleMiddleware } = require('../middlewares/roleMiddleware');
const materiaEvitadaController = require('../controllers/materiaEvitadaController');

// Obtener materias evitadas de un aprendiz en una ficha
router.get(
  '/fichas/:fichaId/aprendices/:aprendizId/materias-evitadas',
  authMiddleware,
  roleMiddleware(['instructor']),
  materiaEvitadaController.getMateriasEvitadas
);

// Actualizar materias evitadas de un aprendiz
router.put(
  '/fichas/:fichaId/aprendices/:aprendizId/materias-evitadas',
  authMiddleware,
  roleMiddleware(['instructor']),
  materiaEvitadaController.updateMateriasEvitadas
);

module.exports = router;
