/* ============================================================
   ROL JURADO · Mi Sesión (HU-16) y Mi Calificación Inmutable (HU-17)
   RF-39: Solo ve cuartetos de SU auditorio asignado
   RF-41/42: Escala 0.0-10.0 y firma inmutable (Jurado A/B/C)
   ============================================================ */
import { requireRol } from './core/session.js';
import { 
  obtenerDatosJuradoBD, 
  obtenerEstadoConcursoBD, 
  obtenerCuartetosPorAuditorioBD, 
  guardarEvaluacionJuradoBD 
} from './services/juradoService.js';

let juradoSesion = null;
let juradoCuenta = null;

// 🔒 BLINDAJE DE SEGURIDAD POR ROL AL CARGAR LA VISTA
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Valida estrictamente que la sesión pertenezca al rol 'jurado'
    juradoSesion = requireRol('jurado'); 
  } catch (e) {
    console.warn('⚠️ Intento de acceso no autorizado detectado en panel de jurado:', e);
    window.location.replace('login.html');
    return;
  }

  if (!juradoSesion || juradoSesion.rol !== 'jurado') {
    window.location.replace('login.html');
    return;
  }

  // Cargar datos de la cuenta del jurado autenticado desde Supabase
  juradoCuenta = await obtenerDatosJuradoBD(juradoSesion.email);

  const elCred = document.getElementById('juradoCredencial');
  if (elCred && juradoCuenta) {
    elCred.textContent = `${juradoCuenta.nombres} ${juradoCuenta.apellidos || ''} · ${juradoCuenta.auditorio || 'Sin Auditorio'}`;
  }

  await renderSesionJurado();
});

/**
 * Función auxiliar para determinar dinámicamente si el jurado logueado es A, B o C
 * basándose en la terna configurada en el Subsistema 5 para su auditorio.
 */
function obtenerEtiquetaDinamicaJurado(cuentaJurado) {
  if (!cuentaJurado) return 'C';
  
  const nombreJuradoLogueado = `${cuentaJurado.nombres || ''} ${cuentaJurado.apellidos || ''}`.trim().toLowerCase();
  const auditorioAsignado = cuentaJurado.auditorio || 'Auditorio Principal';

  // Leer las ternas configuradas en S5 (localStorage)
  const ternasGuardadas = JSON.parse(localStorage.getItem('concurso_ternas_auditorio') || '{}');
  const ternaAuditorio = ternasGuardadas[auditorioAsignado] || [];

  // Buscar el índice del jurado en la terna (0 = A, 1 = B, 2 = C)
  for (let i = 0; i < ternaAuditorio.length; i++) {
    const juradoTernaNorm = ternaAuditorio[i].trim().toLowerCase();
    if (juradoTernaNorm === nombreJuradoLogueado || juradoTernaNorm.includes(nombreJuradoLogueado) || nombreJuradoLogueado.includes(juradoTernaNorm)) {
      if (i === 0) return 'A';
      if (i === 1) return 'B';
      if (i === 2) return 'C';
    }
  }

  return cuentaJurado.etiqueta || 'C';
}

