
function getCronogramaData(codigo, nombre) {
  try {
    const progsGuardadas = localStorage.getItem('concurso_cuartetos_s4_programaciones');
    if (progsGuardadas) {
      const progs = JSON.parse(progsGuardadas);
      const match = progs.find(p => p.codigoCuarteto === codigo || (nombre && p.cuartetoNombre.toLowerCase().includes(nombre.toLowerCase())));
      if (match) {
        return {
          fase: match.fase,
          fecha: match.fecha,
          hora: match.hora,
          sede: match.sede,
          auditorio: match.auditorioNombre,
          orden: match.orden,
          jurados: match.terna,
          estado: match.estado
        };
      }
    }
  } catch(e) {}
  return CRONOGRAMA_MOCK[codigo ? codigo.replace(/-/g, '_') : ''] || CRONOGRAMA_MOCK.CQ_2026_0147;
}
/* ============================================================
   PORTAL DEL REPRESENTANTE (S2 + S3 + S4)
   ============================================================ */

// Fecha límite de retiro (RNF-14)
const FECHA_LIMITE_RETIRO = new Date('2026-10-10T23:59:00');

// Datos mock de cronograma (S4)
const CRONOGRAMA_MOCK = {
  CQ_2026_0147: {
    fase: 'Primera Eliminatoria',
    fecha: '2026-10-15',
    hora: '10:00',
    sede: 'Sede Central',
    auditorio: 'Auditorio Principal',
    orden: 1,
    jurados: ['Dra. B. Morales', 'Dr. L. Paredes', 'Mg. A. Torres'],
    estado: 'Programado'
  }
};

/* ============================================================
   INICIALIZACIÓN
   ============================================================ */
document.addEventListener('DOMContentLoaded', function() {
  initPortalRepresentante();
});

function initPortalRepresentante() {
  try {
    const fGuardada = localStorage.getItem('concurso_cuartetos_ficha');
    if (fGuardada) {
      const parsed = JSON.parse(fGuardada);
      if (parsed.codigo) {
        Object.assign(Store.ficha, parsed);
        // Asegurar que para visualizar el cronograma esté validada si ya completó inscripción
        if (Store.ficha.estado === 'preinscripcion') {
          Store.ficha.estado = 'validado';
        }
      }
    }
  } catch(e) {}

  // Actualizar header con código de ficha
  const codigo = Store.ficha.codigo || 'CQ-2026-0147';
  const nombre = Store.ficha.nombre || 'Harmonia String Quartet';
  $('headerCodigo').textContent = `${codigo} · ${nombre}`;

  // Event listeners para tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const tab = this.dataset.tab;
      switchTab(tab);
    });
  });

  // Event listener para volver al inicio
  $('btnVolverInicio').addEventListener('click', () => {
    if(confirm('¿Volver al inicio del sistema?')) {
      window.location.href = 'index.html';
    }
  });

  // Renderizar tab inicial
  switchTab('ficha');
}

/* ============================================================
   NAVEGACIÓN POR TABS
   ============================================================ */
function switchTab(tab) {
  // Actualizar botones activos
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });

  // Renderizar contenido según tab
  const content = $('repContent');
  
  switch(tab) {
    case 'ficha':
      content.innerHTML = renderFichaRepresentante();
      break;
    case 'cronograma':
      content.innerHTML = renderCronograma();
      break;
    case 'citacion':
      content.innerHTML = renderCitacion();
      break;
    case 'retiro':
      content.innerHTML = renderRetiro();
      break;
  }

  // Asignar event listeners a botones dinámicos
  asignarEventListenersDinamicos(tab);
}

/* ============================================================
   TAB: MI FICHA (S2 + S3)
   ============================================================ */
