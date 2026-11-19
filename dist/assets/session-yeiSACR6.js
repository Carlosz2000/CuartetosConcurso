import{n as e}from"./rolldown-runtime-B8xr6ykz.js";function t(){try{return JSON.parse(sessionStorage.getItem(`competia_session`))}catch{return null}}function n(e){let n=t();if(!n||n.rol!==e)throw document.body.innerHTML=`
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
    `,Error(`Acceso no autorizado · Rol requerido: `+e);return n}function r(){confirm(`¿Cerrar sesión y volver al inicio?`)&&(sessionStorage.removeItem(`competia_session`),window.location.href=`landing.html`)}var i=e((()=>{window.cerrarSesion=r}));export{n,i as t};