// Ticket de la pantalla "Vender". Vive en el navegador y se envía al confirmar.
// El servidor vuelve a validar precios y stock, así que esto es solo comodidad.
// Cada línea es un nodo propio: al agregar o quitar solo se anima esa línea, no se repinta todo.
(() => {
  const STORAGE_KEY = 'tienda-cart';
  const $ = (id) => document.getElementById(id);

  const listEl = $('cart-items');
  const emptyEl = $('cart-empty');
  const totalEl = $('cart-total');
  const countEl = $('cart-count');
  const inputEl = $('cart-input');
  const confirmBtn = $('cart-confirm');
  const clearBtn = $('cart-clear');
  const form = $('cart-form');
  const template = $('ticket-line-template');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const money = (n) => '$' + n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Productos disponibles en pantalla: id -> datos y referencias a su fila.
  const products = new Map();
  document.querySelectorAll('[data-add]').forEach((btn) => {
    const d = btn.dataset;
    const row = btn.closest('tr');
    products.set(d.id, {
      id: d.id,
      name: d.name,
      price: Number(d.price),
      stock: Number(d.stock),
      btn,
      label: btn.querySelector('[data-add-label]'),
      row,
      badge: row.querySelector('[data-in-cart]'),
    });
  });

  // Ticket actual: id -> { qty, el, refs }
  const cart = new Map();

  function save() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...cart].map(([id, l]) => ({ id, qty: l.qty }))));
    } catch {
      /* almacenamiento no disponible */
    }
  }

  function bump(el) {
    if (reduceMotion) return;
    el.classList.remove('bump');
    void el.offsetWidth; // reinicia la animación
    el.classList.add('bump');
  }

  function paintLine(id, line) {
    const p = products.get(id);
    line.refs.qty.textContent = line.qty;
    line.refs.line.textContent = money(p.price * line.qty);
    line.refs.inc.disabled = line.qty >= p.stock;
    line.refs.inc.classList.toggle('opacity-40', line.qty >= p.stock);
  }

  function paintProduct(id) {
    const p = products.get(id);
    const qty = cart.has(id) ? cart.get(id).qty : 0;
    p.badge.textContent = `${qty} en ticket`;
    p.badge.classList.toggle('hidden', qty === 0);
    const full = qty >= p.stock;
    p.btn.disabled = full;
    p.label.textContent = full ? 'Máximo' : 'Agregar';
  }

  function totals() {
    let total = 0;
    let count = 0;
    for (const [id, l] of cart) {
      total += products.get(id).price * l.qty;
      count += l.qty;
    }
    totalEl.textContent = money(total);
    countEl.textContent = count;
    inputEl.value = JSON.stringify([...cart].map(([id, l]) => ({ productId: Number(id), quantity: l.qty })));
    const empty = cart.size === 0;
    emptyEl.classList.toggle('hidden', !empty);
    confirmBtn.disabled = empty;
    clearBtn.disabled = empty;
    save();
  }

  function createLine(id, animate) {
    const p = products.get(id);
    const el = template.content.firstElementChild.cloneNode(true);
    const refs = {
      qty: el.querySelector('[data-qty]'),
      line: el.querySelector('[data-line]'),
      inc: el.querySelector('[data-inc]'),
      dec: el.querySelector('[data-dec]'),
    };
    el.querySelector('[data-name]').textContent = p.name;
    el.querySelector('[data-unit]').textContent = `${money(p.price)} c/u`;
    refs.inc.setAttribute('aria-label', `Una unidad más de ${p.name}`);
    refs.dec.setAttribute('aria-label', `Una unidad menos de ${p.name}`);
    refs.inc.addEventListener('click', () => change(id, 1));
    refs.dec.addEventListener('click', () => change(id, -1));

    const line = { qty: 0, el, refs };
    if (animate && !reduceMotion) {
      el.classList.add('is-new');
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('is-new')));
    }
    listEl.append(el);
    return line;
  }

  function removeLine(id) {
    const line = cart.get(id);
    cart.delete(id);
    if (reduceMotion) {
      line.el.remove();
    } else {
      line.el.classList.add('is-leaving');
      setTimeout(() => line.el.remove(), 190);
    }
  }

  function change(id, delta) {
    const p = products.get(id);
    let line = cart.get(id);
    if (!line) {
      if (delta < 0) return;
      line = createLine(id, true);
      cart.set(id, line);
    }
    const qty = line.qty + delta;
    if (qty <= 0) {
      removeLine(id);
    } else if (qty <= p.stock) {
      line.qty = qty;
      paintLine(id, line);
      bump(line.refs.qty);
    }
    paintProduct(id);
    totals();
  }

  products.forEach((p, id) => {
    p.btn.addEventListener('click', () => {
      change(id, 1);
      if (!reduceMotion) {
        p.row.classList.remove('row-flash');
        void p.row.offsetWidth;
        p.row.classList.add('row-flash');
      }
    });
  });

  clearBtn.addEventListener('click', () => {
    [...cart.keys()].forEach((id) => {
      removeLine(id);
      paintProduct(id);
    });
    totals();
  });

  // Tras confirmar, la página se recarga con el stock nuevo y el ticket vacío.
  form.addEventListener('submit', () => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* nada */
    }
  });

  // Recupera el ticket si se recargó la página (solo productos que siguen disponibles).
  try {
    for (const { id, qty } of JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]')) {
      const p = products.get(String(id));
      if (!p || !(qty > 0)) continue;
      const line = createLine(p.id, false);
      line.qty = Math.min(qty, p.stock);
      cart.set(p.id, line);
      paintLine(p.id, line);
      paintProduct(p.id);
    }
  } catch {
    /* ticket guardado dañado: se ignora */
  }
  totals();

  // Búsqueda en el listado. La tecla "/" enfoca el buscador (sin animación: es una acción de teclado).
  const filter = $('product-filter');
  const rows = document.querySelectorAll('#product-list tr[data-name]');
  const noMatch = $('no-match');

  filter.addEventListener('input', () => {
    const q = filter.value.trim().toLowerCase();
    let visible = 0;
    rows.forEach((row) => {
      const show = row.dataset.name.includes(q);
      row.classList.toggle('hidden', !show);
      if (show) visible += 1;
    });
    noMatch.classList.toggle('hidden', visible > 0 || rows.length === 0);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
    const tag = event.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || event.target.isContentEditable) return;
    event.preventDefault();
    filter.focus();
  });
})();
