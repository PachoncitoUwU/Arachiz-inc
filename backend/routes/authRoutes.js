const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const uploadMiddleware = require('../middlewares/uploadMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.getMe);
router.put('/profile', authMiddleware, uploadMiddleware.single('avatar'), authController.updateProfile);
router.put('/change-password', authMiddleware, authController.changePassword);
router.put('/update-user-avatar/:id', authMiddleware, uploadMiddleware.single('avatar'), authController.updateUserAvatar);

module.exports = router;
