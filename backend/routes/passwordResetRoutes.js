const express = require('express');
const router = express.Router();
const passwordResetController = require('../controllers/passwordResetController');
const rateLimit = require('express-rate-limit');

// Rate limiter para endpoints de recuperación (10 solicitudes / 15 min por IP)
const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  // Handler personalizado para que el error incluya CORS headers
  handler: (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.status(429).json({ error: 'Demasiados intentos. Espera 15 minutos e inténtalo de nuevo.' });
  }
});

// Solicitar recuperación de contraseña
router.post('/request', resetLimiter, passwordResetController.requestPasswordReset);

// Verificar token de recuperación
router.get('/verify/:token', passwordResetController.verifyResetToken);

// Restablecer contraseña
router.post('/reset', resetLimiter, passwordResetController.resetPassword);

// Verificación de email OTP
router.post('/verify-email', resetLimiter, passwordResetController.sendEmailOTP);
router.post('/confirm-email', resetLimiter, passwordResetController.confirmEmailOTP);

module.exports = router;
