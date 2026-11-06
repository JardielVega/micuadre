const { body, validationResult } = require('express-validator');

// Devuelve la lista de mensajes de error (vacía si todo está bien).
const collectErrors = (req) =>
  validationResult(req)
    .array()
    .map((e) => e.msg);

const username = (field = 'username') =>
  body(field)
    .trim()
    .matches(/^[a-zA-Z0-9_.]{3,30}$/)
    .withMessage('El usuario debe tener 3 a 30 caracteres (letras, números, _ o .)');

const loginRules = [
  body('username').trim().notEmpty().withMessage('Escribe tu usuario'),
  body('password').notEmpty().withMessage('Escribe tu contraseña'),
];

const registerJefeRules = [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('El nombre debe tener entre 2 y 80 caracteres'),
  username(),
  body('password').isLength({ min: 6, max: 72 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('confirm')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Las contraseñas no coinciden'),
];

const dependienteRules = [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('El nombre debe tener entre 2 y 80 caracteres'),
  username(),
  body('password').isLength({ min: 6, max: 72 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
];

const productRules = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('costPrice').isFloat({ min: 0 }).withMessage('El precio de compra debe ser un número mayor o igual a 0').toFloat(),
  body('salePrice').isFloat({ gt: 0 }).withMessage('El precio de venta debe ser mayor a 0').toFloat(),
  body('stock').isInt({ min: 0 }).withMessage('La cantidad debe ser un entero mayor o igual a 0').toInt(),
];

module.exports = { collectErrors, loginRules, registerJefeRules, dependienteRules, productRules };
