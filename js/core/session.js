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
 * Si no coincide, bloquea la pantalla de forma global e instantánea.
 */
export function requireRol(rol) {
  const s = getSession();
  
  if (!s || s.rol !== rol) {
    // 🛑 BLINDAJE VISUAL GLOBAL INMEDIATO: 
    // Limpia todo el body y monta un fondo sólido con el aviso de acceso restringido.
    // Esto evita que se alcance a renderizar el HTML privado de abajo.
    document.body.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: #f8fafc; z-index: 99999; display: flex; justify-content: center; align-items: center; font-family: system-ui, -apple-system, sans-serif;">
        <div style="background: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05); text-align: center; max-width: 420px; width: 90%; border: 1px solid #e2e8f0;">
          <div style="font-size: 48px; margin-bottom: 12px;">🔒</div>
          <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 20px;">Acceso Restringido</h2>
          <p style="color: #64748b; font-size: 14px; margin: 0 0 24px 0; line-height: 1.5;">
            El módulo al que intentas acceder requiere autenticación y permisos específicos. No cuentas con la autorización necesaria.
          </p>
          <a href="login.html" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; transition: background 0.2s;">
            Iniciar Sesión
          </a>
        </div>
      </div>
    `;

    // Detiene la ejecución del script actual
    throw new Error('Acceso no autorizado · Rol requerido: ' + rol);
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