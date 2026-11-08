/* ============================================================
   ROL JURADO · Mi Sesión (HU-16) y Mi Calificación Inmutable (HU-17)
   RF-39: solo ve cuartetos de SU auditorio asignado
   RF-41/42: escala 0.0-10.0 y firma inmutable (Jurado A/B/C)
   ============================================================ */
let juradoSesion = null;
let juradoCuenta = null;

document.addEventListener('DOMContentLoaded', () => {
  juradoSesion = requireRol('jurado');   // RNF-24: acceso exclusivo del rol
  if (!juradoSesion) return;
  cargarEstadoSubsistemas();
  juradoCuenta = buscarCuentaJurado();
  const elCred = document.getElementById('juradoCredencial');
  if (elCred && juradoCuenta) {
    elCred.textContent = `${juradoCuenta.nombre} · ${juradoCuenta.credencial}`;
  }
  renderSesionJurado();
});

function buscarCuentaJurado() {
  return s5Jurados.find(j => j.correo.toLowerCase() === juradoSesion.email.toLowerCase()) || null;
}

/* Letra de firma propia: "Jurado C" -> "C" */
function miEtiqueta() {
  return juradoCuenta ? juradoCuenta.etiqueta.replace('Jurado ', '') : 'C';
}

function renderSesionJurado() {
  const cont = document.getElementById('juradoMainContent');
  if (!cont) return;

  if (!juradoCuenta) {
    cont.innerHTML = `<div class="card"><div class="alert alert-danger"><div><strong>Sin cuenta de jurado vinculada.</strong> Contacte a administración (HU-14).</div></div></div>`;
    return;
  }

  const bloqueado = s7Estado.edicionArchivada || s7Estado.faseEliminatoriaEstado === 'Concluida';
  const letra = miEtiqueta();

  // RF-39: únicamente los cuartetos de SU auditorio, en orden cronológico
  const misCuartetos = s6Evaluaciones
    .filter(ev => ev.auditorio === juradoCuenta.auditorio)
    .sort((a, b) => a.orden - b.orden);

  cont.innerHTML = `
    <div class="card">
      <div class="ficha-header">
        <div>
          <h2>⚖️ Mi Sesión de Evaluación · ${juradoCuenta.auditorio}</h2>
          <p class="subtitle">HU-16 · RF-39/40 · Orden cronológico de presentación · Firma como <strong>Jurado ${letra}</strong></p>
        </div>
        <span class="badge ${bloqueado ? 'badge-rej' : 'badge-ok'}">${bloqueado ? '🔒 Acta Cerrada (RNF-24)' : '🟢 Sesión Abierta'}</span>
      </div>
      <div id="juradoFeedback" style="margin-top:10px;"></div>
      ${misCuartetos.length === 0 ? `
        <div class="alert alert-warn"><div>No tiene cuartetos programados en su auditorio.</div></div>
      ` : misCuartetos.map(ev => {
    const idx = s6Evaluaciones.findIndex(x => x.codigoCuarteto === ev.codigoCuarteto);
    const descalificado = ev.estadoPresentacion === 'Descalificado';
    const miNota = ev.notas[letra];
    return `
          <div class="integrante-card" style="background:#fff; margin-top:14px; border-left:4px solid ${descalificado ? 'var(--danger)' : (miNota.inmutable ? 'var(--success)' : 'var(--primary)')};">
            <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:10px;">
              <div>
                <h4>#${ev.orden}° · ${ev.nombreCuarteto} <span class="chip">${ev.codigoCuarteto}</span></h4>
                <div style="font-size:13px; color:var(--muted);">
                  📅 ${ev.fecha} · ${ev.hora} · 🎼 ${ev.obraObligatoria} | ${ev.obraLibre}
                </div>
              </div>
              <span class="badge ${descalificado ? 'badge-rej' : (miNota.inmutable ? 'badge-ok' : 'badge-obs')}">
                ${descalificado ? '🚫 Descalificado' : (miNota.inmutable ? '🔒 Mi nota firmada' : '⏳ Pendiente de mi nota')}
              </span>
            </div>
            ${descalificado ? `
              <div class="alert alert-danger" style="margin-top:10px; margin-bottom:0;"><div>Cuarteto descalificado por administración. Casillas anuladas (RF-44).</div></div>
            ` : `
              <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:12px; margin-top:12px;">
                ${['A', 'B', 'C'].map(l => {
      const n = ev.notas[l];
      const esMia = (l === letra);
      return `
                    <div style="background:#f8fafc; padding:12px; border-radius:8px; border:1px solid ${esMia ? 'var(--primary)' : 'var(--border)'};">
                      <div style="font-size:12px; font-weight:700;">Jurado ${l} ${esMia ? '(TÚ)' : ''} · ${n.jurado}</div>
                      ${n.inmutable ? `
                        <div style="font-size:22px; font-weight:800; margin-top:4px;">${Number(n.valor).toFixed(2)} <small style="font-size:11px; color:var(--muted);">/ 10.00 🔒</small></div>
                      ` : (esMia ? `
                        <div style="display:flex; gap:6px; margin-top:8px; align-items:center;">
                          <input type="number" step="0.1" min="0" max="10" id="notaJurado_${idx}" placeholder="0.0 - 10.0"
                                 style="width:95px; padding:6px 8px; border:1.5px solid var(--primary); border-radius:6px; font-weight:700;" ${bloqueado ? 'disabled' : ''}>
                          <button type="button" class="btn btn-primary btn-firmar-nota" data-idx="${idx}" style="padding:6px 10px; font-size:12px;" ${bloqueado ? 'disabled' : ''}>✓ Firmar</button>
                        </div>
                      ` : `
                        <div style="font-size:13px; color:var(--muted); margin-top:6px;">Pendiente (reservado)</div>
                      `)}
                    </div>
                  `;
    }).join('')}
              </div>
            `}
          </div>
        `;
  }).join('')}
    </div>
  `;

  // Eventos: firma inmutable de MI propia nota (HU-17)
  document.querySelectorAll('.btn-firmar-nota').forEach(btn => {
    btn.addEventListener('click', function () {
      const idx = +this.dataset.idx;
      const inp = document.getElementById(`notaJurado_${idx}`);
      const fb = document.getElementById('juradoFeedback');
      const raw = inp ? inp.value.trim() : '';
      const val = parseFloat(raw);
      if (raw === '' || isNaN(val) || val < 0 || val > 10) {
        fb.innerHTML = `<div class="alert alert-danger"><div><strong>[!] Puntaje fuera de escala (RF-41):</strong> El puntaje debe estar entre 0 y 10.</div></div>`;
        return;
      }
      if (!confirm(`¿Confirmar nota ${val.toFixed(2)} como Jurado ${letra}? Esta acción es INMUTABLE (RF-42).`)) return;
      const ev = s6Evaluaciones[idx];
      ev.notas[letra].valor = Math.round(val * 100) / 100;
      ev.notas[letra].fecha = new Date().toLocaleString('es-PE');
      ev.notas[letra].inmutable = true;
      if (ev.notas.A.inmutable && ev.notas.B.inmutable && ev.notas.C.inmutable) {
        ev.estadoPresentacion = 'Evaluado';
      }
      guardarTodoSubsistemas();
      showToast(`🔒 Nota ${val.toFixed(2)} firmada como Jurado ${letra} para ${ev.nombreCuarteto}. Registro inmutable (RF-42).`, 'ok');
      renderSesionJurado();
    });
  });
}