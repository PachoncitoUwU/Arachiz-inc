const express = require('express');
const router = express.Router();
const { createExcusa, getUserExcusas, getAllExcusas, updateExcusaStatus } = require('../controllers/excusaController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.use(authMiddleware);

router.post('/', roleMiddleware(['aprendiz']), upload.single('archivo'), createExcusa);
router.get('/my-excusas', roleMiddleware(['aprendiz']), getUserExcusas);
router.get('/', roleMiddleware(['instructor']), getAllExcusas);
router.put('/:id/estado', roleMiddleware(['instructor']), updateExcusaStatus);

module.exports = router;
