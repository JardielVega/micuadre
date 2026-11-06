const router = require('express').Router();
const ctrl = require('../controllers/saleController');
const { requireRole, requireAuth } = require('../middlewares/auth');

router.get('/', requireRole('dependiente'), ctrl.index);
router.post('/', requireRole('dependiente'), ctrl.create);
router.post('/finalizar', requireRole('dependiente'), ctrl.finishDay);

// Anular una venta abierta: el dependiente las suyas, el jefe cualquiera de su tienda.
router.delete('/ventas/:id', requireAuth, ctrl.cancel);

module.exports = router;
