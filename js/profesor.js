/* ============================================================
   ROL PROFESOR · Portal del Profesor Responsable (HU-06 y HU-07)
   ============================================================ */
const PROFESORES_CUENTA = [
  { correo: 'bmorales@cons.pe', nombre: 'Dra. Beatriz Morales', especialidad: 'Música de Cámara' },
  { correo: 'lparedes@cons.pe', nombre: 'Dr. Luis Paredes', especialidad: 'Violín' },
  { correo: 'atorres@cons.pe', nombre: 'Mg. Ana Torres', especialidad: 'Viola' },
  { correo: 'lleon@cons.pe', nombre: 'Dra. Lucía León', especialidad: 'Violín Clásico' }
];

let profesorSesion = null;
let profesorCuenta = null;
let activeProfTab = 'mis';

document.addEventListener('DOMContentLoaded', () => {
  profesorSesion = requireRol('profesor');
  if (!profesorSesion) return;
  
  cargarEstadoSubsistemas();
  profesorCuenta = PROFESORES_CUENTA.find(
    p => p.correo.toLowerCase() === profesorSesion.email.toLowerCase()
  ) || null;
  
  const elCred = document.getElementById('profesorCredencial');
  if (elCred && profesorCuenta) {
    elCred.textContent = `${profesorCuenta.nombre} · ${profesorCuenta.correo}`;
  }

  // Event listeners de tabs
  document.querySelectorAll('[data-prof-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      activeProfTab = btn.dataset.profTab;
      document.querySelectorAll('[data-prof-tab]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderProfTab();
    });
  });
  
  renderProfTab();
});

function renderProfTab() {
  const cont = document.getElementById('profesorMainContent');
  if (!cont) return;
  if (activeProfTab === 'mis') renderPortalProfesor();
  else if (activeProfTab === 'validar') renderValidacionFichas();
}

/* ------------------------------------------------------------
   TAB: MIS CUARTETOS (HU-06)
   ------------------------------------------------------------ */
