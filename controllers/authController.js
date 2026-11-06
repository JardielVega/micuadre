const { User } = require('../models');
const { startSession, endSession } = require('../middlewares/auth');
const { collectErrors } = require('../middlewares/validators');
const AppError = require('../utils/AppError');

const home = (user) => (user.role === 'jefe' ? '/productos' : '/vender');

exports.landing = (req, res) => {
  if (req.user) return res.redirect(home(req.user));
  res.render('home', { title: 'Bienvenido' });
};

exports.dependienteForm = (req, res) => {
  if (req.user) return res.redirect(home(req.user));
  res.render('auth/dependiente', { title: 'Entrar como dependiente', errors: [], values: {} });
};

exports.jefeForm = (req, res) => {
  if (req.user) return res.redirect(home(req.user));
  res.render('auth/jefe', { title: 'Iniciar sesión como jefe', errors: [], values: {} });
};

exports.registerForm = (req, res) => {
  if (req.user) return res.redirect(home(req.user));
  res.render('auth/jefe-registro', { title: 'Crear perfil de jefe', errors: [], values: {} });
};

// Inicio de sesión: el rol viene de la ruta, así un jefe no puede entrar por la puerta del dependiente.
const login = (role, view) => async (req, res) => {
  const errors = collectErrors(req);
  const render = (errs) =>
    res.status(401).render(view, {
      title: 'Iniciar sesión',
      errors: errs,
      values: { username: req.body.username },
    });
  if (errors.length) return render(errors);

  const user = await User.authenticate(req.body.username, req.body.password, role);
  if (!user) return render(['Usuario o contraseña incorrectos']);

  startSession(res, user);
  res.redirect(home(user));
};

exports.loginDependiente = login('dependiente', 'auth/dependiente');
exports.loginJefe = login('jefe', 'auth/jefe');

exports.registerJefe = async (req, res) => {
  const errors = collectErrors(req);
  const render = (errs) =>
    res.status(422).render('auth/jefe-registro', {
      title: 'Crear perfil de jefe',
      errors: errs,
      values: { name: req.body.name, username: req.body.username },
    });
  if (errors.length) return render(errors);

  try {
    const user = await User.register({ name: req.body.name, username: req.body.username, password: req.body.password });
    startSession(res, user);
    req.flash('success', `¡Bienvenido, ${user.name}! Tu perfil de jefe fue creado.`);
    res.redirect('/productos');
  } catch (err) {
    if (err instanceof AppError) return render([err.message]);
    throw err;
  }
};

exports.logout = (req, res) => {
  endSession(res);
  res.redirect('/');
};
