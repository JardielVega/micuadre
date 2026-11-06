const fs = require('fs');
const path = require('path');

// Iconos Phosphor (regular) incrustados como SVG en las vistas: <%- icon('plus') %>
const dir = path.join(__dirname, '..', 'node_modules', '@phosphor-icons', 'core', 'assets', 'regular');
const cache = new Map();

function icon(name, cls = 'size-4') {
  const key = `${name}|${cls}`;
  if (!cache.has(key)) {
    if (!/^[a-z0-9-]+$/.test(name)) throw new Error(`Nombre de icono inválido: ${name}`);
    const svg = fs.readFileSync(path.join(dir, `${name}.svg`), 'utf8');
    cache.set(key, svg.replace('<svg ', `<svg class="${cls} shrink-0" aria-hidden="true" focusable="false" `));
  }
  return cache.get(key);
}

module.exports = icon;
