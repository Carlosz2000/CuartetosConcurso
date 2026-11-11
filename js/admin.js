/* ============================================================
   ROL ADMINISTRADOR · Panel Integral (S1, S4, S5, S6, S7, BD)
   HU-01 a HU-22 · RF-01 a RF-54
   ============================================================ */

import { requireRol } from './core/session.js';
import { obtenerObrasObligatoriasBD, registrarObraObligatoriaBD, segundosAMmSs } from './services/obraService.js';
import { obtenerDocentesHabilitadosBD } from './services/profesorService.js';
import { supabase } from '../config/supabase.js';

let adminSesion = null;
let activeAdminTab = 's1';
let filtroAuditorioAdminS6 = 'TODOS';

// Función auxiliar única para notificaciones
function notificar(mensaje, tipo = 'ok') {
  if (typeof showToast === 'function') {
    showToast(mensaje, tipo);
  } else if (typeof window.showToast === 'function') {
    window.showToast(mensaje, tipo);
  } else {
    console.log(`[Toast ${tipo}]: ${mensaje}`);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    adminSesion = requireRol('administrador');
  } catch (e) {
    console.warn('Error al verificar sesión:', e);
  }

  if (!adminSesion) return;

  const elCred = document.getElementById('adminCredencial');
  if (elCred) elCred.textContent = `${adminSesion.nombre || adminSesion.nombres || 'Admin'} · ${(adminSesion.rol || 'administrador').toUpperCase()}`;

  // Navegación por tabs
  document.querySelectorAll('[data-admin-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      activeAdminTab = btn.dataset.adminTab;
      document.querySelectorAll('[data-admin-tab]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderAdminTab();
    });
  });

  renderAdminTab();
});

/* ---------- Render principal por tab ---------- */
async function renderAdminTab() {
  const cont = document.getElementById('adminMainContent');
  if (!cont) return;

  switch (activeAdminTab) {
    case 's1': cont.innerHTML = await renderS1(); bindS1(); break;
    case 's4': cont.innerHTML = await renderS4(); bindS4(); break;  
    case 's5': cont.innerHTML = await renderS5(); bindS5(); break;
    case 's6': cont.innerHTML = await renderS6(); bindS6(); break;
    case 's7': cont.innerHTML = await renderS7(); bindS7(); break;
  }
}

/* ============================================================================
   HELPERS DB · ESTADO GLOBAL DE EDICIÓN Y FASES (SUPABASE)
   ============================================================================ */
async function obtenerEstadoConcursoBD() {
  try {
    const { data, error } = await supabase
      .from('edicion_concurso')
      .select('*')
      .eq('id_edicion', 2026)
      .maybeSingle();

    if (error || !data) {
      return {
        id_edicion: 2026,
        fase_eliminatoria_estado: 'En Curso',
        fase_final_estado: 'En Curso',
        cuadro_publicado: false,
        edicion_archivada: false,
        fecha_archivado: null,
        ganadores: null
      };
    }
    return data;
  } catch (err) {
    return {
      id_edicion: 2026,
      fase_eliminatoria_estado: 'En Curso',
      fase_final_estado: 'En Curso',
      cuadro_publicado: false,
      edicion_archivada: false,
      fecha_archivado: null,
      ganadores: null
    };
  }
}

async function guardarEstadoConcursoBD(cambios) {
  const { error } = await supabase
    .from('edicion_concurso')
    .upsert([{ id_edicion: 2026, ...cambios }]);
  if (error) console.error('Error al guardar estado de concurso en Supabase:', error.message);
}

/* ============================================================================
   S1 · CATÁLOGO DE OBRAS (HU-01) - SUPABASE
   ============================================================================ */
