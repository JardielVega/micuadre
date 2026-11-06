const { Product } = require('../models');
const { collectErrors } = require('../middlewares/validators');
const { parsePaging, pagerMeta, toId } = require('../utils/helpers');

const fields = (body) => ({
  name: body.name,
  costPrice: body.costPrice,
  salePrice: body.salePrice,
  stock: body.stock,
  active: body.active === 'on',
});

const form = (res, status, data) => res.status(status).render('productos/form', data);

exports.index = async (req, res) => {
  const { page, limit, offset } = parsePaging(req.query);
  const q = (req.query.q || '').trim().slice(0, 100);
  const estado = ['bajo', 'agotado', 'inactivo'].includes(req.query.estado) ? req.query.estado : '';
  const storeId = req.user.storeId;

  const [{ rows, count }, summary] = await Promise.all([
    Product.search({ storeId, q, estado, limit, offset }),
    Product.stockSummary(storeId),
  ]);

  res.render('productos/index', {
    title: 'Inventario',
    products: rows,
    pager: pagerMeta(count, page, limit),
    filters: { q, estado },
    summary,
    lowStock: Product.LOW_STOCK,
  });
};

exports.newForm = (req, res) => {
  form(res, 200, {
    title: 'Nuevo producto',
    heading: 'Nuevo producto',
    action: '/productos',
    values: { active: true, stock: 0 },
    errors: [],
  });
};

exports.create = async (req, res) => {
  const errors = collectErrors(req);
  if (errors.length) {
    return form(res, 422, {
      title: 'Nuevo producto',
      heading: 'Nuevo producto',
      action: '/productos',
      values: { ...req.body, active: req.body.active === 'on' },
      errors,
    });
  }
  const product = await Product.create({ ...fields(req.body), ownerId: req.user.storeId });
  req.flash('success', `Producto "${product.name}" creado`);
  res.redirect('/productos');
};

exports.show = async (req, res) => {
  const product = await Product.findOwned(toId(req.params.id), req.user.storeId);
  res.render('productos/show', {
    title: product.name,
    product,
    sold: await product.soldUnits(),
    lowStock: Product.LOW_STOCK,
  });
};

exports.editForm = async (req, res) => {
  const product = await Product.findOwned(toId(req.params.id), req.user.storeId);
  form(res, 200, {
    title: `Editar ${product.name}`,
    heading: 'Editar producto',
    action: `/productos/${product.id}?_method=PUT`,
    values: product.get({ plain: true }),
    errors: [],
  });
};

exports.update = async (req, res) => {
  const product = await Product.findOwned(toId(req.params.id), req.user.storeId);
  const errors = collectErrors(req);
  if (errors.length) {
    return form(res, 422, {
      title: `Editar ${product.name}`,
      heading: 'Editar producto',
      action: `/productos/${product.id}?_method=PUT`,
      values: { ...req.body, active: req.body.active === 'on' },
      errors,
    });
  }
  await product.update(fields(req.body));
  req.flash('success', 'Producto actualizado');
  res.redirect(`/productos/${product.id}`);
};

exports.destroy = async (req, res) => {
  const product = await Product.findOwned(toId(req.params.id), req.user.storeId);
  await product.destroy();
  req.flash('success', `Producto "${product.name}" eliminado`);
  res.redirect('/productos');
};
