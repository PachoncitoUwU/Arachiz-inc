const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.post('/chat', aiController.askArachizAssist);

module.exports = router;