async function renderS1() {
  const estadoConcurso = await obtenerEstadoConcursoBD();
  const bloqueado = estadoConcurso.edicion_archivada;
  const obras = await obtenerObrasObligatoriasBD();

  return `
    <div class="card">
      <div class="ficha-header">
        <div>
          <h2>🎼 Subsistema 1 · Catálogo de Obras Obligatorias</h2>
          <p class="subtitle">HU-01 · HU-02 · RF-01 a RF-04 · RNF-01 (orden alfabético)</p>
        </div>
        <span class="badge badge-ok">${obras.length} obras activas</span>
      </div>

      <div class="grid-2" style="margin-top:16px; align-items:start;">
        <div class="integrante-card" style="background:#fff;">
          <h4>➕ Registrar Obra Obligatoria</h4>
          <form id="formS1Obra">
            <div class="form-row">
              <label>Título de la Obra <span class="req">*</span></label>
              <input type="text" id="s1Titulo" placeholder="Ej: Cuarteto en Fa Mayor" ${bloqueado ? 'disabled' : ''}>
            </div>
            <div class="form-row">
              <label>Compositor <span class="req">*</span> (CA3)</label>
              <input type="text" id="s1Compositor" placeholder="Ej: Maurice Ravel" ${bloqueado ? 'disabled' : ''}>
            </div>
            <div class="form-row">
              <label>Duración Estimada (mm:ss)</label>
              <input type="text" id="s1Duracion" placeholder="Ej: 5:15" value="5:15" ${bloqueado ? 'disabled' : ''}>
            </div>
            <div id="s1Feedback" style="margin-bottom:12px;"></div>
            <button type="submit" class="btn btn-primary" ${bloqueado ? 'disabled' : ''}>
              💾 Guardar en Catálogo
            </button>
          </form>
        </div>

        <div>
          <h4 style="font-size:15px; margin-bottom:10px;">📚 Catálogo Institucional (A–Z)</h4>
          <div class="table-container">
            <table class="table">
              <thead><tr><th>Título</th><th>Compositor</th><th>Duración</th><th>Estado</th></tr></thead>
              <tbody>
                ${obras.length === 0 ? '<tr><td colspan="4" style="text-align:center;">No hay obras obligatorias registradas.</td></tr>' : 
                  obras.map(o => {
                    const durSegundos = o.duracion ?? o.duracion_estimada ?? o.duracion_estimada_segundos ?? 0;
                    return `
                      <tr>
                        <td><strong>${o.titulo}</strong></td>
                        <td>${o.compositor || '—'}</td>
                        <td><span class="badge badge-code">${segundosAMmSs(durSegundos)} min</span></td>
                        <td><span class="badge badge-ok">Activa</span></td>
                      </tr>
                    `;
                  }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

function bindS1() {
  const form = document.getElementById('formS1Obra');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const titulo = document.getElementById('s1Titulo').value;
    const compositor = document.getElementById('s1Compositor').value;
    const duracion = document.getElementById('s1Duracion').value;
    const fb = document.getElementById('s1Feedback');

    try {
      await registrarObraObligatoriaBD(titulo, compositor, duracion);
      notificar(`✅ Obra "${titulo}" agregada al catálogo.`, 'ok');
      await renderAdminTab();
    } catch (err) {
      fb.innerHTML = `<div class="alert alert-danger"><div>⚠️ ${err.message}</div></div>`;
    }
  });
}

/* ============================================================================
   S4 · PROGRAMACIÓN Y REPROGRAMACIÓN DE AUDITORIOS (HU-11, HU-13) - SUPABASE
   ============================================================================ */
async function renderS4() {
  const estadoConcurso = await obtenerEstadoConcursoBD();
  const bloqueado = estadoConcurso.edicion_archivada;

  const { data: cuartetosInscritos } = await supabase
    .from('cuarteto')
    .select('*')
    .eq('estado_inscripcion', 'Inscrito');

  const lista = cuartetosInscritos || [];

  return `
    <div class="card">
      <div class="ficha-header">
        <div>
          <h2>📅 Subsistema 4 · Programación y Reprogramación de Turnos</h2>
          <p class="subtitle">HU-11 · HU-13 · RF-29 a RF-34 · Asignación de Sede, Auditorio, Fecha y Hora sin cruces</p>
        </div>
        <span class="badge badge-ok">${lista.length} Cuartetos Aptos</span>
      </div>

      <div id="s4Feedback" style="margin-top:10px;"></div>

      <div class="table-container" style="margin-top:16px;">
        <table class="table">
          <thead>
            <tr>
              <th>Cuarteto</th>
              <th>Sede</th>
              <th>Auditorio</th>
              <th>Fecha</th>
              <th>Hora Inicio</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            ${lista.length === 0 ? `
              <tr><td colspan="6" style="text-align:center;">No hay cuartetos en estado 'Inscrito' listos para programar.</td></tr>
            ` : lista.map(c => `
              <tr>
                <td><strong>${c.nombre_cuarteto}</strong><br><small>${c.codigo_cuarteto || ('#' + c.id_cuarteto)}</small></td>
                <td>
                  <input type="text" id="sede_${c.id_cuarteto}" value="${c.sede || 'Sede Central'}" style="width:110px; padding:4px;" ${bloqueado ? 'disabled' : ''}>
                </td>
                <td>
                  <select id="auditorio_${c.id_cuarteto}" style="padding:4px;" ${bloqueado ? 'disabled' : ''}>
                    <option value="Auditorio Principal" ${c.auditorio === 'Auditorio Principal' ? 'selected' : ''}>Auditorio Principal</option>
                    <option value="Auditorio B — Sala Beethoven" ${c.auditorio === 'Auditorio B — Sala Beethoven' ? 'selected' : ''}>Auditorio B</option>
                    <option value="Auditorio C — Sala Mozart" ${c.auditorio === 'Auditorio C — Sala Mozart' ? 'selected' : ''}>Auditorio C</option>
                  </select>
                </td>
                <td>
                  <input type="date" id="fecha_${c.id_cuarteto}" value="${c.fecha_presentacion || '2026-11-20'}" style="padding:4px;" ${bloqueado ? 'disabled' : ''}>
                </td>
                <td>
                  <input type="time" id="hora_${c.id_cuarteto}" value="${c.hora_presentacion || '10:00'}" style="padding:4px;" ${bloqueado ? 'disabled' : ''}>
                </td>
                <td>
                  <button type="button" class="btn btn-primary btn-guardar-turno" data-id="${c.id_cuarteto}" style="padding:4px 8px; font-size:12px;" ${bloqueado ? 'disabled' : ''}>
                    💾 Programar Turno
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function bindS4() {
  document.querySelectorAll('.btn-guardar-turno').forEach(btn => {
    btn.addEventListener('click', async function () {
      const idCuarteto = this.dataset.id;
      const sede = document.getElementById(`sede_${idCuarteto}`).value;
      const auditorio = document.getElementById(`auditorio_${idCuarteto}`).value;
      const fecha = document.getElementById(`fecha_${idCuarteto}`).value;
      const hora = document.getElementById(`hora_${idCuarteto}`).value;
      const fb = document.getElementById('s4Feedback');

      const { data: conflicto } = await supabase
        .from('cuarteto')
        .select('id_cuarteto, nombre_cuarteto')
        .eq('auditorio', auditorio)
        .eq('fecha_presentacion', fecha)
        .eq('hora_presentacion', hora)
        .neq('id_cuarteto', idCuarteto)
        .maybeSingle();

      if (conflicto) {
        fb.innerHTML = `<div class="alert alert-danger"><div><strong>🚫 Conflicto de Horario (HU-11 / RF-30):</strong> El <b>${auditorio}</b> ya está ocupado el ${fecha} a las ${hora} por el cuarteto "${conflicto.nombre_cuarteto}".</div></div>`;
        return;
      }

      const { error } = await supabase
        .from('cuarteto')
        .update({
          sede: sede,
          auditorio: auditorio,
          fecha_presentacion: fecha,
          hora_presentacion: hora,
          estado_presentacion: 'Programado'
        })
        .eq('id_cuarteto', idCuarteto);

      if (error) {
        fb.innerHTML = `<div class="alert alert-danger"><div>Error al guardar turno en Supabase: ${error.message}</div></div>`;
      } else {
        const { data: datosCuarteto } = await supabase
          .from('cuarteto')
          .select('nombre_cuarteto, usuario!id_profesor_responsable(correo_institucional, nombres, apellidos)')
          .eq('id_cuarteto', idCuarteto)
          .single();

        const correoDocente = datosCuarteto?.usuario?.correo_institucional || 'docente@conservatorio.edu.pe';

        if (typeof registrarCorreoSimulado === 'function') {
          registrarCorreoSimulado(
            `${correoDocente}, representante@conservatorio.edu.pe`,
            `Citación Oficial Concurso: ${datosCuarteto?.nombre_cuarteto || ('Cuarteto #' + idCuarteto)}`,
            `Se ha programado/reprogramado su turno para el ${fecha} a las ${hora} hrs en el ${auditorio} (${sede}).`,
            'RF-31 / RF-34'
          );
        }

        fb.innerHTML = `<div class="alert alert-success"><div>✅ Turno guardado en Supabase y citación oficial emitida por correo al docente y representante (RF-31/34).</div></div>`;
        notificar(`📅 Turno actualizado para el cuarteto #${idCuarteto}`, 'ok');
        await renderAdminTab();
      }
    });
  });
}

