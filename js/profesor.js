// js/profesor.js
import { requireRol } from './core/session.js';
import { obtenerCuartetosPorProfesorBD, cambiarEstadoInscripcionBD } from './services/profesorService.js';
import { supabase } from '../config/supabase.js';

let profesorSesion = null;
let activeProfTab = 'mis';
let misCuartetos = [];
let integrantesPorCuarteto = {};

// 🔒 BLINDAJE DE SEGURIDAD POR ROL AL CARGAR LA VISTA
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Valida estrictamente que la sesión pertenezca al rol 'profesor'
    profesorSesion = requireRol('profesor');
  } catch (e) {
    console.warn('⚠️ Intento de acceso no autorizado detectado en panel de profesor:', e);
    window.location.replace('login.html');
    return;
  }

  if (!profesorSesion || profesorSesion.rol !== 'profesor') {
    window.location.replace('login.html');
    return;
  }

  const elCred = document.getElementById('profesorCredencial');
  if (elCred) {
    const nombre = profesorSesion.nombre || profesorSesion.nombres || 'Docente Supervisor';
    const correo = profesorSesion.email || profesorSesion.correo_institucional || profesorSesion.correo || '';
    elCred.textContent = nombre + (correo ? ' · ' + correo : '');
  }

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
 * Carga los cuartetos asignados desde Supabase utilizando el ID del profesor en sesión,
 * y consulta de forma complementaria los integrantes de cada cuarteto.
 */
