const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

const money = (field) => ({
  type: DataTypes.DECIMAL(12, 2),
  allowNull: false,
  get() {
    return Number(this.getDataValue(field));
  },
});

// Cada línea guarda una COPIA del nombre y los precios al momento de vender,
// para que cambiar un precio después no altere los cuadres anteriores.
class SaleItem extends Model {}

SaleItem.init(
  {
    saleId: { type: DataTypes.INTEGER, allowNull: false },
    productId: { type: DataTypes.INTEGER, allowNull: true },
    productName: { type: DataTypes.STRING(100), allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
    unitPrice: money('unitPrice'),
    unitCost: money('unitCost'),
  },
  { sequelize, modelName: 'SaleItem', tableName: 'sale_items', timestamps: false }
);

module.exports = SaleItem;
