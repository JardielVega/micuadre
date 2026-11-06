const jwt = require('jsonwebtoken');
const { User } = require('../models');
const AppError = require('../utils/AppError');

const COOKIE = 'token';
const MAX_AGE = 8 * 60 * 60 * 1000; // 8 horas

function secret() {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error('Falta JWT_SECRET en el archivo .env');
  return value;
}

// Crea el JWT y lo guarda en una cookie httpOnly (el JS del navegador no puede leerla).
function startSession(res, user) {
  const token = jwt.sign({ id: user.id, role: user.role }, secret(), { expiresIn: '8h' });
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: MAX_AGE,
  });
}

function endSession(res) {
  res.clearCookie(COOKIE);
}

// Verifica el JWT (si existe) y carga el usuario en req.user / res.locals.user.
async function loadUser(req, res, next) {
  const token = req.cookies[COOKIE];
  if (!token) return next();
  try {
    const payload = jwt.verify(token, secret());
    const user = await User.findByPk(payload.id);
    if (user && user.active && user.role === payload.role) {
      req.user = user;
      res.locals.user = user;
    } else {
      endSession(res);
    }
  } catch {
    endSession(res);
  }
  next();
}

// Ruta privada: exige sesión iniciada.
function requireAuth(req, res, next) {
  if (!req.user) {
    req.flash('error', 'Inicia sesión para continuar');
    return res.redirect('/');
  }
  next();
}

// Ruta restringida a un rol ('jefe' o 'dependiente').
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      req.flash('error', 'Inicia sesión para continuar');
      return res.redirect('/');
    }
    if (req.user.role !== role) throw new AppError('No tienes permiso para ver esta página', 403);
    next();
  };
}

module.exports = { startSession, endSession, loadUser, requireAuth, requireRole };
