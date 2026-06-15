const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { roleMiddleware } = require('../middlewares/roleMiddleware');
const resultadoEvitadoController = require('../controllers/resultadoEvitadoController');

// Obtener resultados evitados del aprendiz autenticado
router.get(
  '/my-resultados-evitados',
  authMiddleware,
  roleMiddleware(['aprendiz']),
  resultadoEvitadoController.getMyResultadosEvitados
);

// Evitar un resultado (aprendiz se evita a sí mismo)
router.post(
  '/resultados/:resultadoId/evitar',
  authMiddleware,
  roleMiddleware(['aprendiz']),
  resultadoEvitadoController.evitarResultado
);

// Volver a tomar un resultado (aprendiz deja de evitarlo)
router.delete(
  '/resultados/:resultadoId/volver-a-tomar',
  authMiddleware,
  roleMiddleware(['aprendiz']),
  resultadoEvitadoController.volverATomarResultado
);

// Evitar una competencia completa (aprendiz se evita a sí mismo)
router.post(
  '/competencias/:competenciaId/evitar-completa',
  authMiddleware,
  roleMiddleware(['aprendiz']),
  resultadoEvitadoController.evitarCompetenciaCompleta
);

// Obtener resultados evitados de un aprendiz en una ficha
router.get(
  '/fichas/:fichaId/aprendices/:aprendizId/resultados-evitados',
  authMiddleware,
  roleMiddleware(['instructor']),
  resultadoEvitadoController.getResultadosEvitados
);

// Actualizar resultados evitados de un aprendiz
router.put(
  '/fichas/:fichaId/aprendices/:aprendizId/resultados-evitados',
  authMiddleware,
  roleMiddleware(['instructor', 'administrador']),
  resultadoEvitadoController.updateResultadosEvitados
);

module.exports = router;
