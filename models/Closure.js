const { DataTypes, Model, Op } = require('sequelize');
const sequelize = require('../config/database');
const AppError = require('../utils/AppError');
const { round2 } = require('../utils/helpers');
const Sale = require('./Sale');
const SaleItem = require('./SaleItem');

const money = (field) => ({
  type: DataTypes.DECIMAL(12, 2),
  allowNull: false,
  get() {
    return Number(this.getDataValue(field));
  },
});

// Un "cierre" es el día finalizado por un dependiente: agrupa sus ventas para que el jefe haga el cuadre.
class Closure extends Model {
  static async closeDay(user) {
    return sequelize.transaction(async (t) => {
      const sales = await Sale.findAll({
        where: { userId: user.id, closureId: null },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (sales.length === 0) throw new AppError('No hay ventas para finalizar el día');

      const ids = sales.map((s) => s.id);
      const total = round2(sales.reduce((sum, s) => sum + s.total, 0));
      const cost = round2(sales.reduce((sum, s) => sum + s.cost, 0));
      const unitsCount = (await SaleItem.sum('quantity', { where: { saleId: ids }, transaction: t })) || 0;

      const closure = await Closure.create(
        {
          ownerId: user.storeId,
          userId: user.id,
          salesCount: sales.length,
          unitsCount,
          total,
          cost,
          profit: round2(total - cost),
        },
        { transaction: t }
      );
      await Sale.update({ closureId: closure.id }, { where: { id: ids }, transaction: t });
      return closure;
    });
  }

  static buildWhere(storeId, desde, hasta) {
    const where = { ownerId: storeId };
    if (desde || hasta) {
      where.createdAt = {};
      if (desde) where.createdAt[Op.gte] = desde;
      if (hasta) where.createdAt[Op.lte] = hasta;
    }
    return where;
  }

  static async list({ storeId, desde, hasta, limit, offset }) {
    const where = Closure.buildWhere(storeId, desde, hasta);
    const { rows, count } = await Closure.findAndCountAll({
      where,
      include: [{ association: 'closedBy', attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });
    const [total, cost, profit] = await Promise.all(
      ['total', 'cost', 'profit'].map(async (f) => round2((await Closure.sum(f, { where })) || 0))
    );
    return { rows, count, totals: { total, cost, profit } };
  }

  static async detail(id, storeId) {
    const closure = await Closure.findOne({
      where: { id, ownerId: storeId },
      include: [
        { association: 'closedBy', attributes: ['id', 'name'] },
        { association: 'sales', include: [{ association: 'items' }], separate: false },
      ],
      order: [[{ model: Sale, as: 'sales' }, 'createdAt', 'ASC']],
    });
    if (!closure) throw new AppError('Cierre no encontrado', 404);

    // Ganancia por producto dentro del cierre.
    const byProduct = new Map();
    for (const sale of closure.sales) {
      for (const item of sale.items) {
        const row = byProduct.get(item.productName) || { name: item.productName, quantity: 0, revenue: 0, cost: 0 };
        row.quantity += item.quantity;
        row.revenue += item.unitPrice * item.quantity;
        row.cost += item.unitCost * item.quantity;
        byProduct.set(item.productName, row);
      }
    }
    const products = [...byProduct.values()]
      .map((r) => ({ ...r, revenue: round2(r.revenue), cost: round2(r.cost), profit: round2(r.revenue - r.cost) }))
      .sort((a, b) => b.profit - a.profit);

    return { closure, products };
  }
}

Closure.init(
  {
    ownerId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    salesCount: { type: DataTypes.INTEGER, allowNull: false },
    unitsCount: { type: DataTypes.INTEGER, allowNull: false },
    total: money('total'),
    cost: money('cost'),
    profit: money('profit'),
  },
  { sequelize, modelName: 'Closure', tableName: 'closures' }
);

module.exports = Closure;
