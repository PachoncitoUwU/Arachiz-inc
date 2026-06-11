const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/stats', authMiddleware, profileController.getProfileStats);

module.exports = router;
