// js/profesor.js
import { requireRol } from './core/session.js';
import { obtenerCuartetosPorProfesorBD, cambiarEstadoInscripcionBD } from './services/profesorService.js';

let profesorSesion = null;
let activeProfTab = 'mis';
let misCuartetos = [];

document.addEventListener('DOMContentLoaded', async () => {
  profesorSesion = requireRol('profesor');
  if (!profesorSesion) return;

  const elCred = document.getElementById('profesorCredencial');
  if (elCred) {
    const nombre = profesorSesion.nombre || profesorSesion.nombres || 'Docente Supervisor';
    const correo = profesorSesion.email || profesorSesion.correo_institucional || profesorSesion.correo || '';
    elCred.textContent = `${nombre}${correo ? ' · ' + correo : ''}`;
  }

  // Bind de eventos para cambio de pestañas
  document.querySelectorAll('[data-prof-tab]').forEach(btn => {
    btn.addEventListener('click', async () => {
      activeProfTab = btn.dataset.profTab;
      document.querySelectorAll('[data-prof-tab]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      await renderProfTab();
    });
  });

  await cargarCuartetos();
  await renderProfTab();
});

/**
 * Carga los cuartetos asignados desde Supabase utilizando el ID del profesor en sesión.
 */
async function cargarCuartetos() {
  const idProfesor = profesorSesion.id_usuario || profesorSesion.id;
  if (idProfesor) {
    misCuartetos = await obtenerCuartetosPorProfesorBD(idProfesor);
  } else {
    misCuartetos = [];
  }
}

/**
 * Renderiza la pestaña activa.
 */
async function renderProfTab() {
  const cont = document.getElementById('profesorMainContent');
  if (!cont) return;

  if (activeProfTab === 'mis') {
    renderPortalProfesor();
  } else if (activeProfTab === 'validar') {
    renderValidacionFichas();
  }
}

/* ------------------------------------------------------------
   TAB: MIS CUARTETOS (HU-06)
   ------------------------------------------------------------ */
function renderPortalProfesor() {
  const cont = document.getElementById('profesorMainContent');
  if (!cont) return;

  cont.innerHTML = `
    <div class="card">
      <div class="ficha-header">
        <div>
          <h2>👨‍🏫 Mis Cuartetos Vinculados</h2>
          <p class="subtitle">HU-06 · Supervisión Académica</p>
        </div>
        <span class="badge badge-ok">Rol: Docente Supervisor</span>
      </div>
      ${misCuartetos.length === 0 ? 
        '<div class="alert alert-warn"><div>No tienes cuartetos vinculados bajo tu supervisión.</div></div>' :
        misCuartetos.map(c => {
          const estado = c.estado_inscripcion || 'En Borrador';
          const esInscrito = estado === 'Inscrito';
          const esRechazado = estado === 'Rechazado';

          return `
            <div class="integrante-card" style="background:#fff; margin-bottom:16px; border-left:4px solid ${esInscrito ? 'var(--success, #16a34a)' : (esRechazado ? 'var(--danger, #dc2626)' : 'var(--profesor, #b45309)')};">
              <h4>${c.nombre_cuarteto || 'Sin Nombre'} <span class="chip">${c.codigo_cuarteto || ('#' + c.id_cuarteto)}</span></h4>
              <p style="font-size:13px; color:var(--muted); margin-top:4px;">
                Estado: <strong>${estado}</strong>
              </p>
              <div style="font-size:13px; color:var(--muted); margin-top:6px;">
                🎼 <strong>Obra Obligatoria:</strong> ${c.obra_obligatoria || 'No asignada'}<br>
                🎻 <strong>Obra Libre:</strong> ${c.obra_libre_titulo || 'No asignada'} (${c.obra_libre_duracion || '0:00'})
              </div>
            </div>
          `;
        }).join('')}
    </div>
  `;
}

/* ------------------------------------------------------------
   TAB: VALIDAR FICHAS (HU-07)
   ------------------------------------------------------------ */
function renderValidacionFichas() {
  const cont = document.getElementById('profesorMainContent');
  if (!cont) return;

  cont.innerHTML = `
    <div class="card">
      <div class="ficha-header">
        <div>
          <h2>✅ Validación de Expedientes (HU-07)</h2>
          <p class="subtitle">Aprueba o rechaza la inscripción de tus cuartetos para autorizar su pase al Jurado.</p>
        </div>
        <span class="badge badge-ok">${misCuartetos.length} cuartetos bajo tu supervisión</span>
      </div>
      ${misCuartetos.length === 0 ? 
        '<div class="alert alert-warn"><div>No tienes cuartetos para validar en este momento.</div></div>' :
        misCuartetos.map(c => {
          const estado = c.estado_inscripcion || 'En Borrador';
          const esInscrito = estado === 'Inscrito';
          const esRechazado = estado === 'Rechazado';

          return `
            <div class="integrante-card" style="background:#fff; margin-bottom:16px; border-left:4px solid ${esInscrito ? 'var(--success, #16a34a)' : (esRechazado ? 'var(--danger, #dc2626)' : 'var(--primary, #2563eb)')};">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px;">
                <div>
                  <h4 style="margin-bottom:4px;">🎻 ${c.nombre_cuarteto || 'Sin Nombre'} <span class="chip">${c.codigo_cuarteto || ('#' + c.id_cuarteto)}</span></h4>
                  <div style="font-size:13px; color:var(--muted);">
                    🎼 Obra Obligatoria: ${c.obra_obligatoria || 'Sin asignar'} | Libre: ${c.obra_libre_titulo || 'Sin asignar'}
                  </div>
                </div>
                <span class="badge ${esInscrito ? 'badge-ok' : (esRechazado ? 'badge-danger' : 'badge-draft')}">${estado}</span>
              </div>
              
              <div style="margin-top:12px; display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                <button type="button" 
                        class="btn btn-success btn-val-accion" 
                        data-id="${c.id_cuarteto}" 
                        data-est="Inscrito" 
                        ${esInscrito ? 'disabled' : ''}>
                  ✓ Aprobar e Inscribir
                </button>
                <button type="button" 
                        class="btn btn-danger btn-val-accion" 
                        data-id="${c.id_cuarteto}" 
                        data-est="Rechazado" 
                        ${esRechazado ? 'disabled' : ''}>
                  ✕ Rechazar
                </button>
              </div>
            </div>
          `;
        }).join('')}
    </div>
  `;

  // Bind de eventos para los botones de acción
  document.querySelectorAll('.btn-val-accion').forEach(btn => {
    btn.addEventListener('click', async function () {
      const idCuarteto = this.dataset.id;
      const nuevoEstado = this.dataset.est;

      try {
        await cambiarEstadoInscripcionBD(idCuarteto, nuevoEstado);
        await cargarCuartetos();
        await renderProfTab();
      } catch (err) {
        alert('Ocurrió un error al intentar cambiar el estado del cuarteto en la base de datos.');
      }
    });
  });
}