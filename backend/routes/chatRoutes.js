const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/ficha/:fichaId', authMiddleware, chatController.getMensajes);

module.exports = router;
