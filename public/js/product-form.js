// Vista previa de la ganancia mientras se escriben los precios y la cantidad.
(() => {
  const cost = document.getElementById('costPrice');
  const sale = document.getElementById('salePrice');
  const stock = document.getElementById('stock');
  const unitEl = document.getElementById('margin-unit');
  const pctEl = document.getElementById('margin-pct');
  const totalEl = document.getElementById('margin-total');
  if (!cost || !sale || !stock) return;

  const money = (n) =>
    (n < 0 ? '-' : '') + '$' + Math.abs(n).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function update() {
    const c = parseFloat(cost.value) || 0;
    const s = parseFloat(sale.value) || 0;
    const q = parseInt(stock.value, 10) || 0;
    const unit = s - c;
    unitEl.textContent = money(unit);
    unitEl.classList.toggle('text-danger', unit < 0);
    unitEl.classList.toggle('text-ok', unit > 0);
    pctEl.textContent = (s > 0 ? Math.round((unit / s) * 100) : 0) + ' %';
    totalEl.textContent = money(unit * q);
  }

  [cost, sale, stock].forEach((el) => el.addEventListener('input', update));
  update();
})();
