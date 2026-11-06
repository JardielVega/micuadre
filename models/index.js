const sequelize = require('../config/database');
const User = require('./User');
const Product = require('./Product');
const Sale = require('./Sale');
const SaleItem = require('./SaleItem');
const Closure = require('./Closure');

// Dependiente -> jefe
User.hasMany(User, { as: 'staff', foreignKey: 'bossId', onDelete: 'CASCADE' });
User.belongsTo(User, { as: 'boss', foreignKey: 'bossId' });

// Productos de cada tienda (jefe)
User.hasMany(Product, { foreignKey: 'ownerId', onDelete: 'CASCADE' });
Product.belongsTo(User, { as: 'owner', foreignKey: 'ownerId' });

// Ventas
Sale.belongsTo(User, { as: 'seller', foreignKey: 'userId', onDelete: 'RESTRICT' });
User.hasMany(Sale, { foreignKey: 'userId' });
Sale.belongsTo(User, { as: 'owner', foreignKey: 'ownerId', onDelete: 'CASCADE' });
Sale.hasMany(SaleItem, { as: 'items', foreignKey: 'saleId', onDelete: 'CASCADE' });
SaleItem.belongsTo(Sale, { foreignKey: 'saleId' });
SaleItem.belongsTo(Product, { foreignKey: 'productId', onDelete: 'SET NULL' });

// Cierres de día
Closure.belongsTo(User, { as: 'closedBy', foreignKey: 'userId', onDelete: 'RESTRICT' });
Closure.belongsTo(User, { as: 'owner', foreignKey: 'ownerId', onDelete: 'CASCADE' });
Closure.hasMany(Sale, { as: 'sales', foreignKey: 'closureId', onDelete: 'SET NULL' });
Sale.belongsTo(Closure, { foreignKey: 'closureId', onDelete: 'SET NULL' });

module.exports = { sequelize, User, Product, Sale, SaleItem, Closure };
