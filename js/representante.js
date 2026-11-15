// js/representante.js
import { requireRol } from './core/session.js';
import { supabase } from '../config/supabase.js';

/* ============================================================
   PORTAL DEL REPRESENTANTE (Conectado 100% a Supabase)
   Sincronizado con S4 (Cronograma), S6 (Supervisión) y Leaderboard
   Seguridad Estricta: Aislamiento por Cuenta del Representante Creador
   ============================================================ */

let representanteSesion = null;

let StoreRepresentante = {
  ficha: {
    id: null,
    codigo: null,
    nombre: '',
    estado: 'pendiente',
    motivo: '',
    observacionProfesor: '', // 💬 Campo para el mensaje/motivo del profesor
    repertorio: { obligatoria: null, libre: null },
    integrantes: [],
    profesor: null,
    confirmacionValor: false,
    fechaConfirmacionValor: null,
    auditorio: null,
    sede: null,
    fechaPresentacion: null,
    horaPresentacion: null,
    estadoPresentacion: 'Pendiente',
    motivoDescalificacion: ''
  }
};

const $ = id => document.getElementById(id);

const hoy = () => new Date().toLocaleString('es-PE', {
  day: '2-digit', month: '2-digit', year: 'numeric',
  hour: '2-digit', minute: '2-digit'
});

// 🔒 BLINDAJE DE SEGURIDAD POR ROL AL CARGAR LA VISTA
document.addEventListener('DOMContentLoaded', async function () {
  try {
    // Valida estrictamente que la sesión pertenezca al rol 'representante'
    representanteSesion = requireRol('representante');
  } catch (e) {
    console.warn('⚠️ Intento de acceso no autorizado detectado en portal del representante:', e);
    window.location.replace('login.html');
    return;
  }

  if (!representanteSesion || representanteSesion.rol !== 'representante') {
    window.location.replace('login.html');
    return;
  }

  // 1. Vincular las pestañas inmediatamente para asegurar la navegación fluida
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      switchTab(this.dataset.tab);
    });
  });

  // 2. Cargar los datos desde Supabase
  await cargarDatosDesdeSupabase();
  configurarBuzonObservaciones();
});

/**
 * Consulta de forma segura el cuarteto estrictamente creado/vinculado al representante en sesión.
 */
