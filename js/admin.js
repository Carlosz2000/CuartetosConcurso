/* ============================================================
   ROL ADMINISTRADOR · Panel Integral (S1, S3, S5, S6-sup, S7, BD)
   HU-01 a HU-22 · RF-01 a RF-54
   ============================================================ */

let adminSesion = null;
let activeAdminTab = 's1';

/* ---------- Filtros específicos de S6 y S7 ---------- */
let filtroAuditorioAdminS6 = 'TODOS';
let filtroEtiquetaAdminS6 = 'C';

document.addEventListener('DOMContentLoaded', () => {
  adminSesion = requireRol('administrador');
  if (!adminSesion) return;

  cargarEstadoSubsistemas();
  guardarTodoSubsistemas();

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
function renderAdminTab() {
  const cont = document.getElementById('adminMainContent');
  if (!cont) return;

  switch (activeAdminTab) {
    case 's1': cont.innerHTML = renderS1(); bindS1(); break;
    case 's4': cont.innerHTML = renderS4(); bindS4(); break;  
    case 's5': cont.innerHTML = renderS5(); bindS5(); break;
    case 's6': cont.innerHTML = renderS6(); bindS6(); break;
    case 's7': cont.innerHTML = renderS7(); bindS7(); break;
  }
}

/* ============================================================================
   S1 · CATÁLOGO DE OBRAS (HU-01, HU-02)
   ============================================================================ */
function renderS1() {
  const bloqueado = s7Estado.edicionArchivada;
  const obras = [...s1Obras].sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));
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
              <label>Duración Estimada</label>
              <input type="text" id="s1Duracion" placeholder="Ej: 8:00" value="8:00" ${bloqueado ? 'disabled' : ''}>
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
                ${obras.map(o => `
                  <tr>
                    <td><strong>${o.titulo}</strong></td>
                    <td>${o.compositor}</td>
                    <td><span class="badge badge-code">${o.duracion}</span></td>
                    <td><span class="badge badge-ok">Disponible en S2</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div class="hint" style="margin-top:8px;">
            🔗 <strong>RF-03 / RF-05:</strong> Toda obra agregada aquí aparece automáticamente en el menú desplegable del Paso 4 (Repertorio) de la Inscripción.
          </div>
        </div>
      </div>
    </div>
  `;
}

function bindS1() {
  const form = document.getElementById('formS1Obra');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const titulo = document.getElementById('s1Titulo').value.trim();
    const compositor = document.getElementById('s1Compositor').value.trim();
    const duracion = document.getElementById('s1Duracion').value.trim() || '8:00';
    const fb = document.getElementById('s1Feedback');

    if (!titulo) { fb.innerHTML = '<div class="alert alert-danger"><div><strong>[!] RF-02:</strong> El Título es obligatorio.</div></div>'; return; }
    if (!compositor) { fb.innerHTML = '<div class="alert alert-danger"><div><strong>[!] CA3 / RF-02:</strong> El Compositor es obligatorio.</div></div>'; return; }
    if (s1Obras.some(o => o.titulo.toLowerCase() === titulo.toLowerCase())) {
      fb.innerHTML = '<div class="alert alert-danger"><div><strong>[!] RF-04:</strong> Ya existe una obra con ese título.</div></div>'; return;
    }

    s1Obras.push({ id: Date.now(), titulo, compositor, duracion });
    guardarTodoSubsistemas();
    showToast(`✅ Obra "${titulo}" agregada al catálogo (HU-01).`, 'ok');
    renderAdminTab();
  });
}


/* ============================================================================
   S5 · GESTIÓN DE JURADOS Y ASIGNACIÓN INCOMPATIBLE (HU-14, HU-15)
   ============================================================================ */
