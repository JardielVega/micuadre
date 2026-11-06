const router = require('express').Router();
const ctrl = require('../controllers/dependienteController');
const { requireRole } = require('../middlewares/auth');
const { dependienteRules } = require('../middlewares/validators');

router.use(requireRole('jefe'));

router.get('/', ctrl.index);
router.get('/nuevo', ctrl.newForm);
router.post('/', dependienteRules, ctrl.create);
router.post('/:id/estado', ctrl.toggle);
router.delete('/:id', ctrl.destroy);

module.exports = router;
