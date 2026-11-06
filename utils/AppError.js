// Error "esperado" (validación, permisos, no encontrado). El manejador global lo muestra tal cual.
class AppError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

module.exports = AppError;
