const express = require('express');
const router = express.Router();
const passwordResetController = require('../controllers/passwordResetController');

// Solicitar recuperación de contraseña
router.post('/request', passwordResetController.requestPasswordReset);

// Verificar token de recuperación
router.get('/verify/:token', passwordResetController.verifyResetToken);

// Restablecer contraseña
router.post('/reset', passwordResetController.resetPassword);

module.exports = router;
