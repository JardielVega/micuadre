require('dotenv').config({ quiet: true });
const path = require('path');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');

const { sequelize } = require('./models');
const flash = require('./middlewares/flash');
const { loadUser } = require('./middlewares/auth');
const { notFound, errorHandler } = require('./middlewares/errorHandler');
const { LIMITS } = require('./utils/helpers');
const icon = require('./utils/icons');
const authController = require('./controllers/authController');

const isProd = process.env.NODE_ENV === 'production';
const app = express();

if (isProd) app.set('trust proxy', 1); // detrás del proxy de la plataforma (HTTPS)

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// En local (http) el navegador no debe forzar https; en producción sí.
app.use(
  helmet({
    contentSecurityPolicy: { useDefaults: true, directives: isProd ? {} : { 'upgrade-insecure-requests': null } },
  })
);
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use(methodOverride('_method')); // permite PUT/DELETE desde formularios: ?_method=DELETE
app.use(flash);
app.use(loadUser);

// Ayudas disponibles en todas las vistas.
app.use((req, res, next) => {
  res.locals.user = res.locals.user || null;
  res.locals.pageScript = null;
  res.locals.limits = LIMITS;
  res.locals.icon = icon;
  res.locals.path = req.path;
  res.locals.money = (n) =>
    '$' + Number(n || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  res.locals.fmtDate = (d) => new Date(d).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
  // Construye una URL conservando los filtros actuales: urlWith({ page: 2 })
  // La ruta completa se guarda ahora: dentro de un router, req.path ya no incluye el prefijo (/productos).
  const pathname = req.originalUrl.split('?')[0];
  res.locals.urlWith = (extra) => {
    const params = new URLSearchParams({ ...req.query, ...extra });
    for (const [key, value] of [...params]) if (value === '') params.delete(key);
    const qs = params.toString();
    return pathname + (qs ? `?${qs}` : '');
  };
  next();
});

app.get('/', authController.landing);
app.use('/auth', require('./routes/auth'));
app.use('/productos', require('./routes/productos'));
app.use('/dependientes', require('./routes/dependientes'));
app.use('/vender', require('./routes/vender'));
app.use('/cuadre', require('./routes/cuadre'));

app.use(notFound);
app.use(errorHandler);

async function start() {
  if (!process.env.JWT_SECRET) throw new Error('Falta JWT_SECRET en el archivo .env');
  await sequelize.authenticate();
  await sequelize.sync(); // crea las tablas si no existen
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Servidor listo en http://localhost:${port}`));
}

if (require.main === module) {
  start().catch((err) => {
    console.error('No se pudo iniciar la aplicación:', err.message);
    process.exit(1);
  });
}

module.exports = app;