function renderPortalProfesor() {
  const cont = document.getElementById('profesorMainContent');
  if (!cont) return;
  if (!profesorCuenta) {
    cont.innerHTML = `<div class="card"><div class="alert alert-danger"><div><strong>Cuenta docente no vinculada.</strong> Contacta a administración (HU-06).</div></div></div>`;
    return;
  }
  const misCuartetos = s3Cuartetos.filter(c => c.profesor === profesorCuenta.nombre);
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
        misCuartetos.map(c => `
          <div class="integrante-card" style="background:#fff; margin-bottom:16px; border-left:4px solid var(--profesor, #b45309);">
            <h4>${c.nombre} <span class="chip">${c.codigo}</span></h4>
            <p style="font-size:13px; color:var(--muted);">Estado: <strong>${c.estadoFicha}</strong> · Fase: ${c.faseAsignada}</p>
            <div style="margin-top:12px; display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
              <input type="text" id="notaDocente_${c.codigo}" placeholder="Recomendación académica..." value="${c.recomendacionDocente || ''}" style="flex:1; min-width:250px; padding:8px 12px; border:1px solid var(--border); border-radius:8px;">
              <button type="button" class="btn btn-success btn-avalar-docente" data-cod="${c.codigo}">✓ Confirmar Supervisión</button>
            </div>
          </div>
        `).join('')}
    </div>
  `;
  
  document.querySelectorAll('.btn-avalar-docente').forEach(btn => {
    btn.addEventListener('click', function () {
      const cod = this.dataset.cod;
      const c = s3Cuartetos.find(x => x.codigo === cod);
      const inp = document.getElementById(`notaDocente_${cod}`);
      if (!c) return;
      c.avalDocente = true;
      c.recomendacionDocente = inp ? inp.value.trim() : '';
      guardarTodoSubsistemas();
      registrarCorreoSimulado(c.correoRepresentante, `Supervisión Confirmada - ${c.nombre}`, 'Tu profesor avaló tu ficha.', 'HU-06');
      showToast(`✅ Supervisión confirmada para ${c.nombre}`, 'ok');
      renderPortalProfesor();
    });
  });
}

/* ------------------------------------------------------------
   TAB: VALIDAR FICHAS (HU-07)
   ------------------------------------------------------------ */
function renderValidacionFichas() {
  const cont = document.getElementById('profesorMainContent');
  if (!cont) return;
  if (!profesorCuenta) {
    cont.innerHTML = `<div class="card"><div class="alert alert-danger"><div><strong>Cuenta docente no vinculada.</strong> Contacta a administración.</div></div></div>`;
    return;
  }
  
  // ✅ FILTRAR: Solo mostrar los cuartetos del profesor en sesión
  const misCuartetos = s3Cuartetos.filter(c => c.profesor === profesorCuenta.nombre);
  const bloqueado = s7Estado.edicionArchivada;
  
  cont.innerHTML = `
    <div class="card">
      <div class="ficha-header">
        <div>
          <h2>✅ Validación de Expedientes (HU-07)</h2>
          <p class="subtitle">Aprueba, observa o rechaza las fichas de tus cuartetos.</p>
        </div>
        <span class="badge badge-ok">${misCuartetos.length} cuartetos bajo tu supervisión</span>
      </div>
      ${misCuartetos.length === 0 ? 
        '<div class="alert alert-warn"><div>No tienes cuartetos para validar en este momento.</div></div>' :
        misCuartetos.map((c) => {
          const idx = s3Cuartetos.findIndex(x => x.codigo === c.codigo);
          return `
            <div class="integrante-card" style="background:#fff; margin-bottom:16px; border-left:4px solid ${c.estadoFicha === 'Validado' ? 'var(--success)' : (c.estadoFicha === 'Observado' ? 'var(--warn)' : 'var(--primary)')};">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px;">
                <div>
                  <h4 style="margin-bottom:4px;">🎻 ${c.nombre} <span class="chip">${c.codigo}</span></h4>
                  <div style="font-size:13px; color:var(--muted);">👨‍🏫 Profesor: ${c.profesor} · 🎼 ${c.obraObligatoria}</div>
                </div>
                <span class="badge ${c.estadoFicha === 'Validado' ? 'badge-ok' : (c.estadoFicha === 'Observado' ? 'badge-obs' : 'badge-draft')}">${c.estadoFicha}</span>
              </div>
              <div style="margin-top:12px; display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                <input type="text" id="motivoVal_${idx}" placeholder="Motivo obligatorio para Observar/Rechazar..." style="flex:1; min-width:260px; padding:8px 12px; border:1px solid var(--border); border-radius:8px;" value="${c.motivoObservacion || ''}" ${bloqueado ? 'disabled' : ''}>
                <button type="button" class="btn btn-success btn-val-accion" data-idx="${idx}" data-est="Validado" ${bloqueado ? 'disabled' : ''}>✓ Validar</button>
                <button type="button" class="btn btn-secondary btn-val-accion" data-idx="${idx}" data-est="Observado" style="background:var(--warn-soft); color:#78350f;" ${bloqueado ? 'disabled' : ''}>⚠️ Observar</button>
                <button type="button" class="btn btn-danger btn-val-accion" data-idx="${idx}" data-est="Rechazado" ${bloqueado ? 'disabled' : ''}>✕ Rechazar</button>
              </div>
            </div>
          `;
        }).join('')}
    </div>
  `;
  
  // Bind events
  document.querySelectorAll('.btn-val-accion').forEach(btn => {
    btn.addEventListener('click', function () {
      const idx = +this.dataset.idx;
      const nuevoEstado = this.dataset.est;
      const c = s3Cuartetos[idx];
      const motivoInput = document.getElementById(`motivoVal_${idx}`);
      const motivo = motivoInput ? motivoInput.value.trim() : '';

      if ((nuevoEstado === 'Observado' || nuevoEstado === 'Rechazado') && !motivo) {
        showToast('⚠️ Motivo obligatorio para Observar o Rechazar.', 'error');
        if (motivoInput) motivoInput.focus();
        return;
      }

      c.estadoFicha = nuevoEstado;
      c.motivoObservacion = nuevoEstado === 'Validado' ? '' : motivo;
      guardarTodoSubsistemas();

      // Sincronizar con ficha del representante si coincide
      try {
        const fRaw = localStorage.getItem('concurso_cuartetos_ficha');
        if (fRaw) {
          const f = JSON.parse(fRaw);
          if (f.codigo === c.codigo) {
            f.estado = nuevoEstado.toLowerCase();
            f.motivo = c.motivoObservacion;
            localStorage.setItem('concurso_cuartetos_ficha', JSON.stringify(f));
          }
        }
      } catch (e) {}

      registrarCorreoSimulado(c.correoRepresentante, `Expediente ${c.codigo}: ${nuevoEstado}`, nuevoEstado === 'Validado' ? 'Tu cuarteto ha sido VALIDADO.' : `Motivo: ${motivo}`, 'RF-22');
      showToast(`✅ Expediente "${c.nombre}" → "${nuevoEstado}"`, 'ok');
      renderValidacionFichas();
    });
  });
}