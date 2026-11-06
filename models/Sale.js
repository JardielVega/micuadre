const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const AppError = require('../utils/AppError');
const { round2 } = require('../utils/helpers');
const Product = require('./Product');
const SaleItem = require('./SaleItem');

const money = (field) => ({
  type: DataTypes.DECIMAL(12, 2),
  allowNull: false,
  get() {
    return Number(this.getDataValue(field));
  },
});

class Sale extends Model {
  get profit() {
    return round2(this.total - this.cost);
  }

  // Confirma un carrito: valida stock, descuenta inventario y guarda la venta, todo en una transacción.
  static async createFromCart(user, rawItems) {
    const wanted = new Map();
    for (const item of Array.isArray(rawItems) ? rawItems : []) {
      const id = Number(item.productId);
      const qty = Number(item.quantity);
      if (!Number.isInteger(id) || !Number.isInteger(qty) || qty < 1) throw new AppError('El carrito no es válido');
      wanted.set(id, (wanted.get(id) || 0) + qty);
    }
    if (wanted.size === 0) throw new AppError('El carrito está vacío');

    return sequelize.transaction(async (t) => {
      const products = await Product.findAll({
        where: { id: [...wanted.keys()], ownerId: user.storeId, active: true },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (products.length !== wanted.size) throw new AppError('Alguno de los productos ya no está disponible');

      let total = 0;
      let cost = 0;
      const lines = [];
      for (const product of products) {
        const quantity = wanted.get(product.id);
        if (product.stock < quantity) {
          throw new AppError(`No hay suficiente stock de "${product.name}" (quedan ${product.stock})`);
        }
        total += product.salePrice * quantity;
        cost += product.costPrice * quantity;
        lines.push({
          productId: product.id,
          productName: product.name,
          quantity,
          unitPrice: product.salePrice,
          unitCost: product.costPrice,
        });
        product.stock -= quantity;
        await product.save({ transaction: t });
      }

      const sale = await Sale.create(
        { userId: user.id, ownerId: user.storeId, total: round2(total), cost: round2(cost) },
        { transaction: t }
      );
      await SaleItem.bulkCreate(lines.map((l) => ({ ...l, saleId: sale.id })), { transaction: t });
      return sale;
    });
  }

  // Ventas aún no finalizadas de un dependiente.
  static openFor(userId) {
    return Sale.findAll({
      where: { userId, closureId: null },
      include: [{ association: 'items' }],
      order: [['createdAt', 'DESC']],
    });
  }

  // Ventas sin cerrar de toda la tienda (las ve el jefe).
  static openForStore(storeId) {
    return Sale.findAll({
      where: { ownerId: storeId, closureId: null },
      include: [{ association: 'items' }, { association: 'seller', attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']],
    });
  }

  // Anula una venta abierta y devuelve los productos al inventario.
  // El dependiente solo anula las suyas; el jefe puede anular cualquiera de su tienda.
  static async cancel(user, id) {
    return sequelize.transaction(async (t) => {
      const sale = await Sale.findOne({
        where: { id, ownerId: user.storeId },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!sale || (user.role !== 'jefe' && sale.userId !== user.id)) throw new AppError('Venta no encontrada', 404);
      if (sale.closureId) throw new AppError('Esa venta ya pertenece a un día finalizado');

      const items = await SaleItem.findAll({ where: { saleId: sale.id }, transaction: t });
      for (const item of items) {
        if (item.productId) {
          await Product.increment({ stock: item.quantity }, { where: { id: item.productId }, transaction: t });
        }
      }
      await sale.destroy({ transaction: t });
    });
  }
}

Sale.init(
  {
    ownerId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    closureId: { type: DataTypes.INTEGER, allowNull: true },
    total: money('total'),
    cost: money('cost'),
  },
  { sequelize, modelName: 'Sale', tableName: 'sales' }
);

module.exports = Sale;
