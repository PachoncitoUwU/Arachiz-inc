const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { roleMiddleware } = require('../middlewares/roleMiddleware');
const materiaEvitadaController = require('../controllers/materiaEvitadaController');

// Obtener materias evitadas del aprendiz autenticado
router.get(
  '/materias-evitadas/my-materias-evitadas',
  authMiddleware,
  roleMiddleware(['aprendiz']),
  materiaEvitadaController.getMyMateriasEvitadas
);

// Obtener materias evitadas de un aprendiz en una ficha
router.get(
  '/materias-evitadas/fichas/:fichaId/aprendices/:aprendizId/materias-evitadas',
  authMiddleware,
  roleMiddleware(['instructor']),
  materiaEvitadaController.getMateriasEvitadas
);

// Actualizar materias evitadas de un aprendiz
router.put(
  '/materias-evitadas/fichas/:fichaId/aprendices/:aprendizId/materias-evitadas',
  authMiddleware,
  roleMiddleware(['instructor']),
  materiaEvitadaController.updateMateriasEvitadas
);

module.exports = router;
