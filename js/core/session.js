/* ============================================================
   CORE · SESIÓN Y CONTROL DE ACCESO POR ROL (RNF-07 / RNF-24)
   ============================================================ */

/**
 * Obtiene el objeto de sesión desde sessionStorage
 */
export function getSession() {
  try { 
    return JSON.parse(sessionStorage.getItem('competia_session')); 
  } catch (e) { 
    return null; 
  }
}

/**
 * Guarda el objeto de usuario autenticado en sessionStorage.
 * IMPORTANTE: El objeto debe incluir el UUID de Supabase en 'id_usuario' o 'id'.
 */
export function setSession(usuario) {
  sessionStorage.setItem('competia_session', JSON.stringify(usuario));
}

/**
 * Verifica si existe sesión activa y si coincide con el rol esperado.
 * Si no coincide, redirige al login.
 */
export function requireRol(rol) {
  const s = getSession();
  if (!s || s.rol !== rol) {
    window.location.href = 'login.html';
    return null;
  }
  return s;
}

/**
 * Cierra la sesión y redirige a la landing page.
 */
export function cerrarSesion() {
  if (confirm('¿Cerrar sesión y volver al inicio?')) {
    sessionStorage.removeItem('competia_session');
    window.location.href = 'landing.html';
  }
}

// Hacer cerrarSesion disponible globalmente para botones con onclick="cerrarSesion()"
window.cerrarSesion = cerrarSesion;