// En Vercel las tablas se crean en la primera petición. Si la base de datos falla (por ejemplo,
// una contraseña incorrecta), el visitante debe ver la página de error y no un "Internal Server Error".
process.env.VERCEL = '1';

const request = require('supertest');
const { sequelize } = require('../models');

jest.spyOn(sequelize, 'sync').mockRejectedValue(new Error('la base de datos no responde'));

const app = require('../app');

test('si la base de datos falla, se muestra la página de error con su diseño', async () => {
  const res = await request(app).get('/');
  expect(res.status).toBe(500);
  expect(res.text).toContain('Volver al inicio');
  expect(res.text).toContain('<svg'); // el layout y sus iconos se dibujaron
});

test('sin sesión, las páginas de error no dependen del usuario', async () => {
  const res = await request(app).get('/no-existe');
  expect(res.status).toBeGreaterThanOrEqual(400);
  expect(res.text).not.toContain('is not defined');
});
