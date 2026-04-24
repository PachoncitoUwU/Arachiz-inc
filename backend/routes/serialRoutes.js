const express = require('express');
const router = express.Router();
const serialController = require('../controllers/serialController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/ports', serialController.getPorts);
router.post('/connect', serialController.connectPort);
router.post('/disconnect', serialController.disconnectPort);
router.post('/enroll/finger', serialController.startEnrollFinger);
router.put('/bind', serialController.bindHardware);
router.delete('/finger', serialController.deleteFinger);
router.get('/next-finger-id', serialController.nextFingerId);
router.post('/simulate', serialController.simulateEvent);
router.post('/clear-fingerprints', serialController.clearFingerprints);

// ── Nuevo: recibe eventos del ESP8266 vía WiFi ──
// El ESP8266 envía el Bearer token del instructor en cada request
router.post('/wifi-event', authMiddleware, serialController.wifiEvent);

module.exports = router;
