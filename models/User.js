const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const AppError = require('../utils/AppError');

class User extends Model {
  // Todos los datos de una tienda cuelgan del jefe: el jefe es su propia "tienda"
  // y cada dependiente apunta a su jefe con bossId.
  get storeId() {
    return this.role === 'jefe' ? this.id : this.bossId;
  }

  checkPassword(password) {
    return bcrypt.compare(password, this.passwordHash);
  }

  static async register({ name, username, password, role = 'jefe', bossId = null }) {
    const clean = username.trim().toLowerCase();
    if (await User.findOne({ where: { username: clean } })) {
      throw new AppError('Ese nombre de usuario ya está en uso');
    }
    const passwordHash = await bcrypt.hash(password, 10);
    return User.create({ name: name.trim(), username: clean, passwordHash, role, bossId });
  }

  // Devuelve el usuario si las credenciales y el rol coinciden, o null.
  static async authenticate(username, password, role) {
    const user = await User.findOne({ where: { username: String(username).trim().toLowerCase(), role } });
    if (!user || !user.active || !(await user.checkPassword(password))) return null;
    return user;
  }

  static staffOf(bossId) {
    return User.findAll({ where: { bossId, role: 'dependiente' }, order: [['name', 'ASC']] });
  }

  static async findStaff(id, bossId) {
    const user = await User.findOne({ where: { id, bossId, role: 'dependiente' } });
    if (!user) throw new AppError('Dependiente no encontrado', 404);
    return user;
  }
}

User.init(
  {
    name: { type: DataTypes.STRING(80), allowNull: false },
    username: { type: DataTypes.STRING(40), allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('jefe', 'dependiente'), allowNull: false },
    bossId: { type: DataTypes.INTEGER, allowNull: true },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { sequelize, modelName: 'User', tableName: 'users' }
);

module.exports = User;