function renderFichaRepresentante() {
  const f = Store.ficha;
  const estado = f.estado;
  
  const estados = {
    preinscripcion: {
      icon: '',
      titulo: 'Preinscripción Completa',
      desc: 'Tu ficha ha sido recibida. Recibirás una notificación cuando sea evaluada.',
      clase: 'preinscripcion',
      acciones: ''
    },
    observado: {
      icon: '⚠️',
      titulo: 'Ficha Observada',
      desc: `Motivo: ${f.motivo || 'El integrante 2 no registra matrícula activa'}`,
      clase: 'observado',
      acciones: `
        <div class="card" style="margin-top:20px">
          <h3>Campos habilitados para edición</h3>
          <div class="form-row">
            <label>Nuevo DNI del integrante 2</label>
            <input type="text" id="editDNI" placeholder="8 dígitos">
          </div>
          <div class="form-row">
            <label>Correo institucional actualizado</label>
            <input type="email" id="editCorreo" placeholder="alumno@conservatorio.edu.pe">
          </div>
          <div class="actions">
            <button class="btn btn-secondary" onclick="switchTab('ficha')">Cancelar</button>
            <button class="btn btn-primary" id="btnReenviarFicha">📤 Reenviar ficha</button>
          </div>
        </div>
      `
    },
    validado: {
      icon: '✅',
      titulo: 'Ficha Validada',
      desc: 'No puedes modificar los datos. Espera la citación oficial.',
      clase: 'validado',
      acciones: `
        <div class="alert alert-info" style="margin-top:20px">
          <div>
            <strong>[LOCK] Campos bloqueados · Sin botón de edición (RNF-13)</strong>
            Tu ficha está completa y validada. Serás citado oficialmente en las próximas horas.
          </div>
        </div>
        <div class="actions" style="margin-top:20px">
          <button class="btn btn-primary" onclick="switchTab('citacion')"> Ver mi citación</button>
        </div>
      `
    },
    rechazado: {
      icon: '❌',
      titulo: 'Ficha Rechazada',
      desc: `Motivo: ${f.motivo || 'Documentación incompleta'}`,
      clase: 'rechazado',
      acciones: `
        <div class="alert alert-danger" style="margin-top:20px">
          <div>
            <strong>No es posible reenviar esta ficha.</strong>
            Contacta a administración para más información.
          </div>
        </div>
        <div class="actions" style="margin-top:20px">
          <button class="btn btn-secondary" onclick="window.location.href='index.html'">Volver al inicio</button>
        </div>
      `
    },
    retirado: {
      icon: '🚪',
      titulo: 'Inscripción Retirada',
      desc: `Motivo: ${f.motivo || 'Cruce de horarios con exámenes finales'}`,
      clase: 'retirado',
      acciones: `
        <div class="alert alert-danger" style="margin-top:20px">
          <div>
            <strong>El cuarteto ha sido excluido del concurso.</strong>
            Se notificó al representante, integrantes y profesor.
          </div>
        </div>
        <div class="actions" style="margin-top:20px">
          <button class="btn btn-secondary" onclick="window.location.href='index.html'">Volver al inicio</button>
        </div>
      `
    }
  };

  const e = estados[estado];

  return `
    <div class="estado-banner ${e.clase}">
      <div class="estado-icon">${e.icon}</div>
      <div class="estado-info">
        <h3>${e.titulo}</h3>
        <p>${e.desc}</p>
      </div>
    </div>

    <div class="card">
      <h2>Detalles de la Ficha</h2>
      <div class="ficha-grid">
        <div class="ficha-item">
          <div class="label">Código</div>
          <div class="value">${f.codigo || 'CQ-2026-0147'}</div>
        </div>
        <div class="ficha-item">
          <div class="label">Cuarteto</div>
          <div class="value">${f.nombre || 'Harmonia String Quartet'}</div>
        </div>
        <div class="ficha-item">
          <div class="label">Integrantes</div>
          <div class="value">${f.integrantes.length || 4} · Plantilla 2Vn · 1Va · 1Vc</div>
        </div>
        <div class="ficha-item">
          <div class="label">Profesor</div>
          <div class="value">${f.profesor?.nombre || 'Dra. Beatriz Morales'}</div>
        </div>
        <div class="ficha-item">
          <div class="label">Obra Obligatoria</div>
          <div class="value">${f.repertorio.obligatoria?.titulo || 'Cuarteto en Fa Mayor'}</div>
        </div>
        <div class="ficha-item">
          <div class="label">Obra Libre</div>
          <div class="value">${f.repertorio.libre?.titulo || 'Cuarteto No. 2'}</div>
        </div>
      </div>
    </div>

    ${e.acciones}
  `;
}

