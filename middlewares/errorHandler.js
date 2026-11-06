function notFound(req, res) {
  res.status(404).render('error', { title: 'No encontrado', status: 404, message: 'La página que buscas no existe' });
}

// Manejador global: cualquier error lanzado en rutas o controladores termina aquí.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  const message = status >= 500 && process.env.NODE_ENV === 'production' ? 'Ocurrió un error en el servidor' : err.message;
  res.status(status).render('error', { title: 'Error', status, message });
}

module.exports = { notFound, errorHandler };
