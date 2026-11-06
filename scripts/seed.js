// Datos de demostración: npm run seed
// Crea un jefe, un dependiente y varios productos (no borra nada existente).
const { sequelize, User, Product } = require('../models');

async function seed() {
  await sequelize.sync();

  let boss = await User.findOne({ where: { username: 'jefe' } });
  if (!boss) boss = await User.register({ name: 'Jefe Demo', username: 'jefe', password: 'jefe123' });

  if (!(await User.findOne({ where: { username: 'dependiente' } }))) {
    await User.register({
      name: 'Dependiente Demo',
      username: 'dependiente',
      password: 'dependiente123',
      role: 'dependiente',
      bossId: boss.id,
    });
  }

  if ((await Product.count({ where: { ownerId: boss.id } })) === 0) {
    const demo = [
      ['Arroz 1 kg', 1.2, 1.8, 40],
      ['Aceite 1 L', 2.5, 3.6, 25],
      ['Azúcar 1 kg', 0.9, 1.4, 30],
      ['Refresco 2 L', 1.1, 1.9, 18],
      ['Pan de molde', 1.0, 1.5, 12],
      ['Huevos (docena)', 2.2, 3.0, 4],
      ['Detergente', 3.0, 4.5, 9],
      ['Galletas', 0.5, 0.9, 60],
      ['Leche en polvo', 4.0, 5.5, 3],
      ['Jabón de baño', 0.6, 1.0, 35],
      ['Café 250 g', 2.8, 4.0, 15],
      ['Sal 1 kg', 0.3, 0.6, 50],
    ];
    await Product.bulkCreate(
      demo.map(([name, costPrice, salePrice, stock]) => ({ ownerId: boss.id, name, costPrice, salePrice, stock }))
    );
  }

  console.log('Listo. Jefe: jefe / jefe123 · Dependiente: dependiente / dependiente123');
  await sequelize.close();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
