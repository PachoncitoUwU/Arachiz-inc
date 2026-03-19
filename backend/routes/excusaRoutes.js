const express = require('express');
const router = express.Router();
const { createExcusa, getUserExcusas, getAllExcusas, updateExcusaStatus } = require('../controllers/excusaController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.post('/', protect, upload.single('archivo'), createExcusa);
router.get('/my-excusas', protect, authorize('aprendiz'), getUserExcusas);
router.get('/todas', protect, authorize('instructor'), getAllExcusas);
router.patch('/:id/estado', protect, authorize('instructor'), updateExcusaStatus);

module.exports = router;
