/* ============================================================
   CORE · SESIÓN Y CONTROL DE ACCESO POR ROL (RNF-07 / RNF-24)
   ============================================================ */
function getSession() {
  try { return JSON.parse(sessionStorage.getItem('competia_session')); }
  catch (e) { return null; }
}

/* Si el rol no coincide, expulsa al login. Devuelve la sesión o null. */
function requireRol(rol) {
  const s = getSession();
  if (!s || s.rol !== rol) {
    window.location.href = 'login.html';
    return null;
  }
  return s;
}

function cerrarSesion() {
  if (confirm('¿Cerrar sesión y volver al inicio?')) {
    sessionStorage.removeItem('competia_session');
    window.location.href = 'landing.html';
  }
}