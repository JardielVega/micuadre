const request = require('supertest');
const app = require('../app');
const { sequelize, User, Product, Sale, Closure } = require('../models');

// Cada test usa su propio "agente" para conservar la cookie de sesión.
const as = () => request.agent(app);

let boss;
let seller;
let rice;

async function loginJefe(agent) {
  await agent.post('/auth/jefe/login').type('form').send({ username: 'jefe', password: 'secreto123' }).expect(302);
}
async function loginDependiente(agent) {
  await agent.post('/auth/dependiente').type('form').send({ username: 'ana', password: 'clave123' }).expect(302);
}
const cart = (items) => ({ items: JSON.stringify(items) });

beforeAll(async () => {
  await sequelize.sync({ force: true });
  boss = await User.register({ name: 'Jefe', username: 'jefe', password: 'secreto123' });
  seller = await User.register({ name: 'Ana', username: 'ana', password: 'clave123', role: 'dependiente', bossId: boss.id });
  rice = await Product.create({ ownerId: boss.id, name: 'Arroz', costPrice: 1, salePrice: 2, stock: 10 });
  await Product.create({ ownerId: boss.id, name: 'Aceite', costPrice: 2, salePrice: 3.5, stock: 5 });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Autenticación', () => {
  test('rutas privadas redirigen al inicio sin sesión', async () => {
    await request(app).get('/productos').expect(302).expect('Location', '/');
    await request(app).get('/vender').expect(302).expect('Location', '/');
  });

  test('la contraseña se guarda con hash', async () => {
    expect(boss.passwordHash).not.toBe('secreto123');
    expect(boss.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  test('el jefe se registra y queda con sesión iniciada', async () => {
    const agent = as();
    const res = await agent
      .post('/auth/jefe/registro')
      .type('form')
      .send({ name: 'Nuevo Jefe', username: 'nuevo', password: 'abc12345', confirm: 'abc12345' })
      .expect(302);
    expect(res.headers.location).toBe('/productos');
    expect(res.headers['set-cookie'].join(';')).toMatch(/token=.*HttpOnly/);
  });

  test('rechaza registro con contraseñas distintas o usuario repetido', async () => {
    await as().post('/auth/jefe/registro').type('form')
      .send({ name: 'X Y', username: 'otro', password: 'abc12345', confirm: 'distinta' }).expect(422);
    await as().post('/auth/jefe/registro').type('form')
      .send({ name: 'X Y', username: 'jefe', password: 'abc12345', confirm: 'abc12345' }).expect(422);
  });

  test('credenciales incorrectas no inician sesión', async () => {
    await as().post('/auth/jefe/login').type('form').send({ username: 'jefe', password: 'mala' }).expect(401);
  });

  test('un jefe no puede entrar por la puerta del dependiente y viceversa', async () => {
    await as().post('/auth/dependiente').type('form').send({ username: 'jefe', password: 'secreto123' }).expect(401);
    await as().post('/auth/jefe/login').type('form').send({ username: 'ana', password: 'clave123' }).expect(401);
  });
});

describe('Roles', () => {
  test('el dependiente no puede entrar a inventario completo, dependientes ni cuadre', async () => {
    const agent = as();
    await loginDependiente(agent);
    await agent.get('/productos').expect(403);
    await agent.get('/dependientes').expect(403);
    await agent.get('/cuadre').expect(403);
  });

  test('el jefe no puede usar la pantalla de vender', async () => {
    const agent = as();
    await loginJefe(agent);
    await agent.get('/vender').expect(403);
  });

  test('la pantalla de vender NO revela el precio de compra', async () => {
    const agent = as();
    await loginDependiente(agent);
    const res = await agent.get('/vender').expect(200);
    expect(res.text).toContain('Arroz');
    expect(res.text).toContain('2,00'); // precio de venta
    expect(res.text).not.toContain('1,00'); // precio de compra
  });
});

describe('CRUD de productos (jefe)', () => {
  test('crear, ver, editar y eliminar', async () => {
    const agent = as();
    await loginJefe(agent);

    await agent.post('/productos').type('form')
      .send({ name: 'Sal', costPrice: '0.30', salePrice: '0.60', stock: '20', active: 'on' }).expect(302);
    const salt = await Product.findOne({ where: { name: 'Sal' } });
    expect(salt.stock).toBe(20);

    await agent.get(`/productos/${salt.id}`).expect(200);
    await agent.put(`/productos/${salt.id}`).type('form')
      .send({ name: 'Sal fina', costPrice: '0.30', salePrice: '0.70', stock: '15', active: 'on' }).expect(302);
    expect((await salt.reload()).name).toBe('Sal fina');

    await agent.delete(`/productos/${salt.id}`).expect(302);
    expect(await Product.findByPk(salt.id)).toBeNull();
  });

  test('valida los datos del formulario', async () => {
    const agent = as();
    await loginJefe(agent);
    await agent.post('/productos').type('form')
      .send({ name: 'A', costPrice: '-1', salePrice: '0', stock: 'x' }).expect(422);
  });

  test('paginación y búsqueda', async () => {
    await Product.bulkCreate(
      Array.from({ length: 12 }, (_, i) => ({ ownerId: boss.id, name: `Lote ${i + 1}`, costPrice: 1, salePrice: 2, stock: 1 }))
    );
    const agent = as();
    await loginJefe(agent);
    const page1 = await agent.get('/productos?limit=5&page=1').expect(200);
    const page2 = await agent.get('/productos?limit=5&page=2').expect(200);
    expect(page1.text).not.toBe(page2.text);
    expect(page1.text).toMatch(/Página\s*<span[^>]*>1<\/span>\s*de/);
    expect(page2.text).toMatch(/Página\s*<span[^>]*>2<\/span>\s*de/);
    // Los enlaces de paginación deben conservar la ruta y los filtros
    expect(page1.text).toContain('href="/productos?limit=5&amp;page=2"');
    expect(page1.text).not.toContain('href="/?limit');
    const found = await agent.get('/productos?q=aceite').expect(200);
    expect(found.text).toContain('Aceite');
    expect(found.text).not.toContain('Lote 1<');
  });

  test('un jefe no ve productos de otro jefe', async () => {
    const other = await User.register({ name: 'Otro', username: 'otrojefe', password: 'abc12345' });
    const foreign = await Product.create({ ownerId: other.id, name: 'Ajeno', costPrice: 1, salePrice: 2, stock: 1 });
    const agent = as();
    await loginJefe(agent);
    await agent.get(`/productos/${foreign.id}`).expect(404);
    await agent.delete(`/productos/${foreign.id}`).expect(404);
  });
});

describe('Ventas y cuadre', () => {
  test('vender descuenta stock y no permite pasarse del inventario', async () => {
    const agent = as();
    await loginDependiente(agent);

    await agent.post('/vender').type('form').send(cart([{ productId: rice.id, quantity: 3 }])).expect(302);
    expect((await rice.reload()).stock).toBe(7);

    await agent.post('/vender').type('form').send(cart([{ productId: rice.id, quantity: 99 }])).expect(302);
    expect((await rice.reload()).stock).toBe(7);
    expect(await Sale.count({ where: { userId: seller.id } })).toBe(1);
  });

  test('anular una venta devuelve el stock', async () => {
    const agent = as();
    await loginDependiente(agent);
    await agent.post('/vender').type('form').send(cart([{ productId: rice.id, quantity: 2 }])).expect(302);
    expect((await rice.reload()).stock).toBe(5);
    const sale = await Sale.findOne({ where: { userId: seller.id }, order: [['id', 'DESC']] });
    await agent.delete(`/vender/ventas/${sale.id}`).expect(302);
    expect((await rice.reload()).stock).toBe(7);
  });

  test('finalizar día crea el cierre con ganancia correcta y el jefe lo ve', async () => {
    const agent = as();
    await loginDependiente(agent);
    // Venta abierta actual: 3 de arroz (venta 2, compra 1) = total 6, costo 3.
    await agent.post('/vender').type('form').send(cart([{ productId: rice.id, quantity: 1 }])).expect(302);
    // Ahora son 4 de arroz: total 8, costo 4, ganancia 4.
    await agent.post('/vender/finalizar').expect(302);

    const closure = await Closure.findOne({ where: { userId: seller.id } });
    expect(closure.total).toBe(8);
    expect(closure.cost).toBe(4);
    expect(closure.profit).toBe(4);
    expect(closure.unitsCount).toBe(4);
    expect(await Sale.count({ where: { closureId: null, userId: seller.id } })).toBe(0);

    // El cierre ya no se puede repetir sin ventas nuevas.
    await agent.post('/vender/finalizar').expect(302);
    expect(await Closure.count({ where: { userId: seller.id } })).toBe(1);

    const boss1 = as();
    await loginJefe(boss1);
    const list = await boss1.get('/cuadre').expect(200);
    expect(list.text).toContain('Cierre');
    const detail = await boss1.get(`/cuadre/${closure.id}`).expect(200);
    expect(detail.text).toContain('Arroz');
  });

  test('cambiar el precio después no altera el cuadre ya cerrado', async () => {
    await rice.update({ salePrice: 50 });
    const closure = await Closure.findOne({ where: { userId: seller.id } });
    expect(closure.total).toBe(8);
  });

  test('una venta ya cerrada no se puede anular', async () => {
    const agent = as();
    await loginDependiente(agent);
    const closed = await Sale.findOne({ where: { userId: seller.id } });
    const before = (await rice.reload()).stock;
    await agent.delete(`/vender/ventas/${closed.id}`).expect(302);
    expect((await rice.reload()).stock).toBe(before);
    expect(await Sale.findByPk(closed.id)).not.toBeNull();
  });
});

describe('Errores', () => {
  test('404 para rutas inexistentes', async () => {
    await request(app).get('/no-existe').expect(404);
  });
});
