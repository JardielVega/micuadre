const AppError = require('./AppError');

const LIMITS = [5, 10, 20, 50];

// Lee ?page=2&limit=10 de la URL con valores seguros.
function parsePaging(query, defaultLimit = 10) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const asked = parseInt(query.limit, 10);
  const limit = LIMITS.includes(asked) ? asked : defaultLimit;
  return { page, limit, offset: (page - 1) * limit };
}

function pagerMeta(total, page, limit) {
  return { total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) };
}

function toId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new AppError('Recurso no encontrado', 404);
  return id;
}

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

// Fecha YYYY-MM-DD (de un <input type="date">) a un Date local; devuelve null si no es válida.
function parseDay(value, endOfDay = false) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
  const d = new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00'}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

module.exports = { LIMITS, parsePaging, pagerMeta, toId, round2, parseDay };
