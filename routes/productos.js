const router = require('express').Router();
const ctrl = require('../controllers/productController');
const { requireRole } = require('../middlewares/auth');
const { productRules } = require('../middlewares/validators');

router.use(requireRole('jefe'));

router.get('/', ctrl.index);
router.get('/nuevo', ctrl.newForm);
router.post('/', productRules, ctrl.create);
router.get('/:id', ctrl.show);
router.get('/:id/editar', ctrl.editForm);
router.put('/:id', productRules, ctrl.update);
router.delete('/:id', ctrl.destroy);

module.exports = router;
