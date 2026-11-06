const { DataTypes, Model, Op } = require('sequelize');
const sequelize = require('../config/database');
const AppError = require('../utils/AppError');

const LOW_STOCK = 5;

// DECIMAL llega como string desde Postgres; este getter lo convierte a número.
const money = (field) => ({
  type: DataTypes.DECIMAL(12, 2),
  allowNull: false,
  get() {
    return Number(this.getDataValue(field));
  },
});

class Product extends Model {
  get margin() {
    return this.salePrice - this.costPrice;
  }

  get isLow() {
    return this.stock > 0 && this.stock <= LOW_STOCK;
  }

  // Listado del jefe con búsqueda por nombre, filtro de estado y paginación.
  static async search({ storeId, q, estado, limit, offset }) {
    const where = { ownerId: storeId };
    if (q) where.name = { [Op.iLike]: `%${q.replace(/[%_\\]/g, '\\$&')}%` };
    if (estado === 'bajo') where.stock = { [Op.gt]: 0, [Op.lte]: LOW_STOCK };
    if (estado === 'agotado') where.stock = 0;
    if (estado === 'inactivo') where.active = false;
    const { rows, count } = await Product.findAndCountAll({ where, order: [['name', 'ASC']], limit, offset });
    return { rows, count };
  }

  // Lo que ve el dependiente: SIN precio de compra.
  static forSale(storeId) {
    return Product.findAll({
      attributes: ['id', 'name', 'salePrice', 'stock'],
      where: { ownerId: storeId, active: true, stock: { [Op.gt]: 0 } },
      order: [['name', 'ASC']],
    });
  }

  static async findOwned(id, storeId) {
    const product = await Product.findOne({ where: { id, ownerId: storeId } });
    if (!product) throw new AppError('Producto no encontrado', 404);
    return product;
  }

  static async stockSummary(storeId) {
    const products = await Product.findAll({ where: { ownerId: storeId, active: true } });
    return {
      count: products.length,
      low: products.filter((p) => p.stock <= LOW_STOCK).length,
      value: products.reduce((sum, p) => sum + p.costPrice * p.stock, 0),
    };
  }

  async soldUnits() {
    return (await sequelize.models.SaleItem.sum('quantity', { where: { productId: this.id } })) || 0;
  }
}

Product.LOW_STOCK = LOW_STOCK;

Product.init(
  {
    ownerId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(100), allowNull: false },
    costPrice: money('costPrice'),
    salePrice: money('salePrice'),
    stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: { min: 0 } },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { sequelize, modelName: 'Product', tableName: 'products' }
);

module.exports = Product;