/* ============================================================================
   S5 · GESTIÓN DE JURADOS Y ASIGNACIÓN INCOMPATIBLE (HU-14, HU-15) - SUPABASE
   ============================================================================ */
async function renderS5() {
  const estadoConcurso = await obtenerEstadoConcursoBD();
  const bloqueado = estadoConcurso.edicion_archivada;

  // Consulta jurados activos en Supabase (id_rol = 7)
  const { data: juradosBD, error } = await supabase
    .from('usuario')
    .select('*')
    .eq('id_rol', 7);

  if (error) {
    console.error('⚠️ Error al consultar jurados en Supabase:', error.message);
  }

  const listaJurados = juradosBD || [];

  return `
    <div class="card">
      <div class="ficha-header">
        <div>
          <h2>👨‍⚖️ Subsistema 5 · Gestión de Jurados y Control de Incompatibilidad</h2>
          <p class="subtitle">HU-14 · HU-15 · RF-35 a RF-38</p>
        </div>
        <span class="badge badge-ok">${listaJurados.length} Jurados Registrados</span>
      </div>

      <div class="grid-2" style="margin-top:20px; align-items:start; gap:20px;">
        <div class="integrante-card" style="background:#fff; padding:20px; border-radius:12px; border:1px solid #e2e8f0;">
          <h4>🔐 HU-14 · Crear Cuenta de Jurado</h4>
          <form id="formCrearJurado">
            <div class="form-row" style="margin-bottom:12px;">
              <label style="display:block; font-weight:600; margin-bottom:4px;">Nombre Completo <span class="req">*</span></label>
              <input type="text" id="s5Nombre" placeholder="Ej: Dra. Beatriz Morales" style="width:100%; padding:8px 12px; border-radius:6px; border:1px solid #cbd5e1;" ${bloqueado ? 'disabled' : ''}>
            </div>
            <div class="grid-2" style="gap:12px;">
              <div class="form-row" style="margin-bottom:12px;">
                <label style="display:block; font-weight:600; margin-bottom:4px;">DNI (8 dígitos) <span class="req">*</span></label>
                <input type="text" id="s5Dni" maxlength="8" placeholder="Ej: 45678912" style="width:100%; padding:8px 12px; border-radius:6px; border:1px solid #cbd5e1;" ${bloqueado ? 'disabled' : ''}>
              </div>
              <div class="form-row" style="margin-bottom:12px;">
                <label style="display:block; font-weight:600; margin-bottom:4px;">Especialidad Musical <span class="req">*</span></label>
                <input type="text" id="s5Especialidad" placeholder="Ej: Violín y Música de Cámara" style="width:100%; padding:8px 12px; border-radius:6px; border:1px solid #cbd5e1;" ${bloqueado ? 'disabled' : ''}>
              </div>
            </div>
            <div class="form-row" style="margin-bottom:16px;">
              <label style="display:block; font-weight:600; margin-bottom:4px;">Correo Institucional <span class="req">*</span></label>
              <input type="email" id="s5Correo" placeholder="Ej: bmorales@conservatorio.edu.pe" style="width:100%; padding:8px 12px; border-radius:6px; border:1px solid #cbd5e1;" ${bloqueado ? 'disabled' : ''}>
            </div>
            <div id="s5FeedbackJurado" style="margin-bottom:10px;"></div>
            <button type="submit" class="btn btn-primary" style="width:100%; padding:10px;" ${bloqueado ? 'disabled' : ''}>
              ✉️ Crear Cuenta y Enviar Credenciales
            </button>
          </form>
        </div>

        <div class="integrante-card" style="background:#fff; padding:20px; border-radius:12px; border:1px solid #e2e8f0;">
          <h4>⚖️ HU-15 · Asignar Terna de 3 Jurados por Auditorio</h4>
          <p style="font-size:12px; color:#64748b; margin-bottom:14px;">
            Valida que ningún jurado sea Profesor Responsable de un cuarteto en ese auditorio.
          </p>
          <form id="formAsignarTerna">
            <div class="form-row" style="margin-bottom:10px;">
              <label style="display:block; font-weight:600; margin-bottom:4px;">Auditorio <span class="req">*</span></label>
              <select id="s5Auditorio" style="width:100%; padding:8px 12px; border-radius:6px; border:1px solid #cbd5e1;" ${bloqueado ? 'disabled' : ''}>
                <option value="Auditorio Principal">Auditorio Principal</option>
                <option value="Auditorio B — Sala Beethoven">Auditorio B — Sala Beethoven</option>
                <option value="Auditorio C — Sala Mozart">Auditorio C — Sala Mozart</option>
              </select>
            </div>
            <div class="form-row" style="margin-bottom:10px;">
              <label style="display:block; font-weight:600; margin-bottom:4px;">Jurado A <span class="req">*</span></label>
              <select id="s5JuradoA" style="width:100%; padding:8px 12px; border-radius:6px; border:1px solid #cbd5e1;" ${bloqueado ? 'disabled' : ''}>
                ${listaJurados.length === 0 ? '<option value="">-- No hay jurados registrados --</option>' : listaJurados.map(j => {
                  const nombre = `${j.nombres || ''} ${j.apellidos || ''}`.trim() || j.nombre;
                  return `<option value="${nombre}">${nombre}</option>`;
                }).join('')}
              </select>
            </div>
            <div class="form-row" style="margin-bottom:10px;">
              <label style="display:block; font-weight:600; margin-bottom:4px;">Jurado B <span class="req">*</span></label>
              <select id="s5JuradoB" style="width:100%; padding:8px 12px; border-radius:6px; border:1px solid #cbd5e1;" ${bloqueado ? 'disabled' : ''}>
                ${listaJurados.length === 0 ? '<option value="">-- No hay jurados registrados --</option>' : listaJurados.map(j => {
                  const nombre = `${j.nombres || ''} ${j.apellidos || ''}`.trim() || j.nombre;
                  return `<option value="${nombre}">${nombre}</option>`;
                }).join('')}
              </select>
            </div>
            <div class="form-row" style="margin-bottom:14px;">
              <label style="display:block; font-weight:600; margin-bottom:4px;">Jurado C <span class="req">*</span></label>
              <select id="s5JuradoC" style="width:100%; padding:8px 12px; border-radius:6px; border:1px solid #cbd5e1;" ${bloqueado ? 'disabled' : ''}>
                ${listaJurados.length === 0 ? '<option value="">-- No hay jurados registrados --</option>' : listaJurados.map(j => {
                  const nombre = `${j.nombres || ''} ${j.apellidos || ''}`.trim() || j.nombre;
                  return `<option value="${nombre}">${nombre}</option>`;
                }).join('')}
              </select>
            </div>
            <div id="s5FeedbackTerna" style="margin-bottom:10px;"></div>
            <div style="display:flex; gap:10px;">
              <button type="submit" class="btn btn-primary" style="flex:1; padding:9px;" ${bloqueado ? 'disabled' : ''}>
                ✓ Validar Terna
              </button>
              <button type="button" class="btn btn-secondary" id="btnSimularConflicto" style="color:#ef4444; border:1px solid #fca5a5; padding:9px;">
                ⚠️ Simular Conflicto
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- TABLA MEJORADA CON SEPARACIÓN AMPLIA Y FORMATO LIMPIO -->
      <h4 style="margin-top:28px; margin-bottom:14px; font-size:16px;">📋 Nómina de Jurados Registrados (Supabase)</h4>
      <div style="background:#fff; border-radius:10px; border:1px solid #e2e8f0; overflow:hidden;">
        <table style="width:100%; border-collapse:collapse; text-align:left; font-size:13px;">
          <thead>
            <tr style="background:#f8fafc; border-bottom:1px solid #e2e8f0; color:#475569; font-weight:700;">
              <th style="padding:14px 18px; width:25%;">Jurado</th>
              <th style="padding:14px 18px; width:15%;">DNI</th>
              <th style="padding:14px 18px; width:30%;">Correo Institucional</th>
              <th style="padding:14px 18px; width:20%;">Especialidad</th>
              <th style="padding:14px 18px; width:10%; text-align:center;">Estado</th>
            </tr>
          </thead>
          <tbody>
            ${listaJurados.length === 0 ? `
              <tr>
                <td colspan="5" style="text-align:center; padding:24px; color:#64748b;">
                  No hay jurados registrados en Supabase (id_rol = 7). Registre uno desde el formulario superior.
                </td>
              </tr>
            ` : listaJurados.map(j => {
              const nombre = `${j.nombres || ''} ${j.apellidos || ''}`.trim() || j.nombre || 'Sin Nombre';
              const correo = j.correo_institucional || j.correo || '—';
              return `
                <tr style="border-bottom:1px solid #f1f5f9; transition:background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='#fff'">
                  <td style="padding:14px 18px; font-weight:600; color:#0f172a;">${nombre}</td>
                  <td style="padding:14px 18px;">
                    <code style="background:#f1f5f9; color:#334155; padding:3px 8px; border-radius:4px; font-family:monospace;">${j.dni || '—'}</code>
                  </td>
                  <td style="padding:14px 18px; color:#334155;">${correo}</td>
                  <td style="padding:14px 18px; color:#475569;">${j.especialidad || 'Música de Cámara'}</td>
                  <td style="padding:14px 18px; text-align:center;">
                    <span style="background:#dcfce7; color:#15803d; padding:4px 10px; border-radius:12px; font-size:11px; font-weight:700; display:inline-block;">
                      ${j.estado ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function bindS5() {
  const formCrear = document.getElementById('formCrearJurado');
  if (formCrear) {
    formCrear.addEventListener('submit', async e => {
      e.preventDefault();
      const nombre = document.getElementById('s5Nombre').value.trim();
      const dni = document.getElementById('s5Dni').value.trim();
      const esp = document.getElementById('s5Especialidad').value.trim();
      const correo = document.getElementById('s5Correo').value.trim();
      const fb = document.getElementById('s5FeedbackJurado');

      if (!nombre || !dni || !esp || !correo) {
        fb.innerHTML = '<div class="alert alert-danger"><div><strong>[!] RF-35:</strong> Complete todos los campos.</div></div>';
        return;
      }

      const { data: existeCorreo } = await supabase
        .from('usuario')
        .select('id_usuario')
        .eq('correo_institucional', correo)
        .maybeSingle();

      if (existeCorreo) {
        fb.innerHTML = '<div class="alert alert-danger"><div><strong>[!] HU-14 Escenario 2:</strong> Correo ya registrado en Supabase.</div></div>';
        return;
      }

      // Registro en Supabase asignando id_rol = 7
      const { error } = await supabase
        .from('usuario')
        .insert([{
          nombres: nombre,
          apellidos: '',
          dni: dni,
          especialidad: esp,
          correo_institucional: correo,
          id_rol: 7,
          estado: true
        }]);

      if (error) {
        fb.innerHTML = `<div class="alert alert-danger"><div>Error al crear jurado en Supabase: ${error.message}</div></div>`;
        return;
      }

      if (typeof registrarCorreoSimulado === 'function') {
        registrarCorreoSimulado(
          correo,
          'Bienvenido al Módulo de Evaluación - Credenciales Jurado',
          `Usuario: ${correo} | Acceso activado`,
          'RF-36'
        );
      }

      notificar(`✅ Cuenta de jurado (id_rol 7) guardada en Supabase para ${nombre}.`, 'ok');
      await renderAdminTab();
    });
  }

const formTerna = document.getElementById('formAsignarTerna');
  if (formTerna) {
    formTerna.addEventListener('submit', async e => {
      e.preventDefault();
      const aud = document.getElementById('s5Auditorio').value;
      const jA = document.getElementById('s5JuradoA').value;
      const jB = document.getElementById('s5JuradoB').value;
      const jC = document.getElementById('s5JuradoC').value;
      const fb = document.getElementById('s5FeedbackTerna');

      const setJurados = new Set([jA, jB, jC]);
      if (setJurados.size < 3) {
        fb.innerHTML = '<div class="alert alert-danger"><div><strong>[!] RF-37:</strong> Debe seleccionar 3 jurados distintos.</div></div>';
        return;
      }

      const { data: cuartetosEnAuditorio } = await supabase
        .from('cuarteto')
        .select('nombre_cuarteto, id_profesor_responsable, usuario!id_profesor_responsable(nombres, apellidos)')
        .eq('auditorio', aud);

      if (cuartetosEnAuditorio && cuartetosEnAuditorio.length > 0) {
        for (const c of cuartetosEnAuditorio) {
          if (c.usuario) {
            const nombreProfesor = `${c.usuario.nombres || ''} ${c.usuario.apellidos || ''}`.trim();
            if (setJurados.has(nombreProfesor)) {
              fb.innerHTML = `<div class="alert alert-danger"><div><strong>🚫 Bloqueo por Conflicto Académico (HU-15 · RF-38):</strong> <b>${nombreProfesor}</b> es Profesor Responsable del cuarteto "${c.nombre_cuarteto}" asignado al ${aud}.</div></div>`;
              return;
            }
          }
        }
      }

      // PERSISTIR TERNA PARA QUE CRONOGRAMA (S4) LA LEA
      const ternasExistentes = JSON.parse(localStorage.getItem('concurso_ternas_auditorio') || '{}');
      ternasExistentes[aud] = [jA, jB, jC];
      localStorage.setItem('concurso_ternas_auditorio', JSON.stringify(ternasExistentes));

      fb.innerHTML = `<div class="alert alert-success"><div><strong>✅ Terna Aprobada (HU-15):</strong> ${jA}, ${jB} y ${jC} asignados correctamente al <b>${aud}</b> sin incompatibilidades.</div></div>`;
      notificar(`✅ Terna de 3 jurados validada para ${aud}`, 'ok');
    });
  }

  const btnConflicto = document.getElementById('btnSimularConflicto');
  if (btnConflicto) {
    btnConflicto.addEventListener('click', () => {
      document.getElementById('s5Auditorio').value = 'Auditorio C — Sala Mozart';
      const fb = document.getElementById('s5FeedbackTerna');
      fb.innerHTML = `<div class="alert alert-danger"><div><strong>🚫 Bloqueo por Conflicto (HU-15 · RF-38):</strong> El docente asignado es Profesor Responsable de un cuarteto activo en este auditorio.</div></div>`;
    });
  }
}

/* ============================================================================
   S6 · SUPERVISIÓN DE EVALUACIONES Y DESCALIFICACIÓN (HU-18) - 100% SUPABASE
   ============================================================================ */
async function renderS6() {
  const estadoConcurso = await obtenerEstadoConcursoBD();
  const bloqueado = estadoConcurso.edicion_archivada || estadoConcurso.fase_eliminatoria_estado === 'Concluida';

  // 1. Obtener cuartetos inscritos directamente de Supabase
  const { data: cuartetosBD, error: errCuartetos } = await supabase
    .from('cuarteto')
    .select('*')
    .eq('estado_inscripcion', 'Inscrito');

  if (errCuartetos) {
    console.error('⚠️ Error al consultar cuartetos en S6:', errCuartetos.message);
  }

  // 2. Obtener evaluaciones registradas defensivamente
  let listaEvaluaciones = [];
  try {
    const { data: evaluacionesBD } = await supabase
      .from('evaluacion')
      .select('*');
    if (evaluacionesBD) listaEvaluaciones = evaluacionesBD;
  } catch (err) {
    console.warn('⚠️ No se pudo leer la tabla evaluacion:', err);
  }

  // 3. Obtener ternas asignadas desde S5
  const ternasGuardadas = JSON.parse(localStorage.getItem('concurso_ternas_auditorio') || '{}');

  const listaCuartetos = cuartetosBD || [];

  const evaluacionesMapeadas = listaCuartetos.map(c => {
    const evs = listaEvaluaciones.filter(e => e.id_cuarteto === c.id_cuarteto || e.codigo_cuarteto === c.codigo_cuarteto);
    
    // Recuperar la terna configurada para el auditorio del cuarteto
    const ternaAuditorio = ternasGuardadas[c.auditorio] || ['Jurado A', 'Jurado B', 'Jurado C'];

    const getNota = (letra, index) => {
      const e = evs.find(x => x.etiqueta_jurado === letra);
      
      // Si ya hay nota en BD usa el nombre guardado, sino muestra el jurado asignado en S5
      const nombreJuradoAsignado = ternaAuditorio[index] || `Jurado ${letra}`;
      
      if (!e) {
        return { 
          jurado: nombreJuradoAsignado, 
          valor: null, 
          inmutable: false, 
          fecha: '' 
        };
      }
      return { 
        jurado: e.nombre_jurado || nombreJuradoAsignado, 
        valor: e.nota, 
        inmutable: !!e.inmutable, 
        fecha: e.fecha_evaluacion || '' 
      };
    };

    return {
      idCuarteto: c.id_cuarteto,
      codigoCuarteto: c.codigo_cuarteto || (`CQ-2026-${c.id_cuarteto}`),
      nombreCuarteto: c.nombre_cuarteto,
      auditorio: c.auditorio || 'Sin Asignar',
      fecha: c.fecha_presentacion || '—',
      hora: c.hora_presentacion || '—',
      estadoPresentacion: c.estado_presentacion || 'Pendiente',
      motivoDescalificacion: c.motivo_descalificacion || '',
      notas: {
        A: getNota('A', 0),
        B: getNota('B', 1),
        C: getNota('C', 2)
      }
    };
  });

  const listaFiltrada = filtroAuditorioAdminS6 === 'TODOS'
    ? evaluacionesMapeadas
    : evaluacionesMapeadas.filter(ev => ev.auditorio === filtroAuditorioAdminS6 || (filtroAuditorioAdminS6 === 'Auditorio B — Sala Beethoven' && ev.auditorio.includes('Auditorio B')));

  return `
    <div class="card">
      <div class="ficha-header">
        <div>
          <h2>⚖️ Subsistema 6 · Supervisión de Sesiones y Descalificación</h2>
          <p class="subtitle">HU-18 · RF-43 a RF-45 · Descalificación por inasistencia o incumplimiento</p>
        </div>
        <span class="badge ${bloqueado ? 'badge-rej' : 'badge-ok'}">
          ${bloqueado ? '🔒 Acta Cerrada' : '🟢 Sesión Abierta'}
        </span>
      </div>

      <div style="background:#f8fafc; padding:14px 18px; border-radius:10px; border:1px solid var(--border); display:flex; gap:16px; align-items:center; flex-wrap:wrap; margin-bottom:18px;">
        <div>
          <label style="font-size:12px; font-weight:700; display:block; margin-bottom:4px;">🏛️ Filtrar por Auditorio:</label>
          <select id="s6FiltroAuditorio" style="padding:8px 12px; border-radius:8px; border:1px solid var(--border);">
            <option value="TODOS" ${filtroAuditorioAdminS6 === 'TODOS' ? 'selected' : ''}>Todos los Auditorios</option>
            <option value="Auditorio Principal" ${filtroAuditorioAdminS6 === 'Auditorio Principal' ? 'selected' : ''}>Auditorio Principal</option>
            <option value="Auditorio B — Sala Beethoven" ${filtroAuditorioAdminS6 === 'Auditorio B — Sala Beethoven' ? 'selected' : ''}>Auditorio B — Sala Beethoven</option>
            <option value="Auditorio C — Sala Mozart" ${filtroAuditorioAdminS6 === 'Auditorio C — Sala Mozart' ? 'selected' : ''}>Auditorio C — Sala Mozart</option>
          </select>
        </div>
      </div>

      <div id="s6FeedbackGlobal" style="margin-bottom:14px;"></div>

      ${listaFiltrada.length === 0 ? `
        <div style="text-align:center; padding:30px; color:var(--muted);">No hay presentaciones o cuartetos programados en este auditorio.</div>
      ` : listaFiltrada.map(ev => {
        const esDescalificado = ev.estadoPresentacion === 'Descalificado';
        const notaA = ev.notas.A;
        const notaB = ev.notas.B;
        const notaC = ev.notas.C;
        const todasCalificadas = !esDescalificado && notaA.inmutable && notaB.inmutable && notaC.inmutable;

        return `
          <div class="integrante-card" style="background:#fff; margin-bottom:16px; border-left:4px solid ${esDescalificado ? 'var(--danger)' : (todasCalificadas ? 'var(--success)' : 'var(--primary)')}; border-radius:8px; padding:16px; border:1px solid #e2e8f0;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px;">
              <div>
                <h4 style="font-size:16px; margin-bottom:4px;">${ev.nombreCuarteto} <span class="chip" style="background:#f1f5f9; padding:2px 8px; border-radius:4px; font-size:12px;">${ev.codigoCuarteto}</span></h4>
                <div style="font-size:13px; color:var(--muted);">
                  🏛️ <strong>${ev.auditorio}</strong> · 📅 ${ev.fecha} (${ev.hora})
                </div>
              </div>
              <span class="badge ${esDescalificado ? 'badge-rej' : (todasCalificadas ? 'badge-ok' : 'badge-obs')}">
                ${esDescalificado ? '🚫 Descalificado' : (todasCalificadas ? '✅ Evaluado' : '⏳ Pendiente')}
              </span>
            </div>

            ${esDescalificado ? `
              <div class="alert alert-danger" style="margin-top:12px; margin-bottom:0;">
                <div><strong>🚫 Descalificado (HU-18 · RF-43/44):</strong> Causa: <b>${ev.motivoDescalificacion || 'Sin especificar'}</b>. Excluido del ranking.</div>
              </div>
            ` : `
              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:12px; margin-top:14px;">
                ${['A', 'B', 'C'].map(letra => {
                  const n = ev.notas[letra];
                  return `
                    <div style="background:#f8fafc; padding:12px; border-radius:8px; border:1px solid ${n.inmutable ? '#86efac' : 'var(--primary)'};">
                      <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:700;">
                        <span>👨‍⚖️ Jurado ${letra} (${n.jurado})</span>
                        <span style="color:${n.inmutable ? 'var(--success)' : 'var(--warn)'};">${n.inmutable ? '🔒 Inmutable' : '✏️ Abierto'}</span>
                      </div>
                      ${n.inmutable ? `
                        <div style="font-size:22px; font-weight:800; color:var(--ink); margin-top:6px;">
                          ${Number(n.valor).toFixed(2)} <small style="font-size:11px; color:var(--muted);">/ 10.00</small>
                        </div>
                        <div style="font-size:11px; color:var(--muted);">Firmado: ${n.fecha || '—'}</div>
                      ` : `
                        <div style="font-size:13px; color:var(--muted); margin-top:6px;">Pendiente (reservado para el jurado)</div>
                      `}
                    </div>
                  `;
                }).join('')}
              </div>

              <div style="margin-top:12px; padding-top:10px; border-top:1px dashed var(--border); display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                <input type="text" id="motivoDesc_${ev.idCuarteto}" placeholder="Causa oficial de descalificación (ej: Inasistencia al turno)..." style="flex:1; min-width:240px; padding:6px 10px; border:1px solid var(--border); border-radius:6px; font-size:12px;" ${bloqueado ? 'disabled' : ''}>
                <button type="button" class="btn btn-danger btn-descalificar" data-id="${ev.idCuarteto}" data-nombre="${ev.nombreCuarteto}" ${bloqueado ? 'disabled' : ''}>
                  🚫 Descalificar Cuarteto (HU-18)
                </button>
              </div>
            `}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function bindS6() {
  const selAud = document.getElementById('s6FiltroAuditorio');
  if (selAud) {
    selAud.addEventListener('change', function () {
      filtroAuditorioAdminS6 = this.value;
      renderAdminTab();
    });
  }

  document.querySelectorAll('.btn-descalificar').forEach(btn => {
    btn.addEventListener('click', async function () {
      const idCuarteto = this.dataset.id;
      const nombreCuarteto = this.dataset.nombre;
      const inpMotivo = document.getElementById(`motivoDesc_${idCuarteto}`);
      const motivo = inpMotivo ? inpMotivo.value.trim() : '';
      const fb = document.getElementById('s6FeedbackGlobal');

      if (!motivo) {
        fb.innerHTML = '<div class="alert alert-danger"><div><strong>[!] CA1 / RF-43:</strong> Ingrese la causa oficial (ej: "Inasistencia al turno").</div></div>';
        if (inpMotivo) inpMotivo.focus();
        return;
      }

      if (!confirm(`¿Confirmar DESCALIFICACIÓN de ${nombreCuarteto}? Esta acción es irreversible y liberará su turno en el cronograma (RNF-26).`)) return;

      // UPDATE EN SUPABASE: Cambia estado a Descalificado y LIBERA auditorio/horario
      const { error } = await supabase
        .from('cuarteto')
        .update({
          estado_presentacion: 'Descalificado',
          motivo_descalificacion: motivo,
          auditorio: null,
          sede: null,
          fecha_presentacion: null,
          hora_presentacion: null
        })
        .eq('id_cuarteto', idCuarteto);

      if (error) {
        fb.innerHTML = `<div class="alert alert-danger"><div>Error al descalificar en Supabase: ${error.message}</div></div>`;
        return;
      }

      if (typeof registrarCorreoSimulado === 'function') {
        registrarCorreoSimulado(
          'representante@cons.pe, docente@cons.pe',
          `Notificación Formal de Descalificación - ${nombreCuarteto}`,
          `El cuarteto ${nombreCuarteto} ha sido descalificado. Causa: ${motivo}.`,
          'RF-45'
        );
      }

      notificar(`🚫 ${nombreCuarteto} descalificado (${motivo}). Turno liberado (HU-18).`, 'ok');
      await renderAdminTab();
    });
  });
}

/* ============================================================================
   S7 · RANKING, CLASIFICACIÓN, PUBLICACIÓN Y CIERRE (HU-19 a HU-22) - 100% SUPABASE
   ============================================================================ */
async function calcularRankingOrdenadoBD() {
  const { data: cuartetosBD } = await supabase
    .from('cuarteto')
    .select(`
      id_cuarteto,
      nombre_cuarteto,
      codigo_cuarteto,
      auditorio,
      estado_presentacion,
      motivo_descalificacion,
      evaluacion (
        etiqueta_jurado,
        nota,
        inmutable
      )
    `)
    .eq('estado_inscripcion', 'Inscrito');

  const lista = cuartetosBD || [];
  const activos = lista.filter(c => c.estado_presentacion !== 'Descalificado');
  const descalificados = lista.filter(c => c.estado_presentacion === 'Descalificado');

  const filas = activos.map(c => {
    const evs = c.evaluacion || [];
    const evA = evs.find(e => e.etiqueta_jurado === 'A' && e.inmutable);
    const evB = evs.find(e => e.etiqueta_jurado === 'B' && e.inmutable);
    const evC = evs.find(e => e.etiqueta_jurado === 'C' && e.inmutable);

    const notaA = evA ? Number(evA.nota) : null;
    const notaB = evB ? Number(evB.nota) : null;
    const notaC = evC ? Number(evC.nota) : null;

    const completo = (notaA !== null && notaB !== null && notaC !== null);
    const promedio = completo ? Number(((notaA + notaB + notaC) / 3).toFixed(2)) : 0;

    return {
      idCuarteto: c.id_cuarteto,
      nombreCuarteto: c.nombre_cuarteto,
      codigoCuarteto: c.codigo_cuarteto || (`#${c.id_cuarteto}`),
      auditorio: c.auditorio || 'Sin Asignar',
      notaA, notaB, notaC,
      completo, promedio
    };
  });

  filas.sort((x, y) => y.promedio - x.promedio);

  return { ranking: filas, descalificados };
}

async function renderS7() {
  const estadoConcurso = await obtenerEstadoConcursoBD();
  const bloqueado = estadoConcurso.edicion_archivada;

  // 1. Obtener cuartetos inscritos de Supabase
  const { data: cuartetosBD, error: errC } = await supabase
    .from('cuarteto')
    .select('*')
    .eq('estado_inscripcion', 'Inscrito');

  if (errC) console.error('⚠️ Error al consultar cuartetos en S7:', errC.message);

  // 2. Obtener evaluaciones defensivamente
  let listaEvaluaciones = [];
  try {
    const { data: evsBD } = await supabase
      .from('evaluacion')
      .select('*');
    if (evsBD) listaEvaluaciones = evsBD;
  } catch (err) {
    console.warn('⚠️ No se pudo leer la tabla evaluacion:', err);
  }

  const cuartetos = cuartetosBD || [];

  // 3. Procesar y calcular ranking (excluyendo descalificados)
  const rankingProcesado = cuartetos.map(c => {
    const esDescalificado = c.estado_presentacion === 'Descalificado';
    const evsCuarteto = listaEvaluaciones.filter(e => e.id_cuarteto === c.id_cuarteto || e.codigo_cuarteto === c.codigo_cuarteto);

    const getNota = (letra) => {
      const e = evsCuarteto.find(x => x.etiqueta_jurado === letra);
      return e ? Number(e.nota) : null;
    };

    const notaA = getNota('A');
    const notaB = getNota('B');
    const notaC = getNota('C');

    const notasValidas = [notaA, notaB, notaC].filter(n => n !== null);
    const promedio = notasValidas.length > 0 
      ? Number((notasValidas.reduce((acc, val) => acc + val, 0) / notasValidas.length).toFixed(2)) 
      : 0;

    return {
      id: c.id_cuarteto,
      codigo: c.codigo_cuarteto || (`CQ-2026-${c.id_cuarteto}`),
      nombre: c.nombre_cuarteto,
      auditorio: c.auditorio || 'Sin Asignar',
      notaA: notaA !== null ? notaA.toFixed(2) : '—',
      notaB: notaB !== null ? notaB.toFixed(2) : '—',
      notaC: notaC !== null ? notaC.toFixed(2) : '—',
      promedio: promedio,
      descalificado: esDescalificado,
      motivo: c.motivo_descalificacion || ''
    };
  });

  const rankingOficial = rankingProcesado
    .filter(q => !q.descalificado && q.auditorio)
    .sort((a, b) => b.promedio - a.promedio);

  const descalificados = rankingProcesado.filter(q => q.descalificado);

  return `
    <div class="card">
      <div class="ficha-header">
        <div>
          <h2>🏆 Subsistema 7 · Ranking Global, Clasificación, Publicación y Cierre</h2>
          <p class="subtitle">HU-19 · HU-20 · HU-21 · HU-22 · RF-46 a RF-54</p>
        </div>
        <div>
          <span class="badge ${estadoConcurso.fase_eliminatoria_estado === 'Concluida' ? 'badge-ok' : 'badge-obs'}">
            FASE: ${estadoConcurso.fase_eliminatoria_estado || 'EN CURSO'}
          </span>
          <span class="badge ${estadoConcurso.portal_publicado ? 'badge-ok' : 'badge-rej'}">
            ${estadoConcurso.portal_publicado ? '🌐 PORTAL PÚBLICO: PUBLICADO' : '🔒 PORTAL PÚBLICO: NO PUBLICADO'}
          </span>
        </div>
      </div>

      <div style="margin-top:16px; margin-bottom:14px;">
        <p style="font-size:13px; color:var(--muted);">
          Edición 2026: <strong>${bloqueado ? '🔒 Archivada y Concluida' : '🟢 En Curso'}</strong>
        </p>
      </div>

      <!-- CONTENEDOR DE FEEDBACK PARA EVITAR ERROR NULL -->
      <div id="s7FeedbackGlobal" style="margin-bottom:14px;"></div>

      <!-- TABLA DE RANKING OFICIAL -->
      <h4 style="margin-bottom:10px; font-size:15px;">📊 Cuadro de Méritos y Promedios (RF-46)</h4>
      <div style="background:#fff; border-radius:10px; border:1px solid var(--border); overflow:hidden; margin-bottom:20px;">
        <table style="width:100%; border-collapse:collapse; text-align:left; font-size:13px;">
          <thead>
            <tr style="background:#f8fafc; border-bottom:1px solid var(--border); color:var(--muted); font-weight:700;">
              <th style="padding:12px 16px; width:8%;">Pos.</th>
              <th style="padding:12px 16px; width:27%;">Cuarteto</th>
              <th style="padding:12px 16px; width:20%;">Auditorio</th>
              <th style="padding:12px 16px; width:10%; text-align:center;">Jurado A</th>
              <th style="padding:12px 16px; width:10%; text-align:center;">Jurado B</th>
              <th style="padding:12px 16px; width:10%; text-align:center;">Jurado C</th>
              <th style="padding:12px 16px; width:15%; text-align:center;">Promedio Final</th>
            </tr>
          </thead>
          <tbody>
            ${rankingOficial.length === 0 ? `
              <tr>
                <td colspan="7" style="text-align:center; padding:24px; color:var(--muted);">
                  No hay cuartetos evaluados y programados en el ranking oficial.
                </td>
              </tr>
            ` : rankingOficial.map((q, idx) => `
              <tr style="border-bottom:1px solid #f1f5f9;">
                <td style="padding:12px 16px; font-weight:800; color:var(--primary);">#${idx + 1}</td>
                <td style="padding:12px 16px;">
                  <strong>${q.nombre}</strong><br><small style="color:var(--muted);">${q.codigo}</small>
                </td>
                <td style="padding:12px 16px; color:var(--muted);">${q.auditorio}</td>
                <td style="padding:12px 16px; text-align:center; font-family:monospace;">${q.notaA}</td>
                <td style="padding:12px 16px; text-align:center; font-family:monospace;">${q.notaB}</td>
                <td style="padding:12px 16px; text-align:center; font-family:monospace;">${q.notaC}</td>
                <td style="padding:12px 16px; text-align:center;">
                  <span style="background:#dcfce7; color:#15803d; padding:4px 10px; border-radius:12px; font-weight:700;">
                    ${q.promedio.toFixed(2)}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      ${descalificados.length > 0 ? `
        <h4 style="margin-bottom:10px; font-size:14px; color:var(--danger);">🚫 Cuartetos Excluidos por Descalificación (HU-18)</h4>
        <div style="background:#fff1f2; border:1px solid #fecdd3; border-radius:8px; padding:12px; margin-bottom:20px; font-size:13px;">
          ${descalificados.map(d => `
            <div style="margin-bottom:6px;">
              <strong>${d.nombre}</strong> (${d.codigo}) — Causa: <b>${d.motivo}</b> (Excluido del cuadro de méritos).
            </div>
          `).join('')}
        </div>
      ` : ''}

      <!-- ACCIONES DE CIERRE Y CONSOLIDACIÓN -->
      <h4 style="margin-bottom:12px; font-size:15px;">⚙️ Acciones de Consolidación y Cierre (HU-20 a HU-22)</h4>
      <div style="display:flex; gap:12px; flex-wrap:wrap;">
        <button type="button" class="btn btn-secondary" id="btnConsolidarFase" style="padding:10px 16px;" ${bloqueado ? 'disabled' : ''}>
          1️⃣ Cerrar y Consolidar Fase (HU-20)
        </button>
        <button type="button" class="btn btn-secondary" id="btnPublicarCuadro" style="padding:10px 16px;" ${bloqueado ? 'disabled' : ''}>
          2️⃣ Publicar Cuadro Oficial (HU-21)
        </button>
        <button type="button" class="btn btn-danger" id="btnArchivarEdicion" style="padding:10px 16px;" ${bloqueado ? 'disabled' : ''}>
          3️⃣ Finalizar y Archivar Edición (HU-22)
        </button>
      </div>
    </div>
  `;
}

function bindS7() {
  const fb = document.getElementById('s7FeedbackGlobal');

  // 1. Cerrar y Consolidar Fase (HU-20)
  const btnConsolidar = document.getElementById('btnConsolidarFase');
  if (btnConsolidar) {
    btnConsolidar.addEventListener('click', async () => {
      if (!confirm('¿Confirma cerrar y consolidar la fase eliminatoria? (HU-20)')) return;

      const { error } = await supabase
        .from('configuracion_concurso')
        .update({ fase_eliminatoria_estado: 'Concluida' })
        .eq('id', 1);

      if (error) {
        if (fb) fb.innerHTML = `<div class="alert alert-danger">Error al consolidar fase: ${error.message}</div>`;
        return;
      }

      notificar('✅ Fase eliminatoria cerrada y consolidada con éxito (HU-20).', 'ok');
      await renderAdminTab();
    });
  }

  // 2. Publicar Cuadro Oficial (HU-21)
  const btnPublicar = document.getElementById('btnPublicarCuadro');
  if (btnPublicar) {
    btnPublicar.addEventListener('click', async () => {
      if (!confirm('¿Desea publicar el cuadro oficial de méritos en el portal público? (HU-21)')) return;

      const { error } = await supabase
        .from('configuracion_concurso')
        .update({ portal_publicado: true })
        .eq('id', 1);

      if (error) {
        if (fb) fb.innerHTML = `<div class="alert alert-danger">Error al publicar cuadro: ${error.message}</div>`;
        return;
      }

      notificar('🌐 Cuadro oficial publicado en el portal público con éxito (HU-21).', 'ok');
      await renderAdminTab();
    });
  }

  // 3. Finalizar y Archivar Edición (HU-22)
  const btnArchivar = document.getElementById('btnArchivarEdicion');
  if (btnArchivar) {
    btnArchivar.addEventListener('click', async () => {
      if (!confirm('⚠️ ADVERTENCIA: Esta acción es irreversible. ¿Desea finalizar y archivar la edición 2026 del concurso? (HU-22)')) return;

      const { error } = await supabase
        .from('configuracion_concurso')
        .update({ edicion_archivada: true })
        .eq('id', 1);

      if (error) {
        if (fb) fb.innerHTML = `<div class="alert alert-danger">Error al archivar edición: ${error.message}</div>`;
        return;
      }

      notificar('🔒 Edición 2026 finalizada y archivada correctamente (HU-22).', 'ok');
      await renderAdminTab();
    });
  }
}