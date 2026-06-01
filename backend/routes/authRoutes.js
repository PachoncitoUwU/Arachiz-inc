const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const faceController = require('../controllers/faceController');
const authMiddleware = require('../middlewares/authMiddleware');
const uploadMiddleware = require('../middlewares/uploadMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.getMe);
router.put('/profile', authMiddleware, uploadMiddleware.single('avatar'), authController.updateProfile);
router.put('/change-password', authMiddleware, authController.changePassword);
router.put('/complete-profile', authMiddleware, authController.completeProfile);

// Reconocimiento facial
router.post('/face-descriptor', authMiddleware, faceController.saveFaceDescriptor);
router.delete('/face-descriptor', authMiddleware, faceController.deleteFaceDescriptor);
router.post('/face-identify', authMiddleware, faceController.faceIdentify);
// Inspector: guardar/eliminar descriptor facial de un aprendiz específico
router.post('/face-descriptor-for/:userId', authMiddleware, faceController.saveFaceDescriptorFor);
router.delete('/face-descriptor-for/:userId', authMiddleware, faceController.deleteFaceDescriptorFor);

module.exports = router;