async function cargarDatosDesdeSupabase() {
  try {
    const sessionData = representanteSesion || JSON.parse(sessionStorage.getItem('competia_session') || '{}');
    const userId = sessionData.id_usuario || sessionData.id;
    const userEmail = sessionData.correo || sessionData.email || sessionData.correo_institucional;

    if (!userId && !userEmail) {
      alert('⚠️ No se encontró una sesión activa válida. Por favor, inicia sesión.');
      window.location.replace('login.html');
      return;
    }

    let cuartetosData = null;
    let errCuarteto = null;

    if (userId) {
      const resId = await supabase
        .from('cuarteto')
        .select('*')
        .eq('id_representante', userId);
      
      cuartetosData = resId.data;
      errCuarteto = resId.error;
    }

    if ((!cuartetosData || cuartetosData.length === 0) && userEmail) {
      const resEmail = await supabase
        .from('cuarteto')
        .select('*')
        .eq('correo_contacto', userEmail);
      
      cuartetosData = resEmail.data;
      errCuarteto = resEmail.error;
    }

    if (errCuarteto || !cuartetosData || cuartetosData.length === 0) {
      StoreRepresentante.ficha.nombre = 'Sin Cuarteto Registrado';
      StoreRepresentante.ficha.estado = 'Sin Ficha';
      renderizarVistaSinCuarteto();
      actualizarEstadoBotonInscripcion('Sin Ficha');
      return;
    }

    const c = cuartetosData[0];
    StoreRepresentante.ficha.id = c.id_cuarteto;
    StoreRepresentante.ficha.codigo = c.codigo_cuarteto || `CQ-2026-${c.id_cuarteto}`;
    StoreRepresentante.ficha.nombre = c.nombre_cuarteto;
    StoreRepresentante.ficha.estado = c.estado_inscripcion ? c.estado_inscripcion.toLowerCase() : 'en borrador';
    
    // 💬 Capturar la observación o motivo de aprobación/rechazo enviado por el profesor
    StoreRepresentante.ficha.observacionProfesor = c.observacion_profesor || '';

    StoreRepresentante.ficha.repertorio = {
      obligatoria: c.obra_obligatoria || 'No especificada',
      libre: c.obra_libre_titulo || 'No especificada'
    };

    StoreRepresentante.ficha.auditorio = c.auditorio;
    StoreRepresentante.ficha.sede = c.sede || 'Sede Central';
    StoreRepresentante.ficha.fechaPresentacion = c.fecha_presentacion;
    StoreRepresentante.ficha.horaPresentacion = c.hora_presentacion;
    StoreRepresentante.ficha.estadoPresentacion = c.estado_presentacion || 'Pendiente';
    StoreRepresentante.ficha.motivoDescalificacion = c.motivo_descalificacion || '';

    // Consultar integrantes asociados a este cuarteto
    const { data: integrantesData } = await supabase
      .from('integrante')
      .select('*')
      .eq('id_cuarteto', c.id_cuarteto);

    if (integrantesData) {
      StoreRepresentante.ficha.integrantes = integrantesData.map(it => ({
        nombre: it.nombre_completo,
        edad: it.edad,
        dni: it.dni,
        correo: it.correo_institucional,
        instrumento: it.instrumento
      }));
    }

    // Consultar al profesor supervisor asignado (si lo hubiera)
    if (c.id_profesor_responsable) {
      const { data: profData } = await supabase
        .from('usuario')
        .select('*')
        .eq('id_usuario', c.id_profesor_responsable)
        .single();

      if (profData) {
        const nombreCompleto = `${profData.nombres || ''} ${profData.apellidos || ''}`.trim();
        StoreRepresentante.ficha.profesor = {
          nombre: nombreCompleto || 'Docente Supervisor',
          dni: profData.dni,
          correo: profData.correo_institucional
        };
      }
    }

  } catch (e) {
    console.error('Error al conectar con Supabase en el Portal del Representante:', e);
  }

  const codigo = StoreRepresentante.ficha.codigo || '—';
  const nombre = StoreRepresentante.ficha.nombre;
  const headerCodigo = $('headerCodigo');
  if (headerCodigo) headerCodigo.textContent = `Cuarteto: ${nombre} (${codigo})`;

  // Actualizar estado del botón de inscripción superior
  actualizarEstadoBotonInscripcion(StoreRepresentante.ficha.estado);

  switchTab('ficha');
}

/**
 * Habilita o deshabilita el enlace superior de inscripción según el estado de la ficha.
 */
function actualizarEstadoBotonInscripcion(estado) {
  const linkInsc = $('linkInscripcion');
  if (!linkInsc) return;

  const estadoNorm = (estado || '').toLowerCase();

  // Si ya está inscrito o validado, se bloquea el botón para evitar nuevas inscripciones
  if (estadoNorm === 'inscrito' || estadoNorm === 'validado') {
    linkInsc.setAttribute('href', '#');
    linkInsc.style.opacity = '0.4';
    linkInsc.style.pointerEvents = 'none';
    linkInsc.title = 'Ya te encuentras inscrito en el concurso.';
  } else {
    // Si está en rechazado, observado, en borrador o sin ficha, se habilita
    linkInsc.setAttribute('href', 'index.html');
    linkInsc.style.opacity = '1';
    linkInsc.style.pointerEvents = 'auto';
    linkInsc.title = 'Registrar o corregir inscripción';
  }
}

function renderizarVistaSinCuarteto() {
  const content = $('repContent');
  if (content) {
    content.innerHTML = `
      <div class="card" style="text-align:center; padding:40px;">
        <h3>📋 Aún no has registrado ningún cuarteto</h3>
        <p style="color:var(--muted); margin-top:10px;">Como representante, puedes iniciar el proceso de inscripción para dar de alta tu agrupación en el concurso.</p>
      </div>
    `;
  }
}

