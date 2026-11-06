// Aplica el tema guardado antes de pintar la página, para evitar el parpadeo claro/oscuro.
try {
  var saved = localStorage.getItem('theme');
  if (saved === 'light' || saved === 'dark') document.documentElement.dataset.theme = saved;
} catch (e) {
  /* sin almacenamiento: se usa la preferencia del sistema */
}
