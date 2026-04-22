const express = require('express');
const router = express.Router();
const qrController = require('../controllers/qrController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { isInstructor } = require('../middlewares/roleMiddleware');

// Generar código QR (solo instructores)
router.post('/generate', verifyToken, isInstructor, qrController.generateQR);

// Validar y registrar asistencia por QR (solo aprendices)
router.post('/validate', verifyToken, qrController.validateQR);

// Obtener estado del QR
router.get('/status/:code', verifyToken, qrController.getQRStatus);

module.exports = router;