/* ============================================================
   NAVEGACIÓN POR TABS EN EL PORTAL
   ============================================================ */
async function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  const content = $('repContent');
  if (!content) return;

  switch (tab) {
    case 'ficha':
      content.innerHTML = renderFichaRepresentante();
      break;
    case 'citacion':
      content.innerHTML = renderCitacion();
      break;
    case 'leaderboard':
      content.innerHTML = await renderLeaderboardPublico();
      break;
    case 'retiro':
      content.innerHTML = renderRetiro();
      break;
  }
  asignarEventListenersDinamicos(tab);
}

/* ============================================================
   TAB: MI FICHA
   ============================================================ */
function renderFichaRepresentante() {
  const f = StoreRepresentante.ficha;
  const estadoNorm = f.estado.toLowerCase();

  let icono = '📝';
  let claseBanner = 'borrador';
  let esEditable = false;

  if (estadoNorm === 'inscrito' || estadoNorm === 'validado') {
    icono = '✅';
    claseBanner = 'validado';
  } else if (estadoNorm === 'rechazado') {
    icono = '❌';
    claseBanner = 'rechazado';
  } else if (estadoNorm === 'observado') {
    icono = '⚠️';
    claseBanner = 'observado';
    esEditable = true;
  } else {
    icono = '📝';
    claseBanner = 'borrador';
    esEditable = true;
  }

  return `
    <div class="estado-banner ${claseBanner}">
      <div class="estado-icon">${icono}</div>
      <div class="estado-info">
        <h3>Estado: ${f.estado.toUpperCase()}</h3>
        <p>${esEditable ? 'Puedes modificar los datos de tu ficha antes de la validación administrativa.' : 'Ficha en modo lectura (RNF-13).'}</p>
      </div>
    </div>

    <!-- 💬 Comentario o motivo oficial enviado por el profesor supervisor -->
    ${f.observacionProfesor ? `
      <div class="card" style="border-left: 4px solid var(--primary); background: #f8fafc; margin-bottom: 20px;">
        <h4 style="font-size: 14px; color: var(--primary); margin-bottom: 6px;">💬 Comentarios del Docente Supervisor:</h4>
        <p style="font-size: 13px; color: var(--ink); margin: 0; line-height: 1.5;">${f.observacionProfesor}</p>
      </div>
    ` : ''}

    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <h2>Detalles de la Ficha y Confirmación de Valor (HU-03)</h2>
        ${esEditable ? '<button class="btn btn-secondary" id="btnEditarFicha">✏️ Editar Ficha</button>' : ''}
      </div>

      <div class="alert alert-info" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <div>
          <strong>💳 Valor Oficial de Inscripción: S/ 120.00</strong><br>
          <small>${f.confirmacionValor ? '✅ Confirmado el ' + f.fechaConfirmacionValor : '⏳ Pendiente de confirmación de lectura por el estudiante'}</small>
        </div>
        ${f.confirmacionValor ? '<span class="badge badge-ok">✓ Revisión Confirmada</span>' : '<button class="btn btn-primary" id="btnConfirmarValor">✓ Confirmar Estado y Valor</button>'}
      </div>

      <div class="ficha-grid">
        <div class="ficha-item"><div class="label">Código</div><div class="value">${f.codigo}</div></div>
        <div class="ficha-item"><div class="label">Cuarteto</div><div class="value">${f.nombre}</div></div>
        <div class="ficha-item"><div class="label">Integrantes Registrados</div><div class="value">${f.integrantes.length} músicos</div></div>
        <div class="ficha-item"><div class="label">Profesor Supervisor</div><div class="value">${f.profesor?.nombre || 'No asignado'}</div></div>
        <div class="ficha-item"><div class="label">Obra Obligatoria</div><div class="value">${f.repertorio.obligatoria || '—'}</div></div>
        <div class="ficha-item"><div class="label">Obra Libre</div><div class="value">${f.repertorio.libre || '—'}</div></div>
      </div>
    </div>
  `;
}

/* ============================================================
   TAB: MI CITACIÓN (CRONOGRAMA Y TURNO ASIGNADO)
   ============================================================ */
