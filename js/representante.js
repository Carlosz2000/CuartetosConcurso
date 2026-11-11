import { supabase } from '../config/supabase.js';

/* ============================================================
   PORTAL DEL REPRESENTANTE (Conectado 100% a Supabase)
   ============================================================ */

// Estado global local para el portal del representante
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
    fechaConfirmacionValor: null
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
 * Consulta la base de datos de Supabase para traer el último cuarteto registrado 
 * y sus integrantes asociados.
 */
async function cargarDatosDesdeSupabase() {
  try {
    // 1. Consultar el último cuarteto registrado en Supabase
    const { data: cuartetosData, error: errCuarteto } = await supabase
      .from('cuarteto')
      .select('*')
      .order('id_cuarteto', { ascending: false })
      .limit(1);

    if (errCuarteto || !cuartetosData || cuartetosData.length === 0) {
      alert('⚠️ Aún no hay cuartetos registrados en la base de datos. Serás redirigido al inicio.');
      window.location.href = 'index.html';
      return;
    }

    const c = cuartetosData[0];
    StoreRepresentante.ficha.id = c.id_cuarteto;
    StoreRepresentante.ficha.codigo = c.codigo_cuarteto || `CQ-2026-${c.id_cuarteto}`;
    StoreRepresentante.ficha.nombre = c.nombre_cuarteto;
    StoreRepresentante.ficha.estado = c.estado_inscripcion ? c.estado_inscripcion.toLowerCase() : 'en borrador';
    StoreRepresentante.ficha.repertorio = {
      obligatoria: { titulo: c.obra_obligatoria },
      libre: { titulo: c.obra_libre_titulo, duracion: c.obra_libre_duracion }
    };

    // 2. Consultar los integrantes asociados a este cuarteto
    const { data: integrantesData, error: errIntegrantes } = await supabase
      .from('integrante')
      .select('*')
      .eq('id_cuarteto', c.id_cuarteto);

    if (!errIntegrantes && integrantesData) {
      StoreRepresentante.ficha.integrantes = integrantesData.map(it => ({
        nombre: it.nombre_completo,
        edad: it.edad,
        dni: it.dni,
        correo: it.correo_institucional,
        instrumento: it.instrumento
      }));
    }

    // 3. Consultar profesor responsable si existe (formateando nombre sin valores null)
    if (c.id_profesor_responsable) {
      const { data: profData } = await supabase
        .from('usuario')
        .select('*')
        .eq('id_usuario', c.id_profesor_responsable)
        .single();

      if (profData) {
        const nombreCompleto = `${profData.nombres || ''} ${profData.apellidos || ''}`.trim();
        StoreRepresentante.ficha.profesor = {
          nombre: nombreCompleto || 'Docente Responsable',
          dni: profData.dni,
          correo: profData.correo_institucional
        };
      }
    }

  } catch (e) {
    console.error('Error al conectar con Supabase en el Portal:', e);
  }

  // Actualizar header del portal
  const codigo = StoreRepresentante.ficha.codigo;
  const nombre = StoreRepresentante.ficha.nombre;
  const headerCodigo = $('headerCodigo');
  if (headerCodigo) headerCodigo.textContent = `Cuarteto: ${nombre} (${codigo})`;

  // Configurar pestañas del portal
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      switchTab(this.dataset.tab);
    });
  });

  switchTab('ficha');
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

  // Evaluación de estado para asignar icono, clase CSS y editabilidad
  let icono = '📝';
  let claseBanner = 'borrador';
  let esEditable = false;

  if (estadoNorm === 'inscrito' || estadoNorm === 'validado') {
    icono = '✅';
    claseBanner = 'validado';
    esEditable = false;
  } else if (estadoNorm === 'rechazado') {
    icono = '❌';
    claseBanner = 'rechazado';
    esEditable = false;
  } else if (estadoNorm === 'observado') {
    icono = '⚠️';
    claseBanner = 'observado';
    esEditable = true;
  } else {
    // en borrador / preinscripcion / pendiente
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
        <div class="ficha-item"><div class="label">Profesor Responsable</div><div class="value">${f.profesor?.nombre || 'No asignado'}</div></div>
        <div class="ficha-item"><div class="label">Obra Obligatoria</div><div class="value">${f.repertorio.obligatoria?.titulo || '—'}</div></div>
        <div class="ficha-item"><div class="label">Obra Libre</div><div class="value">${f.repertorio.libre?.titulo || '—'}</div></div>
      </div>
    </div>
  `;
}

function renderCitacion() {
  return `
    <div class="card">
      <h2>Mi Turno de Presentación</h2>
      <div class="alert alert-info">
        <div><strong>📜 Turno en proceso de programación</strong><br>Una vez que el administrador asigne el auditorio y horario, aparecerá reflejado aquí.</div>
      </div>
    </div>
  `;
}

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
    // 1. Funcionalidad del botón Confirmar Estado y Valor
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

    // 2. Funcionalidad del botón Editar Ficha
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