// ----- Tema claro / oscuro -----
document.addEventListener('click', (event) => {
  if (!event.target.closest('[data-theme-toggle]')) return;
  const root = document.documentElement;
  const isDark =
    root.dataset.theme === 'dark' ||
    (!root.dataset.theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const next = isDark ? 'light' : 'dark';
  root.dataset.theme = next;
  try {
    localStorage.setItem('theme', next);
  } catch {
    /* sin almacenamiento */
  }
});

// ----- Confirmaciones: formularios con data-confirm="mensaje" abren un diálogo propio -----
const dialog = document.getElementById('confirm-dialog');
const okButton = document.getElementById('confirm-ok');
const messageEl = document.getElementById('confirm-message');
const detailEl = document.getElementById('confirm-detail');

document.addEventListener('submit', (event) => {
  const form = event.target;
  const message = form.dataset && form.dataset.confirm;
  if (!message) return;

  if (!dialog || typeof dialog.showModal !== 'function') {
    if (!window.confirm(message)) event.preventDefault();
    return;
  }

  event.preventDefault();
  messageEl.textContent = message;
  detailEl.textContent = form.dataset.confirmDetail || '';
  detailEl.classList.toggle('hidden', !form.dataset.confirmDetail);
  okButton.textContent = form.dataset.confirmLabel || 'Continuar';
  okButton.className = `btn btn-sm ${form.dataset.confirmTone === 'danger' ? 'btn-danger' : 'btn-ink'}`;

  dialog.addEventListener(
    'close',
    () => {
      if (dialog.returnValue === 'ok') form.submit(); // submit() no vuelve a disparar este evento
    },
    { once: true }
  );
  dialog.returnValue = 'cancel';
  dialog.showModal();
});

// ----- Avisos: se ocultan solos a los 5 s -----
const flash = document.querySelector('[data-flash]');
if (flash) {
  setTimeout(() => {
    flash.classList.add('flash-out');
    setTimeout(() => flash.remove(), 220);
  }, 5000);
}
