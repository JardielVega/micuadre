const { User, Sale } = require('../models');
const { collectErrors } = require('../middlewares/validators');
const AppError = require('../utils/AppError');
const { toId } = require('../utils/helpers');

exports.index = async (req, res) => {
  res.render('dependientes/index', { title: 'Dependientes', staff: await User.staffOf(req.user.id) });
};

exports.newForm = (req, res) => {
  res.render('dependientes/form', { title: 'Nuevo dependiente', errors: [], values: {} });
};

exports.create = async (req, res) => {
  const errors = collectErrors(req);
  const render = (errs) =>
    res.status(422).render('dependientes/form', {
      title: 'Nuevo dependiente',
      errors: errs,
      values: { name: req.body.name, username: req.body.username },
    });
  if (errors.length) return render(errors);

  try {
    const user = await User.register({
      name: req.body.name,
      username: req.body.username,
      password: req.body.password,
      role: 'dependiente',
      bossId: req.user.id,
    });
    req.flash('success', `Dependiente "${user.name}" creado. Entrégale su usuario y contraseña.`);
    res.redirect('/dependientes');
  } catch (err) {
    if (err instanceof AppError) return render([err.message]);
    throw err;
  }
};

exports.toggle = async (req, res) => {
  const user = await User.findStaff(toId(req.params.id), req.user.id);
  await user.update({ active: !user.active });
  req.flash('success', `${user.name} ahora está ${user.active ? 'activo' : 'desactivado'}`);
  res.redirect('/dependientes');
};

exports.destroy = async (req, res) => {
  const user = await User.findStaff(toId(req.params.id), req.user.id);
  if ((await Sale.count({ where: { userId: user.id } })) > 0) {
    req.flash('error', 'Tiene ventas registradas: desactívalo en lugar de eliminarlo');
    return res.redirect('/dependientes');
  }
  await user.destroy();
  req.flash('success', `Dependiente "${user.name}" eliminado`);
  res.redirect('/dependientes');
};