function renderCitacion() {
  const f = StoreRepresentante.ficha;
  const estaProgramado = f.auditorio && f.fechaPresentacion && f.horaPresentacion;
  const esDescalificado = f.estadoPresentacion === 'Descalificado';

  const ternasGuardadas = JSON.parse(localStorage.getItem('concurso_ternas_auditorio') || '{}');
  const ternaOficial = ternasGuardadas[f.auditorio] || ['Jurado A', 'Jurado B', 'Jurado C'];

  return `
    <div class="card" style="border-left:5px solid ${esDescalificado ? 'var(--danger)' : (estaProgramado ? 'var(--success)' : 'var(--warn)')};">
      <div class="ficha-header" style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px;">
        <div>
          <h2>📜 Citación Oficial de Presentación</h2>
          <p class="subtitle">Detalles del turno asignado por la administración (S4 / S6)</p>
        </div>
        <span class="badge ${esDescalificado ? 'badge-rej' : (estaProgramado ? 'badge-ok' : 'badge-obs')}">
          ${esDescalificado ? '🚫 Descalificado' : (estaProgramado ? '✅ Turno Programado' : '⏳ Pendiente de Programación')}
        </span>
      </div>

      ${esDescalificado ? `
        <div class="alert alert-danger" style="margin-top:16px;">
          <div><strong>🚫 Agrupación Excluida:</strong> Su cuarteto ha sido descalificado. Causa oficial: <b>${f.motivoDescalificacion || 'Incumplimiento de normativa'}</b>.</div>
        </div>
      ` : (estaProgramado ? `
        <div style="background:#f8fafc; padding:16px; border-radius:10px; border:1px solid var(--border); margin-top:16px; display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:14px;">
          <div>
            <span style="font-size:12px; color:var(--muted); display:block; font-weight:700;">🏛️ AUDITORIO ASIGNADO (ÚNICO):</span>
            <strong style="font-size:15px; color:var(--primary);">${f.auditorio}</strong>
            <div style="font-size:12px; color:var(--muted);">${f.sede}</div>
          </div>
          <div>
            <span style="font-size:12px; color:var(--muted); display:block; font-weight:700;">📅 FECHA DE PRESENTACIÓN:</span>
            <strong style="font-size:15px;">${f.fechaPresentacion}</strong>
          </div>
          <div>
            <span style="font-size:12px; color:var(--muted); display:block; font-weight:700;">⏰ HORA EXACTA DEL TURNO:</span>
            <strong style="font-size:16px; color:#15803d; background:#dcfce7; padding:2px 8px; border-radius:6px; display:inline-block;">${f.horaPresentacion} hrs</strong>
          </div>
        </div>

        <div style="margin-top:16px; background:#fff; padding:14px; border:1px solid var(--border); border-radius:8px;">
          <h4 style="font-size:14px; margin-bottom:6px;">👨‍⚖️ Terna Oficial de Jurados Evaluadores (RF-33):</h4>
          <div style="font-size:13px; color:var(--ink);">
            ${ternaOficial.map((j, i) => `• <strong>Jurado ${['A','B','C'][i]}:</strong> ${j}`).join('<br>')}
          </div>
        </div>

        <div style="margin-top:14px; background:#fff; padding:14px; border:1px solid var(--border); border-radius:8px;">
          <h4 style="font-size:14px; margin-bottom:6px;">🎼 Repertorio Registrado:</h4>
          <div style="font-size:13px; color:var(--ink);">
            • <strong>Obra Obligatoria:</strong> ${f.repertorio.obligatoria}<br>
            • <strong>Obra Libre:</strong> ${f.repertorio.libre}
          </div>
        </div>

        <div style="margin-top:20px; display:flex; gap:10px;">
          <button type="button" class="btn btn-primary" onclick="window.print()">
            🖨️ Imprimir Citación Oficial (RF-34)
          </button>
        </div>
      ` : `
        <div class="alert alert-warn" style="margin-top:16px;">
          <div><strong>⏳ En proceso de agendamiento:</strong> Su cuarteto se encuentra registrado e inscrito, pero la administración aún no ha fijado el auditorio y el horario en el cronograma oficial. Vuelva a consultar más tarde.</div>
        </div>
      `)}
    </div>
  `;
}

