// js/profesor.js
import { requireRol } from './core/session.js';
import { obtenerCuartetosPorProfesorBD, cambiarEstadoInscripcionBD } from './services/profesorService.js';
import { supabase } from '../config/supabase.js';

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
              ${c.observacion_profesor ? `
                <div style="margin-top:8px; padding:8px; background:#f8fafc; border-left:3px solid var(--primary); font-size:12px; border-radius:4px;">
                  <strong>💬 Observación del Docente:</strong> ${c.observacion_profesor}
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
    </div>
  `;
}

/* ------------------------------------------------------------
   TAB: VALIDAR FICHAS (HU-07) - CON MOTIVO DE APROBACIÓN/RECHAZO
   ------------------------------------------------------------ */
function renderValidacionFichas() {
  const cont = document.getElementById('profesorMainContent');
  if (!cont) return;

  cont.innerHTML = `
    <div class="card">
      <div class="ficha-header">
        <div>
          <h2>✅ Validación de Expedientes (HU-07)</h2>
          <p class="subtitle">Aprueba o rechaza la inscripción de tus cuartetos añadiendo un motivo oficial para el representante.</p>
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
            <div class="integrante-card" style="background:#fff; margin-bottom:16px; border-left:4px solid ${esInscrito ? 'var(--success, #16a34a)' : (esRechazado ? 'var(--danger, #dc2626)' : 'var(--primary, #2563eb)')}; padding: 16px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px;">
                <div>
                  <h4 style="margin-bottom:4px;">🎻 ${c.nombre_cuarteto || 'Sin Nombre'} <span class="chip">${c.codigo_cuarteto || ('#' + c.id_cuarteto)}</span></h4>
                  <div style="font-size:13px; color:var(--muted);">
                    🎼 Obra Obligatoria: ${c.obra_obligatoria || 'Sin asignar'} | Libre: ${c.obra_libre_titulo || 'Sin asignar'}
                  </div>
                </div>
                <span class="badge ${esInscrito ? 'badge-ok' : (esRechazado ? 'badge-danger' : 'badge-draft')}">${estado}</span>
              </div>

              ${c.observacion_profesor ? `
                <div style="margin-top:10px; padding:10px; background:#f8fafc; border-left:3px solid var(--primary); font-size:13px; border-radius:4px;">
                  <strong>💬 Observación del Docente registrada:</strong> ${c.observacion_profesor}
                </div>
              ` : ''}
              
              <div style="margin-top:14px; display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                <button type="button" class="btn btn-success btn-iniciar-val" data-id="${c.id_cuarteto}" data-est="Inscrito">
                  ✓ Aprobar e Inscribir
                </button>
                <button type="button" class="btn btn-danger btn-iniciar-val" data-id="${c.id_cuarteto}" data-est="Rechazado">
                  ✕ Rechazar
                </button>
              </div>

              <!-- Contenedor dinámico oculto para escribir el motivo -->
              <div id="val-form-${c.id_cuarteto}" style="display:none; margin-top:12px; background:#fdfdfd; padding:12px; border:1px solid #e2e8f0; border-radius:6px;">
                <label style="font-size:12px; font-weight:700; display:block; margin-bottom:6px;">✍️ Escribe el motivo de la <span id="val-label-tipo-${c.id_cuarteto}">validación</span>:</label>
                <textarea id="val-txt-${c.id_cuarteto}" rows="2" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:4px; font-size:13px;" placeholder="Ej. Documentación completa y conforme con las bases del concurso..."></textarea>
                <div style="margin-top:8px; display:flex; gap:8px;">
                  <button type="button" class="btn btn-primary btn-enviar-val" data-id="${c.id_cuarteto}" style="padding:6px 12px; font-size:12px;">Enviar y Actualizar Estado</button>
                  <button type="button" class="btn btn-secondary btn-cancelar-val" data-id="${c.id_cuarteto}" style="padding:6px 12px; font-size:12px;">Cancelar</button>
                </div>
              </div>

            </div>
          `;
        }).join('')}
    </div>
  `;

  // Evento para desplegar el campo de texto al hacer clic en Aprobar o Rechazar
  document.querySelectorAll('.btn-iniciar-val').forEach(btn => {
    btn.addEventListener('click', function () {
      const idCuarteto = this.dataset.id;
      const estadoDestino = this.dataset.est;
      
      // Ocultar todos los demás formularios abiertos por limpieza
      document.querySelectorAll('[id^="val-form-"]').forEach(f => f.style.display = 'none');

      const formContenedor = document.getElementById(`val-form-${idCuarteto}`);
      const labelTipo = document.getElementById(`val-label-tipo-${idCuarteto}`);
      const btnEnviar = formContenedor.querySelector('.btn-enviar-val');

      btnEnviar.dataset.est = estadoDestino;
      labelTipo.textContent = estadoDestino === 'Inscrito' ? 'aprobación' : 'rechazo';
      formContenedor.style.display = 'block';
    });
  });

  // Evento para cancelar la escritura
  document.querySelectorAll('.btn-cancelar-val').forEach(btn => {
    btn.addEventListener('click', function () {
      const idCuarteto = this.dataset.id;
      document.getElementById(`val-form-${idCuarteto}`).style.display = 'none';
    });
  });

  // Evento para enviar el cambio de estado y el motivo a Supabase
  document.querySelectorAll('.btn-enviar-val').forEach(btn => {
    btn.addEventListener('click', async function () {
      const idCuarteto = this.dataset.id;
      const nuevoEstado = this.dataset.est;
      const txtArea = document.getElementById(`val-txt-${idCuarteto}`);
      const observacion = txtArea ? txtArea.value.trim() : '';

      if (!observacion) {
        alert('⚠️ Por favor, escribe un motivo o comentario antes de enviar la validación.');
        return;
      }

      try {
        // Actualizamos estado y la observación en Supabase
        const { error } = await supabase
          .from('cuarteto')
          .update({ 
            estado_inscripcion: nuevoEstado,
            observacion_profesor: observacion 
          })
          .eq('id_cuarteto', idCuarteto);

        if (error) throw error;

        alert(`✅ Cuarteto actualizado a estado: ${nuevoEstado}`);
        await cargarCuartetos();
        await renderProfTab();
      } catch (err) {
        console.error('Error al actualizar en BD:', err);
        alert('Ocurrió un error al intentar guardar la validación en la base de datos.');
      }
    });
  });
}