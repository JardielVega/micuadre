require('dotenv').config({ quiet: true });
const { Sequelize } = require('sequelize');

const isTest = process.env.NODE_ENV === 'test';
const url = isTest ? process.env.DATABASE_URL_TEST || process.env.DATABASE_URL : process.env.DATABASE_URL;

if (!url) {
  throw new Error('Falta DATABASE_URL en el archivo .env');
}

const sequelize = new Sequelize(url, {
  dialect: 'postgres',
  logging: false,
  // En servicios en la nube (Render, Neon, etc.) la conexión suele exigir SSL.
  dialectOptions: process.env.DB_SSL === 'true' ? { ssl: { require: true, rejectUnauthorized: false } } : {},
});

module.exports = sequelize;
