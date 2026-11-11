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

/* ---------- Filtros específicos de S6 y S7 ---------- */
let filtroAuditorioAdminS6 = 'TODOS';

document.addEventListener('DOMContentLoaded', () => {
  adminSesion = requireRol('administrador');
  if (!adminSesion) return;

  const elCred = document.getElementById('adminCredencial');
  if (elCred) elCred.textContent = `${adminSesion.nombre} · ${adminSesion.rol.toUpperCase()}`;

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
  const { data } = await supabase
    .from('configuracion_concurso')
    .select('*')
    .eq('id_edicion', 2026)
    .maybeSingle();

  if (data) return data;

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

async function guardarEstadoConcursoBD(cambios) {
  const { error } = await supabase
    .from('configuracion_concurso')
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
                  obras.map(o => `
                  <tr>
                    <td><strong>${o.titulo}</strong></td>
                    <td>${o.compositor || '—'}</td>
                    <td><span class="badge badge-code">${segundosAMmSs(o.duracion_estimada)} min</span></td>
                    <td><span class="badge badge-ok">Activa</span></td>
                  </tr>
                `).join('')}
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
      showToast(`✅ Obra "${titulo}" agregada al catálogo.`, 'ok');
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

      // RF-30: Validación de traslapes en un mismo auditorio, fecha y hora
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

      // Actualizar la programación en Supabase
      const { error } = await supabase
        .from('cuarteto')
        .update({
          sede: sede,
          auditorio: auditorio,
          fecha_presentacion: fecha,
          hora_presentacion: hora
        })
        .eq('id_cuarteto', idCuarteto);

      if (error) {
        fb.innerHTML = `<div class="alert alert-danger"><div>Error al guardar turno: ${error.message}</div></div>`;
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
        showToast(`📅 Turno actualizado para el cuarteto #${idCuarteto}`, 'ok');
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

  const { data: juradosBD } = await supabase
    .from('usuario')
    .select('*')
    .ilike('rol', 'jurado');

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

      <div class="grid-2" style="margin-top:16px; align-items:start;">
        <div class="integrante-card" style="background:#fff;">
          <h4>🔐 HU-14 · Crear Cuenta de Jurado</h4>
          <form id="formCrearJurado">
            <div class="form-row">
              <label>Nombre Completo <span class="req">*</span></label>
              <input type="text" id="s5Nombre" placeholder="Ej: Dra. Beatriz Morales" ${bloqueado ? 'disabled' : ''}>
            </div>
            <div class="grid-2">
              <div class="form-row">
                <label>DNI (8 dígitos) <span class="req">*</span></label>
                <input type="text" id="s5Dni" maxlength="8" placeholder="Ej: 45678912" ${bloqueado ? 'disabled' : ''}>
              </div>
              <div class="form-row">
                <label>Especialidad Musical <span class="req">*</span></label>
                <input type="text" id="s5Especialidad" placeholder="Ej: Violín y Música de Cámara" ${bloqueado ? 'disabled' : ''}>
              </div>
            </div>
            <div class="form-row">
              <label>Correo Institucional <span class="req">*</span></label>
              <input type="email" id="s5Correo" placeholder="Ej: bmorales@conservatorio.edu.pe" ${bloqueado ? 'disabled' : ''}>
            </div>
            <div id="s5FeedbackJurado" style="margin-bottom:10px;"></div>
            <button type="submit" class="btn btn-primary" ${bloqueado ? 'disabled' : ''}>
              ✉️ Crear Cuenta y Enviar Credenciales
            </button>
          </form>
        </div>

        <div class="integrante-card" style="background:#fff;">
          <h4>⚖️ HU-15 · Asignar Terna de 3 Jurados por Auditorio</h4>
          <p style="font-size:12px; color:var(--muted); margin-bottom:12px;">
            Valida que ningún jurado sea Profesor Responsable de un cuarteto en ese auditorio.
          </p>
          <form id="formAsignarTerna">
            <div class="form-row">
              <label>Auditorio <span class="req">*</span></label>
              <select id="s5Auditorio" ${bloqueado ? 'disabled' : ''}>
                <option value="Auditorio Principal">Auditorio Principal</option>
                <option value="Auditorio B — Sala Beethoven">Auditorio B — Sala Beethoven</option>
                <option value="Auditorio C — Sala Mozart">Auditorio C — Sala Mozart</option>
              </select>
            </div>
            <div class="form-row">
              <label>Jurado A <span class="req">*</span></label>
              <select id="s5JuradoA" ${bloqueado ? 'disabled' : ''}>
                ${listaJurados.map(j => `<option value="${j.nombres} ${j.apellidos || ''}">${j.nombres} ${j.apellidos || ''}</option>`).join('')}
              </select>
            </div>
            <div class="form-row">
              <label>Jurado B <span class="req">*</span></label>
              <select id="s5JuradoB" ${bloqueado ? 'disabled' : ''}>
                ${listaJurados.map(j => `<option value="${j.nombres} ${j.apellidos || ''}">${j.nombres} ${j.apellidos || ''}</option>`).join('')}
              </select>
            </div>
            <div class="form-row">
              <label>Jurado C <span class="req">*</span></label>
              <select id="s5JuradoC" ${bloqueado ? 'disabled' : ''}>
                ${listaJurados.map(j => `<option value="${j.nombres} ${j.apellidos || ''}">${j.nombres} ${j.apellidos || ''}</option>`).join('')}
              </select>
            </div>
            <div id="s5FeedbackTerna" style="margin-bottom:10px;"></div>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              <button type="submit" class="btn btn-primary" ${bloqueado ? 'disabled' : ''}>
                ✓ Validar y Vincular Terna
              </button>
              <button type="button" class="btn btn-secondary" id="btnSimularConflicto" style="color:var(--danger); border:1px solid #fca5a5;">
                ⚠️ Simular Conflicto
              </button>
            </div>
          </form>
        </div>
      </div>

      <h4 style="margin-top:20px; margin-bottom:10px;">📋 Nómina de Jurados (Supabase)</h4>
      <div class="table-container">
        <table class="table">
          <thead>
            <tr><th>Jurado</th><th>DNI</th><th>Correo</th><th>Especialidad</th><th>Estado</th></tr>
          </thead>
          <tbody>
            ${listaJurados.length === 0 ? `
              <tr><td colspan="5" style="text-align:center;">No hay jurados registrados en Supabase.</td></tr>
            ` : listaJurados.map(j => `
              <tr>
                <td><strong>${j.nombres} ${j.apellidos || ''}</strong></td>
                <td><code>${j.dni || '—'}</code></td>
                <td>${j.correo_institucional || j.correo || '—'}</td>
                <td>${j.especialidad || 'Música de Cámara'}</td>
                <td><span class="badge badge-ok">Acreditado</span></td>
              </tr>
            `).join('')}
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

      const credencial = 'JUR-2026-' + Math.floor(Math.random() * 9000 + 1000);

      const { error } = await supabase
        .from('usuario')
        .insert([{
          nombres: nombre,
          apellidos: '',
          dni: dni,
          especialidad: esp,
          correo_institucional: correo,
          rol: 'jurado',
          contraseña: credencial
        }]);

      if (error) {
        fb.innerHTML = `<div class="alert alert-danger"><div>Error al crear jurado en Supabase: ${error.message}</div></div>`;
        return;
      }

      if (typeof registrarCorreoSimulado === 'function') {
        registrarCorreoSimulado(
          correo,
          'Bienvenido al Módulo de Evaluación - Credenciales Jurado',
          `Usuario: ${correo} | Contraseña temporal: ${credencial}`,
          'RF-36'
        );
      }

      showToast(`✅ Cuenta de jurado guardada en Supabase para ${nombre}. Credencial ${credencial} emitida.`, 'ok');
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
            const nombreProfesor = `${c.usuario.nombres} ${c.usuario.apellidos || ''}`.trim();
            if (setJurados.has(nombreProfesor)) {
              fb.innerHTML = `<div class="alert alert-danger"><div><strong>🚫 Bloqueo por Conflicto Académico (HU-15 · RF-38):</strong> <b>${nombreProfesor}</b> es Profesor Responsable del cuarteto "${c.nombre_cuarteto}" asignado al ${aud}.</div></div>`;
              return;
            }
          }
        }
      }

      fb.innerHTML = `<div class="alert alert-success"><div><strong>✅ Terna Aprobada (HU-15):</strong> ${jA}, ${jB} y ${jC} asignados correctamente al <b>${aud}</b> sin incompatibilidades.</div></div>`;
      showToast(`✅ Terna de 3 jurados validada para ${aud}`, 'ok');
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

  // Consulta de cuartetos e iteración sobre evaluaciones asociadas
  const { data: cuartetosBD } = await supabase
    .from('cuarteto')
    .select(`
      id_cuarteto,
      nombre_cuarteto,
      codigo_cuarteto,
      auditorio,
      fecha_presentacion,
      hora_presentacion,
      estado_presentacion,
      motivo_descalificacion,
      evaluacion (
        id_evaluacion,
        etiqueta_jurado,
        nota,
        inmutable,
        fecha_evaluacion,
        usuario ( nombres, apellidos )
      )
    `)
    .eq('estado_inscripcion', 'Inscrito');

  const listaEvaluaciones = (cuartetosBD || []).map(c => {
    const evs = c.evaluacion || [];
    const getNota = (letra) => {
      const e = evs.find(x => x.etiqueta_jurado === letra);
      if (!e) return { jurado: `Jurado ${letra}`, valor: null, inmutable: false, fecha: '' };
      const nombreJurado = e.usuario ? `${e.usuario.nombres} ${e.usuario.apellidos || ''}`.trim() : `Jurado ${letra}`;
      return { jurado: nombreJurado, valor: e.nota, inmutable: !!e.inmutable, fecha: e.fecha_evaluacion || '' };
    };

    return {
      idCuarteto: c.id_cuarteto,
      codigoCuarteto: c.codigo_cuarteto || (`#${c.id_cuarteto}`),
      nombreCuarteto: c.nombre_cuarteto,
      auditorio: c.auditorio || 'Sin Asignar',
      fecha: c.fecha_presentacion || '—',
      hora: c.hora_presentacion || '—',
      estadoPresentacion: c.estado_presentacion || 'Pendiente',
      motivoDescalificacion: c.motivo_descalificacion || '',
      notas: {
        A: getNota('A'),
        B: getNota('B'),
        C: getNota('C')
      }
    };
  });

  const listaFiltrada = filtroAuditorioAdminS6 === 'TODOS'
    ? listaEvaluaciones
    : listaEvaluaciones.filter(ev => ev.auditorio === filtroAuditorioAdminS6);

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
            <option value="Auditorio B — Sala Beethoven" ${filtroAuditorioAdminS6 === 'Auditorio B — Sala Beethoven' ? 'selected' : ''}>Auditorio B</option>
            <option value="Auditorio C — Sala Mozart" ${filtroAuditorioAdminS6 === 'Auditorio C — Sala Mozart' ? 'selected' : ''}>Auditorio C</option>
          </select>
        </div>
      </div>

      <div id="s6FeedbackGlobal" style="margin-bottom:14px;"></div>

      ${listaFiltrada.length === 0 ? `
        <div style="text-align:center; padding:20px; color:var(--muted);">No hay presentaciones o cuartetos en este auditorio.</div>
      ` : listaFiltrada.map(ev => {
        const esDescalificado = ev.estadoPresentacion === 'Descalificado';
        const notaA = ev.notas.A;
        const notaB = ev.notas.B;
        const notaC = ev.notas.C;
        const todasCalificadas = !esDescalificado && notaA.inmutable && notaB.inmutable && notaC.inmutable;

        return `
          <div class="integrante-card" style="background:#fff; margin-bottom:16px; border-left:4px solid ${esDescalificado ? 'var(--danger)' : (todasCalificadas ? 'var(--success)' : 'var(--primary)')};">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px;">
              <div>
                <h4 style="font-size:16px; margin-bottom:4px;">${ev.nombreCuarteto} <span class="chip">${ev.codigoCuarteto}</span></h4>
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

      if (!confirm(`¿Confirmar DESCALIFICACIÓN de ${nombreCuarteto}? Esta acción es irreversible (RNF-26).`)) return;

      const { error } = await supabase
        .from('cuarteto')
        .update({
          estado_presentacion: 'Descalificado',
          motivo_descalificacion: motivo
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

      showToast(`🚫 ${nombreCuarteto} descalificado (${motivo}). Excluido del ranking (HU-18).`, 'ok');
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
  const { ranking, descalificados } = await calcularRankingOrdenadoBD();
  const archivado = estadoConcurso.edicion_archivada;

  return `
    <div class="card">
      <div class="ficha-header">
        <div>
          <h2>🏆 Subsistema 7 · Ranking Global, Clasificación, Publicación y Cierre</h2>
          <p class="subtitle">HU-19 · HU-20 · HU-21 · HU-22 · RF-46 a RF-54</p>
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <span class="badge ${estadoConcurso.fase_eliminatoria_estado === 'Concluida' ? 'badge-ok' : 'badge-draft'}">
            Fase: ${estadoConcurso.fase_eliminatoria_estado}
          </span>
          <span class="badge ${estadoConcurso.cuadro_publicado ? 'badge-ok' : 'badge-obs'}">
            Portal Público: ${estadoConcurso.cuadro_publicado ? 'Publicado (RF-50)' : 'No Publicado'}
          </span>
          <span class="badge ${archivado ? 'badge-rej' : 'badge-code'}">
            Edición 2026: ${archivado ? '🔒 ARCHIVADA' : 'En Curso'}
          </span>
        </div>
      </div>

      ${archivado && estadoConcurso.ganadores ? `
        <div class="alert alert-success" style="margin-top:14px;">
          <div>
            <strong>🎉 Edición 2026 Archivada (HU-22 · RF-52/53/54 · RNF-29)</strong><br>
            Fecha de archivado: ${estadoConcurso.fecha_archivado}. Registros protegidos contra alteraciones.
          </div>
        </div>
        <div class="podium-grid">
          <div class="podium-card gold">
            <div style="font-size:32px;">🥇</div>
            <div style="font-size:12px; font-weight:800; text-transform:uppercase; color:#854d0e;">1.er Lugar · Ganador</div>
            <div style="font-size:18px; font-weight:800; margin-top:4px;">${estadoConcurso.ganadores.primero?.nombreCuarteto || '—'}</div>
            <div style="font-size:14px; font-weight:700; color:#713f12;">Promedio: ${estadoConcurso.ganadores.primero?.promedio ? estadoConcurso.ganadores.primero.promedio.toFixed(2) : '—'}</div>
          </div>
          ${estadoConcurso.ganadores.segundo ? `
          <div class="podium-card silver">
            <div style="font-size:32px;">🥈</div>
            <div style="font-size:12px; font-weight:800; text-transform:uppercase; color:#334155;">2.º Puesto</div>
            <div style="font-size:18px; font-weight:800; margin-top:4px;">${estadoConcurso.ganadores.segundo.nombreCuarteto}</div>
            <div style="font-size:14px; font-weight:700; color:#475569;">Promedio: ${estadoConcurso.ganadores.segundo.promedio.toFixed(2)}</div>
          </div>` : ''}
          ${estadoConcurso.ganadores.tercero ? `
          <div class="podium-card bronze">
            <div style="font-size:32px;">🥉</div>
            <div style="font-size:12px; font-weight:800; text-transform:uppercase; color:#9a3412;">3.er Puesto</div>
            <div style="font-size:18px; font-weight:800; margin-top:4px;">${estadoConcurso.ganadores.tercero.nombreCuarteto}</div>
            <div style="font-size:14px; font-weight:700; color:#7c2d12;">Promedio: ${estadoConcurso.ganadores.tercero.promedio.toFixed(2)}</div>
          </div>` : ''}
        </div>
      ` : ''}

      <div id="s7Feedback" style="margin-top:12px;"></div>

      <div class="table-container" style="margin-top:14px;">
        <table class="table">
          <thead>
            <tr>
              <th>Posición</th><th>Cuarteto</th><th>Auditorio</th>
              <th>Jurado A</th><th>Jurado B</th><th>Jurado C</th>
              <th>Promedio (RF-46)</th><th>Condición</th>
            </tr>
          </thead>
          <tbody>
            ${ranking.map((r, i) => {
              let condicion = 'En Evaluación';
              let badgeCls = 'badge-draft';
              if (r.completo) {
                if (archivado && i === 0) { condicion = '🏆 Ganador'; badgeCls = 'badge-ok'; }
                else if (archivado && i === 1) { condicion = '🥈 2.º Puesto'; badgeCls = 'badge-ok'; }
                else if (archivado && i === 2) { condicion = '🥉 3.er Puesto'; badgeCls = 'badge-ok'; }
                else if (estadoConcurso.fase_eliminatoria_estado === 'Concluida') { condicion = '✅ Clasificado'; badgeCls = 'badge-ok'; }
                else { condicion = 'Puntaje Consolidado'; badgeCls = 'badge-code'; }
              } else {
                condicion = '⏳ Falta Nota';
                badgeCls = 'badge-obs';
              }
              return `
                <tr>
                  <td><strong>#${i + 1}</strong></td>
                  <td><strong>${r.nombreCuarteto}</strong><br><small style="color:var(--muted);">${r.codigoCuarteto}</small></td>
                  <td><span class="table-badge-auditorio">${r.auditorio}</span></td>
                  <td>${r.notaA !== null ? r.notaA.toFixed(1) : '<span style="color:var(--danger);">Pendiente</span>'}</td>
                  <td>${r.notaB !== null ? r.notaB.toFixed(1) : '<span style="color:var(--danger);">Pendiente</span>'}</td>
                  <td>${r.notaC !== null ? r.notaC.toFixed(1) : '<span style="color:var(--danger);">Pendiente</span>'}</td>
                  <td><strong style="font-size:16px; color:var(--primary);">${r.completo ? r.promedio.toFixed(2) : '—'}</strong></td>
                  <td><span class="badge ${badgeCls}">${condicion}</span></td>
                </tr>
              `;
            }).join('')}
            ${descalificados.map(d => `
              <tr style="background:#fff5f5;">
                <td>—</td>
                <td><strong>${d.nombre_cuarteto}</strong> (${d.codigo_cuarteto || ('#' + d.id_cuarteto)})</td>
                <td>${d.auditorio || 'Sin Asignar'}</td>
                <td colspan="3" style="color:var(--danger); font-weight:600;">Anulado (${d.motivo_descalificacion || 'Inasistencia / Incumplimiento'})</td>
                <td>—</td>
                <td><span class="badge badge-rej">Excluido (RF-44)</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div style="margin-top:20px; display:flex; gap:12px; flex-wrap:wrap; align-items:center;">
        <button type="button" class="btn btn-primary" id="btnCerrarFase" ${archivado ? 'disabled' : ''}>
          1️⃣ Cerrar y Consolidar Fase (HU-20)
        </button>
        <button type="button" class="btn btn-secondary" id="btnPublicarCuadro" ${archivado ? 'disabled' : ''}>
          2️⃣ Publicar Cuadro Oficial (HU-21)
        </button>
        <button type="button" class="btn btn-success" id="btnArchivarEdicion" ${archivado ? 'disabled' : ''}>
          3️⃣ Finalizar y Archivar Edición (HU-22)
        </button>
      </div>
    </div>
  `;
}

function bindS7() {
  const fb = document.getElementById('s7Feedback');

  const btnCerrar = document.getElementById('btnCerrarFase');
  if (btnCerrar) {
    btnCerrar.addEventListener('click', async () => {
      const { ranking } = await calcularRankingOrdenadoBD();
      const incompletos = ranking.filter(r => !r.completo);
      if (incompletos.length > 0) {
        fb.innerHTML = `<div class="alert alert-danger"><div><strong>🚫 Bloqueo (HU-20 · CA1 · RF-48):</strong> Faltan notas en <b>${incompletos.map(x => x.nombreCuarteto).join(', ')}</b>.</div></div>`;
        return;
      }

      await guardarEstadoConcursoBD({
        fase_eliminatoria_estado: 'Concluida',
        fase_final_estado: 'Concluida'
      });

      fb.innerHTML = `<div class="alert alert-success"><div><strong>✅ Fase Concluida (HU-20 · RF-49):</strong> 100% de notas registradas. Mejores promedios → "Clasificado".</div></div>`;
      showToast('✅ Fase cerrada y cuartetos clasificados (HU-20).', 'ok');
      await renderAdminTab();
    });
  }

  const btnPublicar = document.getElementById('btnPublicarCuadro');
  if (btnPublicar) {
    btnPublicar.addEventListener('click', async () => {
      const estadoConcurso = await obtenerEstadoConcursoBD();
      if (estadoConcurso.fase_eliminatoria_estado !== 'Concluida') {
        fb.innerHTML = `<div class="alert alert-warn"><div><strong>⚠️ Fase aún abierta:</strong> Primero cierre la fase (HU-20).</div></div>`;
        return;
      }

      await guardarEstadoConcursoBD({ cuadro_publicado: true });

      if (typeof registrarCorreoSimulado === 'function') {
        registrarCorreoSimulado(
          'todos.representantes@cons.pe, todos.profesores@cons.pe',
          'Acta Oficial de Resultados - Concurso 2026',
          'Se ha publicado en el portal institucional la tabla oficial de posiciones.',
          'RF-51'
        );
      }
      showToast('📢 Cuadro Oficial publicado y correo masivo enviado (HU-21 · RF-50/51).', 'ok');
      await renderAdminTab();
    });
  }

  const btnArchivar = document.getElementById('btnArchivarEdicion');
  if (btnArchivar) {
    btnArchivar.addEventListener('click', async () => {
      const estadoConcurso = await obtenerEstadoConcursoBD();
      if (estadoConcurso.fase_final_estado !== 'Concluida') {
        fb.innerHTML = `<div class="alert alert-danger"><div><strong>🚫 Requisito (HU-22 · CA1 · RF-52):</strong> La Fase Final debe estar "Concluida".</div></div>`;
        return;
      }

      const { ranking } = await calcularRankingOrdenadoBD();
      const ganadores = {
        primero: ranking[0] || null,
        segundo: ranking[1] || null,
        tercero: ranking[2] || null
      };

      await guardarEstadoConcursoBD({
        edicion_archivada: true,
        fecha_archivado: new Date().toLocaleString('es-PE'),
        ganadores: ganadores
      });

      showToast(`🏆 Edición 2026 archivada. Ganador: ${ranking[0] ? ranking[0].nombreCuarteto : '—'} (HU-22).`, 'ok');
      await renderAdminTab();
    });
  }
}