function renderS5() {
  const bloqueado = s7Estado.edicionArchivada;
  return `
    <div class="card">
      <div class="ficha-header">
        <div>
          <h2>👨‍⚖️ Subsistema 5 · Gestión de Jurados y Control de Incompatibilidad</h2>
          <p class="subtitle">HU-14 · HU-15 · RF-35 a RF-38</p>
        </div>
        <span class="badge badge-ok">${s5Jurados.length} Jurados Acreditados</span>
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
                ${s5Jurados.map(j => `<option value="${j.nombre}">${j.nombre} (${j.especialidad})</option>`).join('')}
              </select>
            </div>
            <div class="form-row">
              <label>Jurado B <span class="req">*</span></label>
              <select id="s5JuradoB" ${bloqueado ? 'disabled' : ''}>
                ${s5Jurados.map(j => `<option value="${j.nombre}">${j.nombre} (${j.especialidad})</option>`).join('')}
              </select>
            </div>
            <div class="form-row">
              <label>Jurado C <span class="req">*</span></label>
              <select id="s5JuradoC" ${bloqueado ? 'disabled' : ''}>
                ${s5Jurados.map(j => `<option value="${j.nombre}">${j.nombre} (${j.especialidad})</option>`).join('')}
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

      <h4 style="margin-top:20px; margin-bottom:10px;">📋 Nómina de Jurados</h4>
      <div class="table-container">
        <table class="table">
          <thead>
            <tr><th>Jurado</th><th>DNI</th><th>Correo</th><th>Especialidad</th><th>Credencial</th><th>Auditorio</th></tr>
          </thead>
          <tbody>
            ${s5Jurados.map(j => `
              <tr>
                <td><strong>${j.nombre}</strong></td>
                <td><code>${j.dni}</code></td>
                <td>${j.correo}</td>
                <td>${j.especialidad}</td>
                <td><span class="badge badge-code">${j.credencial}</span></td>
                <td><span class="table-badge-auditorio">${j.auditorio} · ${j.etiqueta}</span></td>
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
    formCrear.addEventListener('submit', e => {
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
      if (s5Jurados.some(j => j.correo.toLowerCase() === correo.toLowerCase())) {
        fb.innerHTML = '<div class="alert alert-danger"><div><strong>[!] HU-14 Escenario 2:</strong> Correo ya registrado.</div></div>';
        return;
      }

      const credencial = 'JUR-2026-' + Math.floor(Math.random() * 9000 + 1000);
      s5Jurados.push({
        id: s5Jurados.length + 1,
        nombre, dni, correo, especialidad: esp,
        credencial, auditorio: 'Sala de Cámara', etiqueta: 'Jurado Suplente'
      });
      guardarTodoSubsistemas();

      registrarCorreoSimulado(
        correo,
        'Bienvenido al Módulo de Evaluación - Credenciales Jurado',
        `Usuario: ${correo} | Contraseña temporal: ${credencial}`,
        'RF-36'
      );

      showToast(`✅ Cuenta de jurado creada para ${nombre}. Credencial ${credencial} enviada (RF-36).`, 'ok');
      renderAdminTab();
    });
  }

  const formTerna = document.getElementById('formAsignarTerna');
  if (formTerna) {
    formTerna.addEventListener('submit', e => {
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

      const cuartetosEnSala = s6Evaluaciones.filter(ev => ev.auditorio === aud);
      const conflicto = cuartetosEnSala.find(ev => setJurados.has(ev.profesor));
      if (conflicto) {
        fb.innerHTML = `<div class="alert alert-danger"><div><strong>🚫 Bloqueo por Conflicto (HU-15 · RF-38):</strong> <b>${conflicto.profesor}</b> es profesor responsable de un cuarteto en este auditorio (${conflicto.nombreCuarteto}).</div></div>`;
        return;
      }

      fb.innerHTML = `<div class="alert alert-success"><div><strong>✅ Terna Oficial Vinculada (HU-15 · RF-37/38):</strong> ${jA} (A), ${jB} (B) y ${jC} (C) asignados a <b>${aud}</b> sin conflicto.</div></div>`;
      showToast(`✅ Terna de 3 jurados validada para ${aud} (HU-15).`, 'ok');
    });
  }

  const btnConflicto = document.getElementById('btnSimularConflicto');
  if (btnConflicto) {
    btnConflicto.addEventListener('click', () => {
      document.getElementById('s5Auditorio').value = 'Auditorio C — Sala Mozart';
      document.getElementById('s5JuradoA').value = 'Dra. Beatriz Morales';
      const fb = document.getElementById('s5FeedbackTerna');
      fb.innerHTML = `<div class="alert alert-danger"><div><strong>🚫 Bloqueo por Conflicto (HU-15 · RF-38):</strong> <b>Dra. Beatriz Morales</b> es profesora responsable de Harmonia String Quartet en este auditorio.</div></div>`;
    });
  }
}

