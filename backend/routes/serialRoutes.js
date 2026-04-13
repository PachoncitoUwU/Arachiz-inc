const express = require('express');
const router = express.Router();
const serialController = require('../controllers/serialController');

router.get('/ports', serialController.getPorts);
router.post('/connect', serialController.connectPort);
router.post('/disconnect', serialController.disconnectPort);
router.post('/enroll/finger', serialController.startEnrollFinger);
router.put('/bind', serialController.bindHardware);

module.exports = router;
