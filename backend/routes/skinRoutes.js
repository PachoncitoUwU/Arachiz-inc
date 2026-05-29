const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');

// Importar controlador
let skinController;
try {
  skinController = require('../controllers/skinController');
  console.log('✅ Skin controller loaded');
} catch (error) {
  console.error('❌ Error loading skin controller:', error.message);
  skinController = {
    getAllSkins: (req, res) => res.status(503).json({ error: 'Skin system not available' }),
    getUserSkins: (req, res) => res.status(503).json({ error: 'Skin system not available' }),
    equipSkin: (req, res) => res.status(503).json({ error: 'Skin system not available' }),
    checkOrderStatus: (req, res) => res.status(503).json({ error: 'Skin system not available' }),
    handleWebhook: (req, res) => res.status(503).json({ error: 'Skin system not available' }),
    createWompiPayment: (req, res) => res.status(503).json({ error: 'Skin system not available' }),
    handleWebhookWompi: (req, res) => res.status(503).json({ error: 'Skin system not available' })
  };
}

// Rutas públicas
router.get('/all', skinController.getAllSkins);

// Rutas protegidas (requieren autenticación)
router.get('/my-skins', authMiddleware, skinController.getUserSkins);
router.post('/equip', authMiddleware, skinController.equipSkin);
router.post('/unlock', authMiddleware, skinController.unlockSkin);
router.get('/order/:orderId', authMiddleware, skinController.checkOrderStatus);

// Wompi - Pagos (donaciones)
router.post('/wompi-payment', skinController.createWompiPayment);

// Webhooks (no requieren autenticación)
router.post('/webhook', skinController.handleWebhook);
router.post('/webhook-wompi', skinController.handleWebhookWompi);

module.exports = router;