/* ============================================================================
   S6 · SUPERVISIÓN DE EVALUACIONES Y DESCALIFICACIÓN (HU-18)
   Nota: HU-16/17 (calificación) ya están en jurado.html
   ============================================================================ */
function renderS6() {
  const bloqueado = s7Estado.edicionArchivada || s7Estado.faseEliminatoriaEstado === 'Concluida';
  const listaFiltrada = filtroAuditorioAdminS6 === 'TODOS'
    ? s6Evaluaciones
    : s6Evaluaciones.filter(ev => ev.auditorio === filtroAuditorioAdminS6);

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

      ${listaFiltrada.map(ev => {
        const idx = s6Evaluaciones.findIndex(x => x.codigoCuarteto === ev.codigoCuarteto);
        const esDescalificado = ev.estadoPresentacion === 'Descalificado';
        const notaA = ev.notas.A;
        const notaB = ev.notas.B;
        const notaC = ev.notas.C;
        const todasCalificadas = !esDescalificado && notaA.inmutable && notaB.inmutable && notaC.inmutable;

        return `
          <div class="integrante-card" style="background:#fff; margin-bottom:16px; border-left:4px solid ${esDescalificado ? 'var(--danger)' : (todasCalificadas ? 'var(--success)' : 'var(--primary)')};">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px;">
              <div>
                <h4 style="font-size:16px; margin-bottom:4px;">#${ev.orden}° · ${ev.nombreCuarteto} <span class="chip">${ev.codigoCuarteto}</span></h4>
                <div style="font-size:13px; color:var(--muted);">
                  🏛️ <strong>${ev.auditorio}</strong> · 📅 ${ev.fecha} (${ev.hora}) ·
                  🎼 ${ev.obraObligatoria} | ${ev.obraLibre}
                </div>
              </div>
              <span class="badge ${esDescalificado ? 'badge-rej' : (todasCalificadas ? 'badge-ok' : 'badge-obs')}">
                ${esDescalificado ? '🚫 Descalificado' : (todasCalificadas ? '✅ Evaluado' : '⏳ Pendiente')}
              </span>
            </div>

            ${esDescalificado ? `
              <div class="alert alert-danger" style="margin-top:12px; margin-bottom:0;">
                <div><strong>🚫 Descalificado (HU-18 · RF-43/44):</strong> Causa: <b>${ev.motivoDescalificacion}</b>. Casillas anuladas y excluido del ranking.</div>
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
                        <div style="font-size:11px; color:var(--muted);">Firmado: ${n.fecha}</div>
                      ` : `
                        <div style="font-size:13px; color:var(--muted); margin-top:6px;">Pendiente (reservado para el jurado)</div>
                      `}
                    </div>
                  `;
                }).join('')}
              </div>

              <div style="margin-top:12px; padding-top:10px; border-top:1px dashed var(--border); display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                <input type="text" id="motivoDesc_${idx}" placeholder="Causa oficial de descalificación (ej: Inasistencia al turno)..." style="flex:1; min-width:240px; padding:6px 10px; border:1px solid var(--border); border-radius:6px; font-size:12px;" ${bloqueado ? 'disabled' : ''}>
                <button type="button" class="btn btn-danger btn-descalificar" data-idx="${idx}" ${bloqueado ? 'disabled' : ''}>
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
    btn.addEventListener('click', function () {
      const idx = +this.dataset.idx;
      const ev = s6Evaluaciones[idx];
      const inpMotivo = document.getElementById(`motivoDesc_${idx}`);
      const motivo = inpMotivo ? inpMotivo.value.trim() : '';
      const fb = document.getElementById('s6FeedbackGlobal');

      if (!motivo) {
        fb.innerHTML = '<div class="alert alert-danger"><div><strong>[!] CA1 / RF-43:</strong> Ingrese la causa oficial (ej: "Inasistencia al turno").</div></div>';
        if (inpMotivo) inpMotivo.focus();
        return;
      }

      if (!confirm(`¿Confirmar DESCALIFICACIÓN de ${ev.nombreCuarteto}? Esta acción es irreversible (RNF-26).`)) return;

      ev.estadoPresentacion = 'Descalificado';
      ev.motivoDescalificacion = motivo;
      guardarTodoSubsistemas();

      registrarCorreoSimulado(
        'representante@cons.pe, docente@cons.pe',
        `Notificación Formal de Descalificación - ${ev.nombreCuarteto}`,
        `El cuarteto ${ev.nombreCuarteto} (${ev.codigoCuarteto}) ha sido descalificado. Causa: ${motivo}.`,
        'RF-45'
      );

      showToast(`🚫 ${ev.nombreCuarteto} descalificado (${motivo}). Excluido del ranking (HU-18).`, 'ok');
      renderAdminTab();
    });
  });
}

