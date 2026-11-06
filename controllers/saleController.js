const { Product, Sale, Closure } = require('../models');
const AppError = require('../utils/AppError');
const { toId } = require('../utils/helpers');

// Ejecuta una acción y, si falla por una regla de negocio, avisa con un mensaje flash.
async function attempt(req, res, action, okMessage, back = '/vender') {
  try {
    await action();
    req.flash('success', okMessage);
  } catch (err) {
    if (!(err instanceof AppError)) throw err;
    req.flash('error', err.message);
  }
  res.redirect(back);
}

exports.index = async (req, res) => {
  const [products, sales] = await Promise.all([Product.forSale(req.user.storeId), Sale.openFor(req.user.id)]);
  res.render('vender/index', {
    title: 'Vender',
    products,
    sales,
    dayTotal: sales.reduce((sum, s) => sum + s.total, 0),
    lowStock: Product.LOW_STOCK,
    pageScript: '/js/cart.js',
  });
};

exports.create = (req, res) => {
  let items;
  try {
    items = JSON.parse(req.body.items || '[]');
  } catch {
    items = [];
  }
  return attempt(req, res, () => Sale.createFromCart(req.user, items), 'Venta registrada');
};

exports.finishDay = (req, res) =>
  attempt(req, res, () => Closure.closeDay(req.user), 'Día finalizado. El jefe ya puede ver tu cuadre.');

exports.cancel = (req, res) => {
  const back = req.user.role === 'jefe' ? '/cuadre' : '/vender';
  return attempt(req, res, () => Sale.cancel(req.user, toId(req.params.id)), 'Venta anulada y stock devuelto', back);
};