/* ---------- Render principal de la sesión del jurado ---------- */
async function renderSesionJurado() {
  const cont = document.getElementById('juradoMainContent');
  if (!cont) return;

  if (!juradoCuenta) {
    cont.innerHTML = `
      <div class="card">
        <div class="alert alert-danger">
          <div><strong>Sin cuenta de jurado vinculada.</strong> Contacte a administración (HU-14).</div>
        </div>
      </div>`;
    return;
  }

  const estadoConcurso = await obtenerEstadoConcursoBD();
  const bloqueado = estadoConcurso.edicion_archivada || estadoConcurso.fase_eliminatoria_estado === 'Concluida';
  
  // Asignación dinámica correcta de la etiqueta (A, B o C)
  const miEtiqueta = obtenerEtiquetaDinamicaJurado(juradoCuenta);

  // RF-39: Consultar únicamente los cuartetos asignados estrictamente a su auditorio
  const misCuartetos = await obtenerCuartetosPorAuditorioBD(juradoCuenta.auditorio);

  cont.innerHTML = `
    <div class="card">
      <div class="ficha-header">
        <div>
          <h2>⚖️ Mi Sesión de Evaluación · ${juradoCuenta.auditorio}</h2>
          <p class="subtitle">HU-16 · RF-39/40 · Orden cronológico de presentación · Firma como <strong>Jurado ${miEtiqueta}</strong></p>
        </div>
        <span class="badge ${bloqueado ? 'badge-rej' : 'badge-ok'}">
          ${bloqueado ? '🔒 Acta Cerrada (RNF-24)' : '🟢 Sesión Abierta'}
        </span>
      </div>
      <div id="juradoFeedback" style="margin-top:10px;"></div>

      ${misCuartetos.length === 0 ? `
        <div class="alert alert-warn" style="margin-top:14px;">
          <div>No tiene cuartetos programados en su auditorio (${juradoCuenta.auditorio}).</div>
        </div>
      ` : misCuartetos.map((c, index) => {
        const evs = c.evaluacion || [];
        const descalificado = c.estado_presentacion === 'Descalificado';

        const getNota = (letra) => {
          const e = evs.find(x => x.etiqueta_jurado === letra);
          if (!e) return { jurado: `Jurado ${letra}`, valor: null, inmutable: false };
          const nom = e.nombre_jurado || `Jurado ${letra}`;
          return { jurado: nom, valor: e.nota, inmutable: !!e.inmutable };
        };

        const notasDict = {
          A: getNota('A'),
          B: getNota('B'),
          C: getNota('C')
        };

        const miNotaObj = notasDict[miEtiqueta];
        const tituloObligatoria = c.obra_obligatoria || 'Sin asignar';
        const tituloLibre = c.obra_libre_titulo || 'Sin asignar';

        return `
          <div class="integrante-card" style="background:#fff; margin-top:14px; border-left:4px solid ${descalificado ? 'var(--danger)' : (miNotaObj.inmutable ? 'var(--success)' : 'var(--primary)')};">
            <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:10px;">
              <div>
                <h4>#${index + 1}° · ${c.nombre_cuarteto} <span class="chip">${c.codigo_cuarteto || (`CRT-${c.id_cuarteto}`)}</span></h4>
                <div style="font-size:13px; color:var(--muted);">
                  📅 ${c.fecha_presentacion || '2026-11-20'} · ${c.hora_presentacion || '10:00'} · 🎼 ${tituloObligatoria} | ${tituloLibre}
                </div>
              </div>
              <span class="badge ${descalificado ? 'badge-rej' : (miNotaObj.inmutable ? 'badge-ok' : 'badge-obs')}">
                ${descalificado ? '🚫 Descalificado' : (miNotaObj.inmutable ? '🔒 Mi nota firmada' : '⏳ Pendiente de mi nota')}
              </span>
            </div>

            ${descalificado ? `
              <div class="alert alert-danger" style="margin-top:10px; margin-bottom:0;">
                <div>Cuarteto descalificado por administración (${c.motivo_descalificacion || 'Inasistencia'}). Casillas anuladas (RF-44).</div>
              </div>
            ` : `
              <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:12px; margin-top:12px;">
                ${['A', 'B', 'C'].map(l => {
                  const n = notasDict[l];
                  const esMia = (l === miEtiqueta);
                  return `
                    <div style="background:#f8fafc; padding:12px; border-radius:8px; border:1px solid ${esMia ? 'var(--primary)' : 'var(--border)'};">
                      <div style="font-size:12px; font-weight:700;">Jurado ${l} ${esMia ? '(TÚ)' : ''} · ${n.jurado}</div>
                      ${n.inmutable ? `
                        <div style="font-size:22px; font-weight:800; margin-top:4px;">
                          ${Number(n.valor).toFixed(2)} <small style="font-size:11px; color:var(--muted);">/ 10.00 🔒</small>
                        </div>
                      ` : (esMia ? `
                        <div style="display:flex; gap:6px; margin-top:8px; align-items:center;">
                          <input type="number" step="0.1" min="0" max="10" id="notaJurado_${c.id_cuarteto}" placeholder="0.0 - 10.0"
                                 style="width:95px; padding:6px 8px; border:1.5px solid var(--primary); border-radius:6px; font-weight:700;" ${bloqueado ? 'disabled' : ''}>
                          <button type="button" class="btn btn-primary btn-firmar-nota" data-id="${c.id_cuarteto}" data-nombre="${c.nombre_cuarteto}" style="padding:6px 10px; font-size:12px;" ${bloqueado ? 'disabled' : ''}>
                            ✓ Firmar
                          </button>
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

  bindEventsJurado(miEtiqueta);
}

/* ---------- Eventos: Firmar nota inmutable (HU-17) ---------- */
function bindEventsJurado(letra) {
  document.querySelectorAll('.btn-firmar-nota').forEach(btn => {
    btn.addEventListener('click', async function () {
      const idCuarteto = this.dataset.id;
      const nombreCuarteto = this.dataset.nombre;
      const inp = document.getElementById(`notaJurado_${idCuarteto}`);
      const fb = document.getElementById('juradoFeedback');
      const raw = inp ? inp.value.trim() : '';
      const val = parseFloat(raw);

      // RF-41: Validación estricta del rango 0.0 a 10.0
      if (raw === '' || isNaN(val) || val < 0 || val > 10) {
        fb.innerHTML = `<div class="alert alert-danger"><div><strong>[!] Puntaje fuera de escala (RF-41):</strong> El puntaje debe estar entre 0.0 y 10.0.</div></div>`;
        return;
      }

      // RF-42: Confirmación de inmutabilidad
      if (!confirm(`¿Confirmar nota ${val.toFixed(2)} como Jurado ${letra} para "${nombreCuarteto}"? Esta acción es INMUTABLE (RF-42).`)) return;

      const notaFinal = Math.round(val * 100) / 100;
      const ahora = new Date().toISOString();
      const nombreJuradoCompleto = `${juradoCuenta.nombres} ${juradoCuenta.apellidos || ''}`.trim();

      try {
        await guardarEvaluacionJuradoBD({
          id_cuarteto: idCuarteto,
          codigo_cuarteto: idCuarteto,
          etiqueta_jurado: letra,
          nombre_jurado: nombreJuradoCompleto,
          nota: notaFinal,
          inmutable: true,
          fecha_evaluacion: ahora
        });

        alert(`🔒 Nota ${notaFinal.toFixed(2)} firmada como Jurado ${letra} para ${nombreCuarteto}. Registro inmutable (RF-42).`);
        await renderSesionJurado();
      } catch (error) {
        fb.innerHTML = `<div class="alert alert-danger"><div>Error al guardar la calificación en Supabase: ${error.message}</div></div>`;
      }
    });
  });
}