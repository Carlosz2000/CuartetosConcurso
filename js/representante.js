import { supabase } from '../config/supabase.js';

/* ============================================================
   PORTAL DEL REPRESENTANTE (Conectado 100% a Supabase)
   Sincronizado con S4 (Cronograma) y S6 (Supervisión)
   Seguridad Estricta: Aislamiento por Cuenta del Representante Creador
   ============================================================ */

let StoreRepresentante = {
  ficha: {
    id: null,
    codigo: null,
    nombre: '',
    estado: 'pendiente',
    motivo: '',
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

document.addEventListener('DOMContentLoaded', async function () {
  await cargarDatosDesdeSupabase();
  configurarBuzonObservaciones();
});

/**
 * Consulta de forma segura el cuarteto estrictamente creado/vinculado al representante en sesión.
 */
async function cargarDatosDesdeSupabase() {
  try {
    const sessionData = JSON.parse(sessionStorage.getItem('competia_session') || '{}');
    const userId = sessionData.id_usuario || sessionData.id;
    const userEmail = sessionData.correo || sessionData.email;

    if (!userId && !userEmail) {
      alert('⚠️ No se encontró una sesión activa válida. Por favor, inicia sesión.');
      window.location.href = 'landing.html';
      return;
    }

    // CONSULTA FLEXIBLE Y SEGURA PARA EL REPRESENTANTE CREADOR:
    // Intenta buscar por id_representante o por el correo de contacto si aplica
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

    // Si el representante no tiene ningún cuarteto creado asociado a su cuenta
    if (errCuarteto || !cuartetosData || cuartetosData.length === 0) {
      StoreRepresentante.ficha.nombre = 'Sin Cuarteto Registrado';
      StoreRepresentante.ficha.estado = 'Sin Ficha';
      renderizarVistaSinCuarteto();
      return;
    }

    const c = cuartetosData[0];
    StoreRepresentante.ficha.id = c.id_cuarteto;
    StoreRepresentante.ficha.codigo = c.codigo_cuarteto || `CQ-2026-${c.id_cuarteto}`;
    StoreRepresentante.ficha.nombre = c.nombre_cuarteto;
    StoreRepresentante.ficha.estado = c.estado_inscripcion ? c.estado_inscripcion.toLowerCase() : 'en borrador';
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

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      switchTab(this.dataset.tab);
    });
  });

  switchTab('ficha');
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
function switchTab(tab) {
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
   TAB: RETIRO VOLUNTARIO
   ============================================================ */
function renderRetiro() {
  return `
    <div class="card">
      <h2>Retiro Voluntario</h2>
      <p class="subtitle">Gestión de exclusión del concurso</p>
      <div class="form-row">
        <label>Motivo del retiro</label>
        <textarea id="motivoRetiro" rows="3" placeholder="Escribe el motivo..."></textarea>
      </div>
      <button class="btn btn-danger" id="btnSolicitarRetiro">Solicitar Retiro</button>
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