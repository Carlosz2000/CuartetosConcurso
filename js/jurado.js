/* ============================================================
   ROL JURADO · Mi Sesión (HU-16) y Mi Calificación Inmutable (HU-17)
   RF-39: Visualización de cuartetos exclusivamente entre los 3 auditorios oficiales
   RF-41/42: Escala 0.0-10.0 y firma inmutable (Jurado A/B/C)
   ============================================================ */
import { requireRol } from './core/session.js';
import { 
  obtenerDatosJuradoBD, 
  obtenerEstadoConcursoBD, 
  obtenerCuartetosPorAuditorioBD, 
  guardarEvaluacionJuradoBD 
} from './services/juradoService.js';
import { supabase } from '../config/supabase.js';

let juradoSesion = null;
let juradoCuenta = null;
let filtroAuditorioJurado = null;

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

  if (juradoCuenta && !filtroAuditorioJurado) {
    filtroAuditorioJurado = juradoCuenta.auditorio || 'Auditorio Principal';
  }

  // Si el auditorio guardado era 'TODOS', por defecto lo ponemos en el Principal
  if (!filtroAuditorioJurado || filtroAuditorioJurado === 'TODOS') {
    filtroAuditorioJurado = 'Auditorio Principal';
  }

  const elCred = document.getElementById('juradoCredencial');
  if (elCred && juradoCuenta) {
    elCred.textContent = `${juradoCuenta.nombres} ${juradoCuenta.apellidos || ''} · ${juradoCuenta.auditorio || 'Sin Auditorio'}`;
  }

  await renderSesionJurado();
});

/**
 * Función auxiliar para determinar dinámicamente si el jurado logueado es A, B o C para un auditorio específico.
 */
