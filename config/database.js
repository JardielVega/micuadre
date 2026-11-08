require('dotenv').config({ quiet: true });
const pg = require('pg');
const { Sequelize } = require('sequelize');

const isTest = process.env.NODE_ENV === 'test';
const url = isTest ? process.env.DATABASE_URL_TEST || process.env.DATABASE_URL : process.env.DATABASE_URL;

if (!url) {
  throw new Error('Falta DATABASE_URL en el archivo .env');
}

const sequelize = new Sequelize(url, {
  dialect: 'postgres',
  // Se entrega el driver explícitamente: así también se empaqueta al desplegar en Vercel.
  dialectModule: pg,
  logging: false,
  // En serverless cada instancia abre pocas conexiones (la base usa un pool propio).
  pool: { max: process.env.VERCEL ? 2 : 10, min: 0, idle: 10000, acquire: 30000 },
  // En servicios en la nube (Neon, Render, etc.) la conexión exige SSL.
  dialectOptions: process.env.DB_SSL === 'true' ? { ssl: { require: true, rejectUnauthorized: false } } : {},
});

module.exports = sequelize;