/* ============================================================
   TAB: MI CRONOGRAMA (S4)
   ============================================================ */
function renderCronograma() {
  const f = Store.ficha;
  const codigo = f.codigo || 'CQ-2026-0147';
  const cronograma = getCronogramaData(codigo, f.nombre);

  if(f.estado === 'rechazado' || f.estado === 'retirado') {
    return `
      <div class="estado-banner rechazado">
        <div class="estado-icon">🚫</div>
        <div class="estado-info">
          <h3>Sin cronograma disponible</h3>
          <p>Tu ficha está ${f.estado}. No tienes turno programado.</p>
        </div>
      </div>
    `;
  }

  if(f.estado !== 'validado') {
    return `
      <div class="estado-banner preinscripcion">
        <div class="estado-icon">⏳</div>
        <div class="estado-info">
          <h3>Cronograma no disponible</h3>
          <p>Tu ficha está en estado "${f.estado}". El cronograma se habilitará cuando sea validada.</p>
        </div>
      </div>
    `;
  }

  const fecha = new Date(cronograma.fecha);
  const fechaFormateada = fecha.toLocaleDateString('es-PE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
    <div class="card">
      <h2>Mi Cronograma de Presentación</h2>
      <p class="subtitle">${cronograma.fase} · ${cronograma.estado}</p>

      <div class="cronograma-timeline">
        <div class="timeline-item completado">
          <div class="time">Ficha Validada</div>
          <div class="title">✅ Inscripción completada</div>
          <div class="details">Tu ficha fue validada por administración</div>
        </div>

        <div class="timeline-item completado">
          <div class="time">Turno Programado</div>
          <div class="title"> ${fechaFormateada}</div>
          <div class="details">
            <strong>Hora:</strong> ${cronograma.hora}<br>
            <strong>Sede:</strong> ${cronograma.sede}<br>
            <strong>Auditorio:</strong> ${cronograma.auditorio}<br>
            <strong>Orden:</strong> ${cronograma.orden}° en presentar
          </div>
        </div>

        <div class="timeline-item pendiente">
          <div class="time">Día del Concurso</div>
          <div class="title">🎻 Presentación del Cuarteto</div>
          <div class="details">
            Presentarse 15 minutos antes con los 4 integrantes y partituras
          </div>
        </div>
      </div>

      <div class="actions" style="margin-top:24px">
        <button class="btn btn-primary" onclick="switchTab('citacion')"> Ver citación oficial</button>
      </div>
    </div>
  `;
}

/* ============================================================
   TAB: MI CITACIÓN OFICIAL (S4 · RNF-16)
   ============================================================ */
function renderCitacion() {
  const f = Store.ficha;
  const codigo = f.codigo || 'CQ-2026-0147';
  const cronograma = getCronogramaData(codigo, f.nombre);

  if(f.estado !== 'validado') {
    return `
      <div class="estado-banner preinscripcion">
        <div class="estado-icon">🔒</div>
        <div class="estado-info">
          <h3>Citación no disponible</h3>
          <p>La citación oficial se genera solo cuando tu ficha está validada.</p>
        </div>
      </div>
    `;
  }

  const fecha = new Date(cronograma.fecha);
  const fechaFormateada = fecha.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return `
    <div class="citacion-card">
      <div class="citacion-header">
        <h2>CITACIÓN OFICIAL</h2>
        <div class="codigo">${codigo}</div>
      </div>

      <div class="citacion-grid">
        <div class="citacion-item">
          <div class="label"> Fecha</div>
          <div class="value">${fechaFormateada}</div>
        </div>
        <div class="citacion-item">
          <div class="label">🕐 Hora</div>
          <div class="value">${cronograma.hora}</div>
        </div>
        <div class="citacion-item">
          <div class="label">📍 Sede</div>
          <div class="value">${cronograma.sede}</div>
        </div>
        <div class="citacion-item">
          <div class="label">🎭 Auditorio</div>
          <div class="value">${cronograma.auditorio}</div>
        </div>
        <div class="citacion-item">
          <div class="label">🔢 Orden</div>
          <div class="value">${cronograma.orden}°</div>
        </div>
        <div class="citacion-item">
          <div class="label">🎼 Obras</div>
          <div class="value" style="font-size:14px">
            ${f.repertorio.obligatoria?.compositor || 'Ravel'} + 
            ${f.repertorio.libre?.compositor || 'Borodin'}
          </div>
        </div>
      </div>

      <div class="citacion-footer">
        <strong>⚠️ Presentarse 15 minutos antes con los 4 integrantes</strong><br>
        <small>Terna de jurados: ${cronograma.jurados.join(' · ')}</small>
      </div>
    </div>

    <div class="card" style="margin-top:20px">
      <h3>Información importante</h3>
      <ul style="margin-top:12px; padding-left:20px; line-height:1.8">
        <li>Traer partituras de ambas obras</li>
        <li>Todos los integrantes deben presentarse con DNI</li>
        <li>No se permiten cambios de repertorio el día del concurso</li>
        <li>El incumplimiento del horario resulta en descalificación</li>
      </ul>
    </div>
  `;
}

/* ============================================================
   TAB: RETIRO VOLUNTARIO (S3 · HU-09 · RNF-14)
   ============================================================ */
function renderRetiro() {
  const f = Store.ficha;
  const fechaActual = new Date();
  const dentroPlazo = fechaActual <= FECHA_LIMITE_RETIRO;

  // Si ya está retirado
  if(f.estado === 'retirado') {
    return `
      <div class="estado-banner retirado">
        <div class="estado-icon"></div>
        <div class="estado-info">
          <h3>Inscripción Retirada</h3>
          <p>Motivo: ${f.motivo || 'No especificado'}</p>
        </div>
      </div>
      <div class="actions">
        <button class="btn btn-secondary" onclick="window.location.href='index.html'">Volver al inicio</button>
      </div>
    `;
  }

  // Si está rechazado o validado, no puede retirarse
  if(f.estado === 'rechazado' || f.estado === 'validado') {
    return `
      <div class="estado-banner ${f.estado === 'rechazado' ? 'rechazado' : 'validado'}">
        <div class="estado-icon">${f.estado === 'rechazado' ? '❌' : '✅'}</div>
        <div class="estado-info">
          <h3>Retiro no disponible</h3>
          <p>Tu ficha está ${f.estado}. ${f.estado === 'validado' ? 'Contacta a administración.' : 'El proceso ha finalizado.'}</p>
        </div>
      </div>
    `;
  }

  // Si está fuera de plazo (RNF-14)
  if(!dentroPlazo) {
    return `
      <div class="estado-banner observado">
        <div class="estado-icon">⏰</div>
        <div class="estado-info">
          <h3>Plazo de retiro vencido</h3>
          <p>El periodo de modificaciones ha finalizado.</p>
        </div>
      </div>

      <div class="card">
        <div class="plazo-info" style="background:var(--danger-soft)">
          <div>
            <strong style="color:var(--danger)">Fecha límite vencida:</strong><br>
            <span class="fecha-limite" style="color:var(--danger)">10/10/2026 23:59</span>
          </div>
          <div class="fecha-actual">
            Fecha actual: ${fechaActual.toLocaleDateString('es-PE')}
          </div>
        </div>

        <div class="alert alert-danger">
          <div>
            <strong>RNF-14: Deshabilitación automática</strong>
            El sistema bloqueó automáticamente la opción de retiro al vencer el plazo.
          </div>
        </div>

        <div class="actions">
          <button class="btn btn-secondary" onclick="switchTab('ficha')">Volver a mi ficha</button>
        </div>
      </div>
    `;
  }

  // Dentro del plazo: mostrar formulario
  return `
    <div class="card">
      <h2>Solicitar Retiro Voluntario</h2>
      <p class="subtitle">HU-09 · RF-23/24 · RNF-14</p>

      <div class="plazo-info">
        <div>
          <strong>Fecha límite:</strong><br>
          <span class="fecha-limite">10/10/2026 23:59</span>
        </div>
        <div class="fecha-actual">
          Fecha actual: ${fechaActual.toLocaleDateString('es-PE')}
        </div>
      </div>

      <div class="retiro-warning">
        <h3>⚠️ Acción irreversible</h3>
        <p>Al confirmar el retiro:</p>
        <ul style="margin-top:8px; padding-left:20px">
          <li>El estado cambiará a <strong>"Retirado"</strong></li>
          <li>Se notificará al representante, integrantes y profesor (RF-24)</li>
          <li>El cuarteto será excluido del concurso</li>
          <li>No podrás revertir esta acción</li>
        </ul>
      </div>

      <div class="retiro-form">
        <div class="form-row">
          <label>Motivo del retiro <span class="req">*</span></label>
          <textarea id="motivoRetiro" rows="4" placeholder="Ej: Cruce de horarios con exámenes finales..."></textarea>
          <div class="hint">Este motivo será registrado y notificado a todas las partes</div>
        </div>

        <div class="actions">
          <button class="btn btn-secondary" onclick="switchTab('ficha')">Cancelar</button>
          <button class="btn btn-danger" id="btnConfirmarRetiro">Confirmar retiro</button>
        </div>
      </div>
    </div>
  `;
}

/* ============================================================
   EVENT LISTeners DINÁMICOS
   ============================================================ */
function asignarEventListenersDinamicos(tab) {
  if(tab === 'ficha') {
    const btnReenviar = $('btnReenviarFicha');
    if(btnReenviar) {
      btnReenviar.addEventListener('click', () => {
        const dni = $('editDNI')?.value.trim();
        const correo = $('editCorreo')?.value.trim();

        if(!dni || !correo) {
          alert('⚠️ Completa todos los campos obligatorios');
          return;
        }

        if(!/^\d{8}$/.test(dni)) {
          alert('⚠️ El DNI debe tener 8 dígitos');
          return;
        }

        if(!correo.endsWith('@conservatorio.edu.pe')) {
          alert('⚠️ El correo debe ser institucional (@conservatorio.edu.pe)');
          return;
        }

        // Actualizar Store
        Store.ficha.estado = 'preinscripcion';
        Store.ficha.historial.push({
          t: hoy(),
          a: 'Ficha reenviada para nueva evaluación administrativa (RF-22)'
        });

        alert('✅ Ficha reenviada correctamente\n\nRecibirás una nueva notificación cuando sea revisada.');
        switchTab('ficha');
      });
    }
  }

  if(tab === 'retiro') {
    const btnConfirmar = $('btnConfirmarRetiro');
    if(btnConfirmar) {
      btnConfirmar.addEventListener('click', () => {
        const motivo = $('motivoRetiro')?.value.trim();

        if(!motivo) {
          alert(' El motivo es obligatorio (RF-23)');
          return;
        }

        if(!confirm('¿Confirmas el retiro voluntario?\n\nEsta acción es irreversible.')) {
          return;
        }

        // Actualizar Store
        Store.ficha.motivo = motivo;
        Store.ficha.estado = 'retirado';
        Store.ficha.historial.push({
          t: hoy(),
          a: `Retiro voluntario confirmado · Motivo: ${motivo}`
        });

        alert(' Retiro confirmado\n\nSe notificó al representante, integrantes y profesor (RF-24)');
        switchTab('retiro');
      });
    }
  }
}