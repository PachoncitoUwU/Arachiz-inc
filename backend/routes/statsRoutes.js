const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/instructor', authMiddleware, statsController.getInstructorStats);

module.exports = router;
