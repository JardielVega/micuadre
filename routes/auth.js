const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const ctrl = require('../controllers/authController');
const { loginRules, registerJefeRules } = require('../middlewares/validators');

// Frena intentos repetidos de adivinar contraseñas (se desactiva en los tests).
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  handler: (req, res) =>
    res.status(429).render('error', { title: 'Demasiados intentos', status: 429, message: 'Demasiados intentos, espera unos minutos' }),
});

router.get('/dependiente', ctrl.dependienteForm);
router.post('/dependiente', limiter, loginRules, ctrl.loginDependiente);

router.get('/jefe', ctrl.jefeForm);
router.post('/jefe/login', limiter, loginRules, ctrl.loginJefe);
router.get('/jefe/registro', ctrl.registerForm);
router.post('/jefe/registro', limiter, registerJefeRules, ctrl.registerJefe);

router.post('/salir', ctrl.logout);

module.exports = router;