async function obtenerEtiquetaParaAuditorio(cuentaJurado, auditorio) {
  if (!cuentaJurado || !auditorio) return null;
  
  const idJuradoLogueado = cuentaJurado.id_usuario || cuentaJurado.id;

  try {
    const { data: config } = await supabase
      .from('configuracion_concurso')
      .select('ternas_auditorios')
      .eq('id', 1)
      .maybeSingle();

    if (config && config.ternas_auditorios) {
      const ternas = typeof config.ternas_auditorios === 'string'
        ? JSON.parse(config.ternas_auditorios)
        : config.ternas_auditorios;

      const ternaAuditorio = ternas[auditorio];
      if (ternaAuditorio) {
        if (ternaAuditorio.a === idJuradoLogueado || ternaAuditorio[0] === idJuradoLogueado) return 'A';
        if (ternaAuditorio.b === idJuradoLogueado || ternaAuditorio[1] === idJuradoLogueado) return 'B';
        if (ternaAuditorio.c === idJuradoLogueado || ternaAuditorio[2] === idJuradoLogueado) return 'C';
      }
    }
  } catch (e) {
    console.warn('⚠️ Error al leer la terna desde Supabase:', e);
  }

  try {
    const ternasGuardadas = JSON.parse(localStorage.getItem('concurso_ternas_auditorio') || '{}');
    const ternaLocal = ternasGuardadas[auditorio];
    if (ternaLocal) {
      if (ternaLocal.a === idJuradoLogueado || ternaLocal[0] === idJuradoLogueado) return 'A';
      if (ternaLocal.b === idJuradoLogueado || ternaLocal[1] === idJuradoLogueado) return 'B';
      if (ternaLocal.c === idJuradoLogueado || ternaLocal[2] === idJuradoLogueado) return 'C';
    }
  } catch (err) {}

  return null; 
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

  if (!filtroAuditorioJurado || filtroAuditorioJurado === 'TODOS') {
    filtroAuditorioJurado = juradoCuenta.auditorio || 'Auditorio Principal';
  }

  const estadoConcurso = await obtenerEstadoConcursoBD();
  const bloqueado = estadoConcurso.edicion_archivada || estadoConcurso.fase_eliminatoria_estado === 'Concluida';

  // Obtener cuartetos estrictamente del auditorio seleccionado
  let misCuartetos = await obtenerCuartetosPorAuditorioBD(filtroAuditorioJurado);

  // Cargar nombres de usuarios para las ternas
  let mapaNombresJurados = {};
  try {
    const { data: usuariosBD } = await supabase.from('usuario').select('id_usuario, nombres, apellidos');
    if (usuariosBD) {
      usuariosBD.forEach(u => {
        mapaNombresJurados[u.id_usuario] = `${u.nombres || ''} ${u.apellidos || ''}`.trim();
      });
    }
  } catch (e) {}

  let ternasGuardadas = JSON.parse(localStorage.getItem('concurso_ternas_auditorio') || '{}');
  try {
    const { data: config } = await supabase.from('configuracion_concurso').select('ternas_auditorios').eq('id', 1).maybeSingle();
    if (config && config.ternas_auditorios) {
      const t = typeof config.ternas_auditorios === 'string' ? JSON.parse(config.ternas_auditorios) : config.ternas_auditorios;
      Object.assign(ternasGuardadas, t);
    }
  } catch (err) {}

  const nombreUsuarioLogueado = `${juradoCuenta.nombres || ''} ${juradoCuenta.apellidos || ''}`.trim() || 'Matias Jurado';

  cont.innerHTML = `
    <div class="card">
      <div class="ficha-header">
        <div>
          <h2>⚖️ Mi Sesión de Evaluación · ${filtroAuditorioJurado}</h2>
          <p class="subtitle">HU-16 · RF-39/40 · Orden cronológico de presentación</p>
        </div>
        <span class="badge ${bloqueado ? 'badge-rej' : 'badge-ok'}">
          ${bloqueado ? '🔒 Acta Cerrada (RNF-24)' : '🟢 Sesión Abierta'}
        </span>
      </div>

      <div style="background:#f8fafc; padding:14px 18px; border-radius:10px; border:1px solid var(--border); display:flex; gap:16px; align-items:center; flex-wrap:wrap; margin:16px 0;">
        <div>
          <label style="font-size:12px; font-weight:700; display:block; margin-bottom:4px;">🏛️ Ver Auditorio:</label>
          <select id="juradoFiltroAuditorio" style="padding:8px 12px; border-radius:8px; border:1px solid var(--border);">
            <option value="Auditorio Principal" ${filtroAuditorioJurado === 'Auditorio Principal' ? 'selected' : ''}>Auditorio Principal</option>
            <option value="Auditorio B — Sala Beethoven" ${filtroAuditorioJurado === 'Auditorio B — Sala Beethoven' ? 'selected' : ''}>Auditorio B — Sala Beethoven</option>
            <option value="Auditorio C — Sala Mozart" ${filtroAuditorioJurado === 'Auditorio C — Sala Mozart' ? 'selected' : ''}>Auditorio C — Sala Mozart</option>
          </select>
        </div>
      </div>

      <div id="juradoFeedback" style="margin-top:10px;"></div>

      ${misCuartetos.length === 0 ? `
        <div class="alert alert-warn" style="margin-top:14px;">
          <div>No hay cuartetos programados en el <b>${filtroAuditorioJurado}</b>.</div>
        </div>
      ` : ''}

      ${(await Promise.all(misCuartetos.map(async (c, index) => {
        const audCuarteto = c.auditorio || filtroAuditorioJurado;
        const miEtiqueta = await obtenerEtiquetaParaAuditorio(juradoCuenta, audCuarteto);
        const ternaObj = ternasGuardadas[audCuarteto] || { a: '', b: '', c: '' };

        const nombreA = miEtiqueta === 'A' ? nombreUsuarioLogueado : (mapaNombresJurados[ternaObj.a || ternaObj[0]] || 'Jurado A');
        const nombreB = miEtiqueta === 'B' ? nombreUsuarioLogueado : (mapaNombresJurados[ternaObj.b || ternaObj[1]] || 'Jurado B');
        const nombreC = miEtiqueta === 'C' ? nombreUsuarioLogueado : (mapaNombresJurados[ternaObj.c || ternaObj[2]] || 'Jurado C');
        const nombresTernaArreglo = [nombreA, nombreB, nombreC];

        const evs = c.evaluacion || [];
        const descalificado = c.estado_presentacion === 'Descalificado';

        const getNota = (letra, idxTerna) => {
          const e = evs.find(x => x.etiqueta_jurado === letra);
          const nombreAsignado = nombresTernaArreglo[idxTerna] || `Jurado ${letra}`;
          if (!e) return { jurado: nombreAsignado, valor: null, inmutable: false };
          return { jurado: e.nombre_jurado || nombreAsignado, valor: e.nota, inmutable: !!e.inmutable };
        };

        const notasDict = {
          A: getNota('A', 0),
          B: getNota('B', 1),
          C: getNota('C', 2)
        };

        const miNotaObj = miEtiqueta ? notasDict[miEtiqueta] : { inmutable: false };
        const tituloObligatoria = c.obra_obligatoria || 'Sin asignar';
        const tituloLibre = c.obra_libre_titulo || 'Sin asignar';

        return `
          <div class="integrante-card" style="background:#fff; margin-top:14px; border-left:4px solid ${descalificado ? 'var(--danger)' : (miNotaObj.inmutable ? 'var(--success)' : 'var(--primary)')};">
            <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:10px;">
              <div>
                <h4>#${index + 1}° · ${c.nombre_cuarteto} <span class="chip">${c.codigo_cuarteto || (`CRT-${c.id_cuarteto}`)}</span></h4>
                <div style="font-size:13px; color:var(--muted);">
                  🏛️ <strong>${audCuarteto}</strong> · 📅 ${c.fecha_presentacion || '2026-11-20'} · ${c.hora_presentacion || '10:00'} · 🎼 ${tituloObligatoria} | ${tituloLibre}
                </div>
              </div>
              <span class="badge ${descalificado ? 'badge-rej' : (miNotaObj.inmutable ? 'badge-ok' : 'badge-obs')}">
                ${descalificado ? '🚫 Descalificado' : (miNotaObj.inmutable ? '🔒 Mi nota firmada' : (miEtiqueta ? '⏳ Pendiente de mi nota' : '👀 Solo lectura (No en terna)'))}
              </span>
            </div>

            ${descalificado ? `
              <div class="alert alert-danger" style="margin-top:10px; margin-bottom:0;">
                <div>Cuarteto descalificado por administración (${c.motivo_descalificacion || 'Inasistencia'}). Casillas anuladas (RF-44).</div>
              </div>
            ` : `
              <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:12px; margin-top:12px;">
                ${['A', 'B', 'C'].map((l, idxTerna) => {
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
                          <button type="button" class="btn btn-primary btn-firmar-nota" data-id="${c.id_cuarteto}" data-letra="${miEtiqueta}" data-nombre="${c.nombre_cuarteto}" style="padding:6px 10px; font-size:12px;" ${bloqueado ? 'disabled' : ''}>
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
      }))).join('')}
    </div>
  `;

  bindEventsJurado();
}

/* ---------- Eventos: Firmar nota inmutable (HU-17) ---------- */
function bindEventsJurado() {
  const selAud = document.getElementById('juradoFiltroAuditorio');
  if (selAud) {
    selAud.addEventListener('change', function () {
      filtroAuditorioJurado = this.value;
      renderSesionJurado();
    });
  }

  document.querySelectorAll('.btn-firmar-nota').forEach(btn => {
    btn.addEventListener('click', async function () {
      const idCuarteto = this.dataset.id;
      const letra = this.dataset.letra;
      const nombreCuarteto = this.dataset.nombre;
      const inp = document.getElementById(`notaJurado_${idCuarteto}`);
      const fb = document.getElementById('juradoFeedback');
      const raw = inp ? inp.value.trim() : '';
      const val = parseFloat(raw);

      if (raw === '' || isNaN(val) || val < 0 || val > 10) {
        fb.innerHTML = `<div class="alert alert-danger"><div><strong>[!] Puntaje fuera de escala (RF-41):</strong> El puntaje debe estar entre 0.0 y 10.0.</div></div>`;
        return;
      }

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