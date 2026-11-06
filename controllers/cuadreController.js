const { Closure, Sale, Product } = require('../models');
const { parsePaging, pagerMeta, parseDay, toId, round2 } = require('../utils/helpers');

exports.index = async (req, res) => {
  const { page, limit, offset } = parsePaging(req.query);
  const storeId = req.user.storeId;
  const filters = { desde: req.query.desde || '', hasta: req.query.hasta || '' };

  const [{ rows, count, totals }, pending, summary] = await Promise.all([
    Closure.list({
      storeId,
      desde: parseDay(filters.desde),
      hasta: parseDay(filters.hasta, true),
      limit,
      offset,
    }),
    Sale.openForStore(storeId),
    Product.stockSummary(storeId),
  ]);

  res.render('cuadre/index', {
    title: 'Cuadre',
    closures: rows,
    totals,
    pager: pagerMeta(count, page, limit),
    filters,
    pending,
    pendingProfit: round2(pending.reduce((sum, s) => sum + s.profit, 0)),
    summary,
  });
};

exports.show = async (req, res) => {
  const { closure, products } = await Closure.detail(toId(req.params.id), req.user.storeId);
  res.render('cuadre/show', { title: `Cierre #${closure.id}`, closure, products });
};