/* ============================================================================
   S7 · RANKING, CLASIFICACIÓN, PUBLICACIÓN Y CIERRE (HU-19 a HU-22)
   ============================================================================ */
function calcularRankingOrdenado() {
  const activos = s6Evaluaciones.filter(ev => ev.estadoPresentacion !== 'Descalificado');
  const filas = activos.map(ev => {
    const a = ev.notas.A.inmutable ? Number(ev.notas.A.valor) : null;
    const b = ev.notas.B.inmutable ? Number(ev.notas.B.valor) : null;
    const c = ev.notas.C.inmutable ? Number(ev.notas.C.valor) : null;
    const completo = (a !== null && b !== null && c !== null);
    const promedio = completo ? Number(((a + b + c) / 3).toFixed(2)) : 0;
    return { ...ev, notaA: a, notaB: b, notaC: c, completo, promedio };
  });
  filas.sort((x, y) => y.promedio - x.promedio);
  return filas;
}

function renderS7() {
  const ranking = calcularRankingOrdenado();
  const descalificados = s6Evaluaciones.filter(ev => ev.estadoPresentacion === 'Descalificado');
  const archivado = s7Estado.edicionArchivada;

  return `
    <div class="card">
      <div class="ficha-header">
        <div>
          <h2>🏆 Subsistema 7 · Ranking Global, Clasificación, Publicación y Cierre</h2>
          <p class="subtitle">HU-19 · HU-20 · HU-21 · HU-22 · RF-46 a RF-54</p>
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <span class="badge ${s7Estado.faseEliminatoriaEstado === 'Concluida' ? 'badge-ok' : 'badge-draft'}">
            Fase: ${s7Estado.faseEliminatoriaEstado}
          </span>
          <span class="badge ${s7Estado.cuadroPublicado ? 'badge-ok' : 'badge-obs'}">
            Portal Público: ${s7Estado.cuadroPublicado ? 'Publicado (RF-50)' : 'No Publicado'}
          </span>
          <span class="badge ${archivado ? 'badge-rej' : 'badge-code'}">
            Edición 2026: ${archivado ? '🔒 ARCHIVADA' : 'En Curso'}
          </span>
        </div>
      </div>

      ${archivado && s7Estado.ganadores ? `
        <div class="alert alert-success" style="margin-top:14px;">
          <div>
            <strong>🎉 Edición 2026 Archivada (HU-22 · RF-52/53/54 · RNF-29)</strong><br>
            Fecha de archivado: ${s7Estado.fechaArchivado}. Registros protegidos contra alteraciones.
          </div>
        </div>
        <div class="podium-grid">
          <div class="podium-card gold">
            <div style="font-size:32px;">🥇</div>
            <div style="font-size:12px; font-weight:800; text-transform:uppercase; color:#854d0e;">1.er Lugar · Ganador</div>
            <div style="font-size:18px; font-weight:800; margin-top:4px;">${s7Estado.ganadores.primero.nombreCuarteto}</div>
            <div style="font-size:14px; font-weight:700; color:#713f12;">Promedio: ${s7Estado.ganadores.primero.promedio.toFixed(2)}</div>
          </div>
          ${s7Estado.ganadores.segundo ? `
          <div class="podium-card silver">
            <div style="font-size:32px;">🥈</div>
            <div style="font-size:12px; font-weight:800; text-transform:uppercase; color:#334155;">2.º Puesto</div>
            <div style="font-size:18px; font-weight:800; margin-top:4px;">${s7Estado.ganadores.segundo.nombreCuarteto}</div>
            <div style="font-size:14px; font-weight:700; color:#475569;">Promedio: ${s7Estado.ganadores.segundo.promedio.toFixed(2)}</div>
          </div>` : ''}
          ${s7Estado.ganadores.tercero ? `
          <div class="podium-card bronze">
            <div style="font-size:32px;">🥉</div>
            <div style="font-size:12px; font-weight:800; text-transform:uppercase; color:#9a3412;">3.er Puesto</div>
            <div style="font-size:18px; font-weight:800; margin-top:4px;">${s7Estado.ganadores.tercero.nombreCuarteto}</div>
            <div style="font-size:14px; font-weight:700; color:#7c2d12;">Promedio: ${s7Estado.ganadores.tercero.promedio.toFixed(2)}</div>
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
                else if (s7Estado.faseEliminatoriaEstado === 'Concluida') { condicion = '✅ Clasificado'; badgeCls = 'badge-ok'; }
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
                <td><strong>${d.nombreCuarteto}</strong> (${d.codigoCuarteto})</td>
                <td>${d.auditorio}</td>
                <td colspan="3" style="color:var(--danger); font-weight:600;">Anulado (${d.motivoDescalificacion})</td>
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
    btnCerrar.addEventListener('click', () => {
      const ranking = calcularRankingOrdenado();
      const incompletos = ranking.filter(r => !r.completo);
      if (incompletos.length > 0) {
        fb.innerHTML = `<div class="alert alert-danger"><div><strong>🚫 Bloqueo (HU-20 · CA1 · RF-48):</strong> Faltan notas en <b>${incompletos.map(x => x.nombreCuarteto).join(', ')}</b>.</div></div>`;
        return;
      }
      s7Estado.faseEliminatoriaEstado = 'Concluida';
      s7Estado.faseFinalEstado = 'Concluida';
      guardarTodoSubsistemas();
      fb.innerHTML = `<div class="alert alert-success"><div><strong>✅ Fase Concluida (HU-20 · RF-49):</strong> 100% de notas registradas. Mejores promedios → "Clasificado".</div></div>`;
      showToast('✅ Fase cerrada y cuartetos clasificados (HU-20).', 'ok');
      renderAdminTab();
    });
  }

  const btnPublicar = document.getElementById('btnPublicarCuadro');
  if (btnPublicar) {
    btnPublicar.addEventListener('click', () => {
      if (s7Estado.faseEliminatoriaEstado !== 'Concluida') {
        fb.innerHTML = `<div class="alert alert-warn"><div><strong>⚠️ Fase aún abierta:</strong> Primero cierre la fase (HU-20).</div></div>`;
        return;
      }
      s7Estado.cuadroPublicado = true;
      guardarTodoSubsistemas();
      registrarCorreoSimulado(
        'todos.representantes@cons.pe, todos.profesores@cons.pe',
        'Acta Oficial de Resultados - Concurso 2026',
        'Se ha publicado en el portal institucional la tabla oficial de posiciones.',
        'RF-51'
      );
      showToast('📢 Cuadro Oficial publicado y correo masivo enviado (HU-21 · RF-50/51).', 'ok');
      renderAdminTab();
    });
  }

  const btnArchivar = document.getElementById('btnArchivarEdicion');
  if (btnArchivar) {
    btnArchivar.addEventListener('click', () => {
      if (s7Estado.faseFinalEstado !== 'Concluida') {
        fb.innerHTML = `<div class="alert alert-danger"><div><strong>🚫 Requisito (HU-22 · CA1 · RF-52):</strong> La Fase Final debe estar "Concluida".</div></div>`;
        return;
      }
      const ranking = calcularRankingOrdenado();
      s7Estado.edicionArchivada = true;
      s7Estado.fechaArchivado = new Date().toLocaleString('es-PE');
      s7Estado.ganadores = {
        primero: ranking[0] || null,
        segundo: ranking[1] || null,
        tercero: ranking[2] || null
      };
      guardarTodoSubsistemas();
      showToast(`🏆 Edición 2026 archivada. Ganador: ${ranking[0] ? ranking[0].nombreCuarteto : '—'} (HU-22).`, 'ok');
      renderAdminTab();
    });
  }
}