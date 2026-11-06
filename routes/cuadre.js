const router = require('express').Router();
const ctrl = require('../controllers/cuadreController');
const { requireRole } = require('../middlewares/auth');

router.use(requireRole('jefe'));

router.get('/', ctrl.index);
router.get('/:id', ctrl.show);

module.exports = router;
