const express = require('express');
const router = express.Router();
const qrController = require('../controllers/qrController');
const authMiddleware = require('../middlewares/authMiddleware');
const { isInstructor } = require('../middlewares/roleMiddleware');

// Generar código QR (solo instructores)
router.post('/generate', authMiddleware, isInstructor, qrController.generateQR);

// Validar y registrar asistencia por QR (solo aprendices)
router.post('/validate', authMiddleware, qrController.validateQR);

// Obtener estado del QR
router.get('/status/:code', authMiddleware, qrController.getQRStatus);

module.exports = router;
