const fs = require('fs');
const path = require('path');

// Iconos Phosphor (MIT) copiados a assets/icons e incrustados como SVG: <%- icon('plus') %>
// Viven dentro del proyecto para que también se empaqueten al desplegar en Vercel.
const dir = path.join(__dirname, '..', 'assets', 'icons');
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
