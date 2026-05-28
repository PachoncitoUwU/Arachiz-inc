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

// Evitar una materia (aprendiz se evita a sí mismo)
router.post(
  '/materias-evitadas/materias/:materiaId/evitar',
  authMiddleware,
  roleMiddleware(['aprendiz']),
  materiaEvitadaController.evitarMateria
);

// Volver a tomar una materia (aprendiz deja de evitarla)
router.delete(
  '/materias-evitadas/materias/:materiaId/volver-a-tomar',
  authMiddleware,
  roleMiddleware(['aprendiz']),
  materiaEvitadaController.volverATomarMateria
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
  roleMiddleware(['instructor', 'administrador']),
  materiaEvitadaController.updateMateriasEvitadas
);

module.exports = router;
