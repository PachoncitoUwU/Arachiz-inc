const express = require('express');
const router = express.Router();
const fichaController = require('../controllers/fichaController');
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');
const { roleMiddleware } = require('../middlewares/roleMiddleware');

const { isAdminOLiderDeFicha } = require('../middlewares/adminMiddleware');

router.use(authMiddleware);

router.post('/', roleMiddleware(['instructor']), fichaController.createFicha);
router.get('/my-fichas', fichaController.getUserFichas);
router.get('/:id/historial', fichaController.getHistorialFicha); // DEBE IR ANTES de /:id
router.get('/:id', fichaController.getFichaById);
router.put('/:id', roleMiddleware(['instructor']), fichaController.updateFicha);
router.post('/:id/regenerate-code', roleMiddleware(['instructor']), fichaController.regenerateCode);
router.post('/join', fichaController.joinFicha);
router.post('/:fichaId/salir', adminController.salirDeFicha); // Salir de una ficha (cualquier rol)
router.delete('/:fichaId/aprendices/:aprendizId', roleMiddleware(['instructor']), fichaController.removeAprendiz);
router.delete('/:fichaId/aprendices/:aprendizId/nfc', isAdminOLiderDeFicha, adminController.eliminarNfcAprendiz);

module.exports = router;
