const express = require('express');
const router = express.Router();
const eventoController = require('../controllers/eventoController');
const verifyToken = require('../middlewares/authMiddleware');

// Rutas para todos los roles (para obtener los eventos en los que participan)
router.get('/', verifyToken, eventoController.getEventos);
router.get('/aprendiz', verifyToken, eventoController.getEventosAprendiz);
router.get('/:id', verifyToken, eventoController.getEventoDetails);

// Rutas para administradores o instructores (creación y gestión)
// Se puede requerir un middleware conjunto o simplemente verificar que no sea aprendiz
const isAdminOrInstructor = (req, res, next) => {
  if (req.user && (req.user.userType === 'admin' || req.user.userType === 'instructor')) {
    next();
  } else {
    res.status(403).json({ error: 'Acceso denegado. Solo administradores e instructores pueden realizar esta acción.' });
  }
};

router.post('/', verifyToken, isAdminOrInstructor, eventoController.crearEvento);
router.post('/unir', verifyToken, isAdminOrInstructor, eventoController.unirFichasCodigo);
router.post('/:id/asistencia', verifyToken, isAdminOrInstructor, eventoController.registrarAsistencia);
router.get('/:id/reporte', verifyToken, isAdminOrInstructor, eventoController.getReporteEvento);

module.exports = router;