/* ============================================================
   TAB: LEADERBOARD OFICIAL PÚBLICO
   ============================================================ */
async function renderLeaderboardPublico() {
  try {
    const { data: config } = await supabase
      .from('configuracion_concurso')
      .select('portal_publicado')
      .eq('id', 1)
      .maybeSingle();

    const publicado = config?.portal_publicado || false;

    if (!publicado) {
      return `
        <div class="card" style="text-align:center; padding:40px;">
          <h3>🔒 Leaderboard No Disponible</h3>
          <p style="color:var(--muted); margin-top:10px;">La administración aún no ha publicado el cuadro oficial de resultados de la fase eliminatoria.</p>
        </div>
      `;
    }

    const { data: cuartetosBD } = await supabase
      .from('cuarteto')
      .select('*')
      .eq('estado_inscripcion', 'Inscrito');

    let listaEvaluaciones = [];
    try {
      const { data: evsBD } = await supabase.from('evaluacion').select('*');
      if (evsBD) listaEvaluaciones = evsBD;
    } catch (e) {
      console.warn('Error leyendo evaluaciones:', e);
    }

    const cuartetos = cuartetosBD || [];

    const rankingProcesado = cuartetos.map(c => {
      const esDescalificado = c.estado_presentacion === 'Descalificado';
      const evsCuarteto = listaEvaluaciones.filter(e => e.id_cuarteto === c.id_cuarteto || e.codigo_cuarteto === c.codigo_cuarteto);

      const getNota = (letra) => {
        const e = evsCuarteto.find(x => x.etiqueta_jurado === letra && x.inmutable);
        return e ? Number(e.nota) : null;
      };

      const notaA = getNota('A');
      const notaB = getNota('B');
      const notaC = getNota('C');

      const notasValidas = [notaA, notaB, notaC].filter(n => n !== null);
      const tieneTresNotas = notasValidas.length === 3;
      const promedio = tieneTresNotas 
        ? Number((notasValidas.reduce((acc, val) => acc + val, 0) / 3).toFixed(2)) 
        : 0;

      return {
        codigo: c.codigo_cuarteto || (`CQ-2026-${c.id_cuarteto}`),
        nombre: c.nombre_cuarteto,
        auditorio: c.auditorio || 'Sin Asignar',
        promedio,
        tieneTresNotas,
        descalificado: esDescalificado
      };
    });

    const leaderboardOficial = rankingProcesado
      .filter(q => !q.descalificado && q.tieneTresNotas)
      .sort((a, b) => b.promedio - a.promedio);

    return `
      <div class="card">
        <div class="ficha-header">
          <div>
            <h2>🏆 Leaderboard Oficial del Concurso</h2>
            <p class="subtitle">Cuartetos evaluados con sus tres calificaciones inmutables, ordenados de mayor a menor promedio.</p>
          </div>
          <span class="badge badge-ok">🌐 Publicado Oficialmente</span>
        </div>

        <div style="margin-top:16px;">
          <table style="width:100%; border-collapse:collapse; text-align:left; font-size:13px; background:#fff; border-radius:8px; overflow:hidden;">
            <thead>
              <tr style="background:#f8fafc; border-bottom:2px solid var(--border); color:var(--muted); font-weight:700;">
                <th style="padding:12px 16px;">Puesto</th>
                <th style="padding:12px 16px;">Cuarteto</th>
                <th style="padding:12px 16px;">Auditorio</th>
                <th style="padding:12px 16px; text-align:center;">Promedio Final</th>
              </tr>
            </thead>
            <tbody>
              ${leaderboardOficial.length === 0 ? `
                <tr>
                  <td colspan="4" style="text-align:center; padding:24px; color:var(--muted);">
                    No hay cuartetos con tres notas completas registrados en el leaderboard actual.
                  </td>
                </tr>
              ` : leaderboardOficial.map((q, idx) => `
                <tr style="border-bottom:1px solid #f1f5f9; background:${idx === 0 ? '#fefce8' : '#fff'};">
                  <td style="padding:12px 16px; font-weight:800; color:var(--primary);">#${idx + 1}</td>
                  <td style="padding:12px 16px;"><strong>${q.nombre}</strong><br><small style="color:var(--muted);">${q.codigo}</small></td>
                  <td style="padding:12px 16px; color:var(--muted);">${q.auditorio}</td>
                  <td style="padding:12px 16px; text-align:center;">
                    <span style="background:#dcfce7; color:#15803d; padding:4px 12px; border-radius:12px; font-weight:700; font-size:15px;">
                      ${q.promedio.toFixed(2)}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (err) {
    console.error('Error al renderizar leaderboard público:', err);
    return `<div class="card"><div class="alert alert-danger">Error al cargar el leaderboard.</div></div>`;
  }
}

/* ============================================================
   TAB: RETIRO VOLUNTARIO (Con validación de estado Inscrito/Validado)
   ============================================================ */
function renderRetiro() {
  const f = StoreRepresentante.ficha;
  const estadoNorm = (f.estado || '').toLowerCase();
  
  const estaInscritoOficialmente = (estadoNorm === 'inscrito' || estadoNorm === 'validado');

  return `
    <div class="card">
      <h2>Retiro Voluntario</h2>
      <p class="subtitle">Gestión de exclusión del concurso</p>

      ${estaInscritoOficialmente ? `
        <div class="alert alert-warn" style="margin-bottom: 16px;">
          <div><strong>🔒 Acción no disponible:</strong> Su inscripción ya se encuentra formalizada (estado: <b>${f.estado.toUpperCase()}</b>). Por motivos de organización y cronograma, ya no es posible solicitar el retiro voluntario directamente desde el portal.</div>
        </div>
      ` : ''}

      <div class="form-row">
        <label>Motivo del retiro</label>
        <textarea id="motivoRetiro" rows="3" placeholder="Escribe el motivo..." ${estaInscritoOficialmente ? 'disabled' : ''}></textarea>
      </div>

      <button class="btn btn-danger" id="btnSolicitarRetiro" ${estaInscritoOficialmente ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
        Solicitar Retiro
      </button>
    </div>
  `;
}

function asignarEventListenersDinamicos(tab) {
  if (tab === 'ficha') {
    const btnConfirmar = $('btnConfirmarValor');
    if (btnConfirmar) {
      btnConfirmar.addEventListener('click', async () => {
        try {
          const idCuarteto = StoreRepresentante.ficha.id;
          const fechaHoy = new Date().toLocaleString('es-PE');

          const { error } = await supabase
            .from('cuarteto')
            .update({ 
              confirmacion_valor: true, 
              fecha_confirmacion: new Date().toISOString() 
            })
            .eq('id_cuarteto', idCuarteto);

          if (error) console.warn('Aviso al actualizar en BD:', error.message);

          StoreRepresentante.ficha.confirmacionValor = true;
          StoreRepresentante.ficha.fechaConfirmacionValor = fechaHoy;

          alert('✅ Confirmación de estado y valor registrada con éxito.');
          switchTab('ficha');
        } catch (err) {
          console.error('Error al confirmar valor:', err);
        }
      });
    }

    const btnEdit = $('btnEditarFicha');
    if (btnEdit) {
      btnEdit.addEventListener('click', () => {
        const idCuarteto = StoreRepresentante.ficha.id;
        if (confirm('¿Deseas modificar los datos de tu ficha de inscripción?')) {
          window.location.href = `index.html?edit_id=${idCuarteto}`;
        }
      });
    }
  }
}

function configurarBuzonObservaciones() {
  const modal = $('modalObservacionSistema');
  $('btnAbrirModalFeedback')?.addEventListener('click', () => { if (modal) modal.style.display = 'flex'; });
  $('btnCerrarModalFeedback')?.addEventListener('click', () => { if (modal) modal.style.display = 'none'; });
  $('btnCancelarFeedback')?.addEventListener('click', () => { if (modal) modal.style.display = 'none'; });
}