async function cargarCuartetos() {
  const idProfesor = profesorSesion.id_usuario || profesorSesion.id;
  if (idProfesor) {
    misCuartetos = await obtenerCuartetosPorProfesorBD(idProfesor);
  } else {
    misCuartetos = [];
  }

  integrantesPorCuarteto = {};
  for (const c of misCuartetos) {
    try {
      const { data: itData, error } = await supabase
        .from('integrante')
        .select('*')
        .eq('id_cuarteto', c.id_cuarteto);
      
      if (!error && itData) {
        integrantesPorCuarteto[c.id_cuarteto] = itData;
      } else {
        integrantesPorCuarteto[c.id_cuarteto] = [];
      }
    } catch (e) {
      console.warn('No se pudieron cargar integrantes:', e);
      integrantesPorCuarteto[c.id_cuarteto] = [];
    }
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
          <h2>Mis Cuartetos Vinculados</h2>
          <p class="subtitle">Supervisión Académica y Revisión de Integrantes</p>
        </div>
        <span class="badge badge-ok">Rol: Docente Supervisor</span>
      </div>
      ${misCuartetos.length === 0 ? 
        '<div class="alert alert-warn" style="margin-top:16px;"><div>No tienes cuartetos vinculados bajo tu supervisión.</div></div>' :
        misCuartetos.map(c => {
          const estado = c.estado_inscripcion || 'En Borrador';
          const esInscrito = estado === 'Inscrito' || estado === 'Validado';
          const esRechazado = estado === 'Rechazado';
          const listaIntegrantes = integrantesPorCuarteto[c.id_cuarteto] || [];

          return `
            <div class="integrante-card" style="background:#fff; margin-top:16px; border-left:4px solid ${esInscrito ? '#16a34a' : (esRechazado ? '#dc2626' : '#b45309')}; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px;">
                <div>
                  <h4 style="margin:0; font-size:16px;">🎻 ${c.nombre_cuarteto || 'Sin Nombre'} <span class="chip" style="font-size:12px;">#${c.id_cuarteto}</span></h4>
                  <p style="font-size:13px; color:#64748b; margin-top:4px;">
                    Estado de Inscripción: <strong>${estado}</strong>
                  </p>
                </div>
                <span class="badge ${esInscrito ? 'badge-ok' : (esRechazado ? 'badge-danger' : 'badge-draft')}">${estado}</span>
              </div>

              <div style="font-size:13px; color:#64748b; margin-top:10px; background:#f8fafc; padding:10px; border-radius:6px;">
                🎼 <strong>Obra Obligatoria:</strong> ${c.obra_obligatoria || 'No asignada'}<br>
                🎻 <strong>Obra Libre:</strong> ${c.obra_libre_titulo || 'No asignada'} (${c.obra_libre_duracion || '0:00'})
              </div>

              <h5 style="margin:14px 0 6px 0; font-size:13px; color:#0f172a;">👥 Músicos Integrantes (${listaIntegrantes.length}):</h5>
              <div class="table-container" style="margin-bottom:10px;">
                <table class="table" style="font-size:12px; width:100%; border-collapse:collapse;">
                  <thead>
                    <tr style="background:#f1f5f9; text-align:left;">
                      <th style="padding:6px 8px;">Nombre Completo</th>
                      <th style="padding:6px 8px;">Instrumento</th>
                      <th style="padding:6px 8px;">DNI</th>
                      <th style="padding:6px 8px;">Edad</th>
                      <th style="padding:6px 8px;">Correo Institucional</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${listaIntegrantes.length === 0 ? '<tr><td colspan="5" style="padding:8px; text-align:center; color:#64748b;">No hay integrantes registrados.</td></tr>' :
                      listaIntegrantes.map(it => `
                        <tr style="border-bottom:1px solid #f1f5f9;">
                          <td style="padding:6px 8px;"><strong>${it.nombre_completo}</strong></td>
                          <td style="padding:6px 8px;"><span class="badge badge-code" style="font-size:11px;">${it.instrumento || '—'}</span></td>
                          <td style="padding:6px 8px;">${it.dni || '—'}</td>
                          <td style="padding:6px 8px;">${it.edad ? it.edad + ' años' : '—'}</td>
                          <td style="padding:6px 8px;">${it.correo_institucional || '—'}</td>
                        </tr>
                      `).join('')}
                  </tbody>
                </table>
              </div>

              ${c.observacion_profesor ? `
                <div style="margin-top:10px; padding:10px; background:#f8fafc; border-left:3px solid #2563eb; font-size:13px; border-radius:4px;">
                  <strong>💬 Observación registrada:</strong> ${c.observacion_profesor}
                </div>
              ` : ''}
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
          <h2>Validación de Expedientes e Integrantes</h2>
          <p class="subtitle">Revisa los datos de los músicos, repertorio y aprueba o rechaza la inscripción con un motivo oficial.</p>
        </div>
        <span class="badge badge-ok">${misCuartetos.length} cuartetos bajo tu supervisión</span>
      </div>
      ${misCuartetos.length === 0 ? 
        '<div class="alert alert-warn" style="margin-top:16px;"><div>No tienes cuartetos para validar en este momento.</div></div>' :
        misCuartetos.map(c => {
          const estado = c.estado_inscripcion || 'En Borrador';
          const esInscrito = estado === 'Inscrito' || estado === 'Validado';
          const esRechazado = estado === 'Rechazado';
          const listaIntegrantes = integrantesPorCuarteto[c.id_cuarteto] || [];

          return `
            <div class="integrante-card" style="background:#fff; margin-top:16px; border-left:4px solid ${esInscrito ? '#16a34a' : (esRechazado ? '#dc2626' : '#2563eb')}; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px;">
                <div>
                  <h4 style="margin-bottom:4px; font-size:16px;">🎻 ${c.nombre_cuarteto || 'Sin Nombre'} <span class="chip" style="font-size:12px;">#${c.id_cuarteto}</span></h4>
                  <div style="font-size:13px; color:#64748b;">
                    🎼 <strong>Obligatoria:</strong> ${c.obra_obligatoria || 'Sin asignar'} | <strong>Libre:</strong> ${c.obra_libre_titulo || 'Sin asignar'}
                  </div>
                </div>
                <span class="badge ${esInscrito ? 'badge-ok' : (esRechazado ? 'badge-danger' : 'badge-draft')}">${estado}</span>
              </div>

              <h5 style="margin:14px 0 6px 0; font-size:13px; color:#0f172a;">👥 Integrantes Declarados (${listaIntegrantes.length}):</h5>
              <div class="table-container" style="margin-bottom:12px;">
                <table class="table" style="font-size:12px; width:100%; border-collapse:collapse;">
                  <thead>
                    <tr style="background:#f1f5f9; text-align:left;">
                      <th style="padding:6px 8px;">Nombre Completo</th>
                      <th style="padding:6px 8px;">Instrumento</th>
                      <th style="padding:6px 8px;">DNI</th>
                      <th style="padding:6px 8px;">Edad</th>
                      <th style="padding:6px 8px;">Correo Institucional</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${listaIntegrantes.length === 0 ? '<tr><td colspan="5" style="padding:8px; text-align:center; color:#64748b;">No hay integrantes registrados.</td></tr>' :
                      listaIntegrantes.map(it => `
                        <tr style="border-bottom:1px solid #f1f5f9;">
                          <td style="padding:6px 8px;"><strong>${it.nombre_completo}</strong></td>
                          <td style="padding:6px 8px;"><span class="badge badge-code" style="font-size:11px;">${it.instrumento || '—'}</span></td>
                          <td style="padding:6px 8px;">${it.dni || '—'}</td>
                          <td style="padding:6px 8px;">${it.edad ? it.edad + ' años' : '—'}</td>
                          <td style="padding:6px 8px;">${it.correo_institucional || '—'}</td>
                        </tr>
                      `).join('')}
                  </tbody>
                </table>
              </div>

              ${c.observacion_profesor ? `
                <div style="margin-top:10px; padding:10px; background:#f8fafc; border-left:3px solid #2563eb; font-size:13px; border-radius:4px;">
                  <strong>💬 Observación del Docente registrada:</strong> ${c.observacion_profesor}
                </div>
              ` : ''}
              
              <div style="margin-top:14px; display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                <button type="button" class="btn btn-success btn-iniciar-val" data-id="${c.id_cuarteto}" data-est="Inscrito" style="background:#16a34a; color:#fff; padding:6px 12px; border:none; border-radius:4px; font-size:13px; cursor:pointer;">
                  ✓ Aprobar e Inscribir
                </button>
                <button type="button" class="btn btn-warning btn-iniciar-val" data-id="${c.id_cuarteto}" data-est="Observado" style="background:#ca8a04; color:#fff; padding:6px 12px; border:none; border-radius:4px; font-size:13px; cursor:pointer;">
                  ⚠️ Marcar como Observado
                </button>
                <button type="button" class="btn btn-danger btn-iniciar-val" data-id="${c.id_cuarteto}" data-est="Rechazado" style="background:#dc2626; color:#fff; padding:6px 12px; border:none; border-radius:4px; font-size:13px; cursor:pointer;">
                  ✕ Rechazar
                </button>
              </div>

              <div id="val-form-${c.id_cuarteto}" style="display:none; margin-top:12px; background:#fdfdfd; padding:12px; border:1px solid #e2e8f0; border-radius:6px;">
                <label style="font-size:12px; font-weight:700; display:block; margin-bottom:6px;">✍️ Escribe el motivo u observación para el expediente (<span id="val-label-tipo-${c.id_cuarteto}">validación</span>):</label>
                <textarea id="val-txt-${c.id_cuarteto}" rows="2" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:4px; font-size:13px;" placeholder="Ej. Integrantes y repertorio conformes...">${c.observacion_profesor || ''}</textarea>
                <div style="margin-top:8px; display:flex; gap:8px;">
                  <button type="button" class="btn btn-primary btn-enviar-val" data-id="${c.id_cuarteto}" style="padding:6px 12px; font-size:12px; background:#2563eb; color:#fff; border:none; border-radius:4px; cursor:pointer;">Enviar y Actualizar Estado</button>
                  <button type="button" class="btn btn-secondary btn-cancelar-val" data-id="${c.id_cuarteto}" style="padding:6px 12px; font-size:12px; background:#64748b; color:#fff; border:none; border-radius:4px; cursor:pointer;">Cancelar</button>
                </div>
              </div>

            </div>
          `;
        }).join('')}
    </div>
  `;

  document.querySelectorAll('.btn-iniciar-val').forEach(btn => {
    btn.addEventListener('click', function () {
      const idCuarteto = this.dataset.id;
      const estadoDestino = this.dataset.est;
      
      document.querySelectorAll('[id^="val-form-"]').forEach(f => f.style.display = 'none');

      const formContenedor = document.getElementById(`val-form-${idCuarteto}`);
      const labelTipo = document.getElementById(`val-label-tipo-${idCuarteto}`);
      const btnEnviar = formContenedor.querySelector('.btn-enviar-val');

      btnEnviar.dataset.est = estadoDestino;
      labelTipo.textContent = estadoDestino === 'Inscrito' ? 'aprobación' : (estadoDestino === 'Observado' ? 'observación' : 'rechazo');
      formContenedor.style.display = 'block';
    });
  });

  document.querySelectorAll('.btn-cancelar-val').forEach(btn => {
    btn.addEventListener('click', function () {
      const idCuarteto = this.dataset.id;
      document.getElementById(`val-form-${idCuarteto}`).style.display = 'none';
    });
  });

  document.querySelectorAll('.btn-enviar-val').forEach(btn => {
    btn.addEventListener('click', async function () {
      const idCuarteto = this.dataset.id;
      const nuevoEstado = this.dataset.est;
      const txtArea = document.getElementById(`val-txt-${idCuarteto}`);
      const observacion = txtArea ? txtArea.value.trim() : '';

      if ((nuevoEstado === 'Rechazado' || nuevoEstado === 'Observado') && !observacion) {
        alert('⚠️ Por favor, escribe un motivo u observación obligatoria para este estado.');
        return;
      }

      try {
        const { error } = await supabase
          .from('cuarteto')
          .update({ 
            estado_inscripcion: nuevoEstado,
            observacion_profesor: observacion 
          })
          .eq('id_cuarteto', idCuarteto);

        if (error) throw error;

        alert('✅ Cuarteto actualizado exitosamente a estado: ' + nuevoEstado);
        await cargarCuartetos();
        await renderProfTab();
      } catch (err) {
        console.error('Error al actualizar en BD:', err);
        alert('Ocurrió un error al intentar guardar la validación en la base de datos.');
      }
    });
  });
}