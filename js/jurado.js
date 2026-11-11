/* ============================================================
   ROL JURADO · Mi Sesión (HU-16) y Mi Calificación Inmutable (HU-17)
   RF-39: Solo ve cuartetos de SU auditorio asignado
   RF-41/42: Escala 0.0-10.0 y firma inmutable (Jurado A/B/C)
   ============================================================ */
import { requireRol } from './core/session.js';
import { supabase } from '../config/supabase.js';

let juradoSesion = null;
let juradoCuenta = null;

document.addEventListener('DOMContentLoaded', async () => {
  juradoSesion = requireRol('jurado'); // RNF-24: Acceso exclusivo del rol
  if (!juradoSesion) return;

  // Cargar datos de la cuenta del jurado autenticado desde Supabase
  juradoCuenta = await obtenerDatosJuradoBD(juradoSesion.email);

  const elCred = document.getElementById('juradoCredencial');
  if (elCred && juradoCuenta) {
    elCred.textContent = `${juradoCuenta.nombres} ${juradoCuenta.apellidos || ''} · ${juradoCuenta.auditorio || 'Sin Auditorio'}`;
  }

  await renderSesionJurado();
});

/* ---------- Consultar datos del jurado autenticado ---------- */
async function obtenerDatosJuradoBD(correo) {
  const { data: usuario } = await supabase
    .from('usuario')
    .select('*')
    .ilike('correo_institucional', correo)
    .maybeSingle();

  if (!usuario) return null;

  // Obtener la asignación de auditorio y etiqueta ('A', 'B', 'C') desde la terna/auditorio
  const { data: asignacion } = await supabase
    .from('jurado_auditorio')
    .select('auditorio, etiqueta_jurado')
    .eq('id_usuario', usuario.id_usuario)
    .maybeSingle();

  return {
    ...usuario,
    auditorio: asignacion?.auditorio || usuario.auditorio || 'Auditorio Principal',
    etiqueta: asignacion?.etiqueta_jurado || 'C' // 'A', 'B' o 'C'
  };
}

/* ---------- Consultar estado global del concurso ---------- */
async function obtenerEstadoConcursoBD() {
  const { data } = await supabase
    .from('configuracion_concurso')
    .select('*')
    .eq('id_edicion', 2026)
    .maybeSingle();

  return data || {
    fase_eliminatoria_estado: 'En Curso',
    edicion_archivada: false
  };
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
  const miEtiqueta = juradoCuenta.etiqueta;

  // RF-39: Consultar únicamente los cuartetos en estado 'Inscrito' asignados a SU auditorio
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
      obra_obligatoria:obra!id_obra_obligatoria(titulo),
      obra_libre_titulo,
      evaluacion (
        id_evaluacion,
        id_usuario,
        etiqueta_jurado,
        nota,
        inmutable,
        fecha_evaluacion,
        usuario ( nombres, apellidos )
      )
    `)
    .eq('estado_inscripcion', 'Inscrito')
    .eq('auditorio', juradoCuenta.auditorio)
    .order('hora_presentacion', { ascending: true });

  const misCuartetos = cuartetosBD || [];

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
          const nom = e.usuario ? `${e.usuario.nombres} ${e.usuario.apellidos || ''}`.trim() : `Jurado ${letra}`;
          return { jurado: nom, valor: e.nota, inmutable: !!e.inmutable };
        };

        const notasDict = {
          A: getNota('A'),
          B: getNota('B'),
          C: getNota('C')
        };

        const miNotaObj = notasDict[miEtiqueta];
        const tituloObligatoria = c.obra_obligatoria?.titulo || 'Sin asignar';
        const tituloLibre = c.obra_libre_titulo || 'Sin asignar';

        return `
          <div class="integrante-card" style="background:#fff; margin-top:14px; border-left:4px solid ${descalificado ? 'var(--danger)' : (miNotaObj.inmutable ? 'var(--success)' : 'var(--primary)')};">
            <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:10px;">
              <div>
                <h4>#${index + 1}° · ${c.nombre_cuarteto} <span class="chip">${c.codigo_cuarteto || (` CRT-${c.id_cuarteto}`)}</span></h4>
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

      // Guardar o actualizar la evaluación inmutable en Supabase
      const { error } = await supabase
        .from('evaluacion')
        .upsert([{
          id_cuarteto: idCuarteto,
          id_usuario: juradoCuenta.id_usuario,
          etiqueta_jurado: letra,
          nota: notaFinal,
          inmutable: true,
          fecha_evaluacion: ahora
        }], { onConflict: 'id_cuarteto, etiqueta_jurado' });

      if (error) {
        fb.innerHTML = `<div class="alert alert-danger"><div>Error al guardar la calificación en Supabase: ${error.message}</div></div>`;
        return;
      }

      showToast(`🔒 Nota ${notaFinal.toFixed(2)} firmada como Jurado ${letra} para ${nombreCuarteto}. Registro inmutable (RF-42).`, 'ok');
      await renderSesionJurado();
    });
  });
}