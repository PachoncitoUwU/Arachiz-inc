const express = require('express');
const router = express.Router();
const skinController = require('../controllers/skinController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Rutas públicas
router.get('/all', skinController.getAllSkins);

// Rutas protegidas (requieren autenticación)
router.get('/my-skins', verifyToken, skinController.getUserSkins);
router.post('/equip', verifyToken, skinController.equipSkin);
router.post('/create-order', verifyToken, skinController.createOrder);
router.get('/order/:orderId', verifyToken, skinController.checkOrderStatus);

// Webhook de Mercado Pago (no requiere autenticación)
router.post('/webhook', skinController.handleWebhook);

module.exports = router;
