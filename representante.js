/* ============================================================
   PORTAL DEL REPRESENTANTE (S2 + S3 + S4)
   Incluye: Mi Ficha, Mi Cronograma, Mi Citación, Retiro y Buzón de Observaciones
   ============================================================ */

const STORAGE_KEY_OBSERVACIONES = 'concurso_observaciones_sistema';

// Fecha límite de retiro (RNF-14)
const FECHA_LIMITE_RETIRO = new Date('2026-10-10T23:59:00');

/* ============================================================
   CONSULTA DE PROGRAMACIÓN OFICIAL EN S4
   Si el cuarteto NO ha elegido auditorio en S4, retorna estrictamente NULL
   ============================================================ */
function getCronogramaData(codigo, nombre) {
  try {
    const progsGuardadas = localStorage.getItem('concurso_cuartetos_s4_programaciones');
    if (progsGuardadas) {
      const progs = JSON.parse(progsGuardadas);
      const match = progs.find(p => 
        (codigo && p.codigoCuarteto === codigo) || 
        (nombre && p.cuartetoNombre && p.cuartetoNombre.toLowerCase().trim() === nombre.toLowerCase().trim())
      );
      if (match) {
        return {
          id: match.id,
          fase: match.fase,
          fecha: match.fecha,
          hora: match.hora,
          sede: match.sede,
          auditorio: match.auditorioNombre,
          orden: match.orden,
          jurados: match.terna,
          estado: match.estado,
          obras: match.obras
        };
      }
    }
  } catch(e) {}
  return null; // NINGUNA preasignación: si no ha sido programado en S4, es estrictamente NULL
}

/* ============================================================
   INICIALIZACIÓN DEL PORTAL
   ============================================================ */
document.addEventListener('DOMContentLoaded', function() {
  initPortalRepresentante();
  configurarBuzonObservaciones();
});

function initPortalRepresentante() {
  try {
    const fGuardada = localStorage.getItem('concurso_cuartetos_ficha');
    if (fGuardada) {
      const parsed = JSON.parse(fGuardada);
      if (parsed.codigo) {
        Object.assign(Store.ficha, parsed);
        // Si completó su inscripción, se considera validada para avanzar a programación
        if (Store.ficha.estado === 'preinscripcion') {
          Store.ficha.estado = 'validado';
        }
      }
    }
  } catch(e) {}

  // Actualizar header con código y nombre del cuarteto
  const codigo = Store.ficha.codigo || 'CQ-2026-0147';
  const nombre = Store.ficha.nombre || 'Harmonia String Quartet';
  $('headerCodigo').textContent = `${codigo} · ${nombre}`;

  // Event listeners para tabs de navegación
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const tab = this.dataset.tab;
      switchTab(tab);
    });
  });

  // Volver al inicio / S2
  $('btnVolverInicio')?.addEventListener('click', () => {
    if(confirm('¿Volver a la pantalla de inscripción de cuartetos (S2)?')) {
      window.location.href = 'index.html';
    }
  });

  // Renderizar tab inicial (ficha)
  switchTab('ficha');
}

/* ============================================================
   NAVEGACIÓN POR TABS
   ============================================================ */
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });

  const content = $('repContent');
  if(!content) return;

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

  asignarEventListenersDinamicos(tab);
}

/* ============================================================
   TAB: MI FICHA (S2 + S3)
   ============================================================ */
function renderFichaRepresentante() {
  const f = Store.ficha;
  const codigo = f.codigo || 'CQ-2026-0147';
  const nombre = f.nombre || 'Harmonia String Quartet';
  const estado = f.estado || 'validado';

  // Consultar si ya tiene auditorio programado en S4
  const cronograma = getCronogramaData(codigo, nombre);

  const estados = {
    preinscripcion: {
      icon: '📋',
      titulo: 'Preinscripción Completa',
      desc: 'Tu ficha ha sido recibida. Puedes proceder a seleccionar tu auditorio en el Cronograma.',
      clase: 'preinscripcion',
      acciones: `
        <div class="actions" style="margin-top:20px">
          <a href="cronograma.html" class="btn btn-primary">📅 Ir a Cronograma y Elegir Auditorio →</a>
        </div>
      `
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
            <input type="email" id="editCorreo" placeholder="alumno@cons.pe">
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
      desc: 'No puedes modificar los datos generales de integrantes (RNF-13).',
      clase: 'validado',
      acciones: cronograma ? `
        <div class="alert alert-success" style="margin-top:20px">
          <div>
            <strong>✅ Turno confirmado en ${cronograma.auditorio}</strong><br>
            Presentación oficial programada para el <strong>${cronograma.fecha} a las ${cronograma.hora}</strong> (Orden #${cronograma.orden}° en escena).
          </div>
        </div>
        <div class="actions" style="margin-top:20px">
          <button class="btn btn-primary" onclick="switchTab('citacion')">📜 Ver Turno de Presentación</button>
          <button class="btn btn-secondary" onclick="switchTab('cronograma')">📅 Ver cronograma</button>
          <a href="cronograma.html" class="btn btn-ghost" style="text-decoration:none;">🏛️ Cronograma General</a>
        </div>
      ` : `
        <div class="alert alert-info" style="margin-top:20px">
          <div>
            <strong>✅ Ficha validada · Siguiente paso: Elegir Auditorio y Turno</strong><br>
            Aún no has seleccionado una sala ni horario. Dirígete a <strong>Cronograma y Asignación de Auditorios</strong> para reservar tu turno disponible.
          </div>
        </div>
        <div class="actions" style="margin-top:20px">
          <a href="cronograma.html" class="btn btn-primary" style="text-decoration:none;">📅 Ir a Cronograma y Elegir Auditorio →</a>
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
            <strong>No es posible reenviar esta ficha.</strong> Contacta a administración para más información.
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
            <strong>El cuarteto ha sido excluido del concurso.</strong> Se notificó al representante, integrantes y profesor.
          </div>
        </div>
        <div class="actions" style="margin-top:20px">
          <button class="btn btn-secondary" onclick="window.location.href='index.html'">Volver al inicio</button>
        </div>
      `
    }
  };

  const e = estados[estado] || estados.validado;

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
          <div class="value">${codigo}</div>
        </div>
        <div class="ficha-item">
          <div class="label">Cuarteto</div>
          <div class="value">${nombre}</div>
        </div>
        <div class="ficha-item">
          <div class="label">Integrantes</div>
          <div class="value">${f.integrantes?.length || 4} · Plantilla 2Vn · 1Va · 1Vc</div>
        </div>
        <div class="ficha-item">
          <div class="label">Profesor Responsable</div>
          <div class="value">${f.profesor?.nombre || 'Dra. Beatriz Morales'}</div>
        </div>
        <div class="ficha-item">
          <div class="label">Obra Obligatoria</div>
          <div class="value">${f.repertorio?.obligatoria?.titulo || 'Cuarteto en Fa Mayor (Ravel)'}</div>
        </div>
        <div class="ficha-item">
          <div class="label">Obra Libre</div>
          <div class="value">${f.repertorio?.libre?.titulo || 'Cuarteto No. 2 (Borodin)'}</div>
        </div>

        <!-- Apartado dinámico de Auditorio Asignado -->
        <div class="ficha-item" style="grid-column: 1 / -1; ${cronograma ? 'border: 1.5px solid #86efac; background: #f0fdf4;' : 'border: 1.5px dashed var(--warn); background: var(--warn-soft);'}">
          <div class="label" style="font-weight:700; ${cronograma ? 'color:#15803d;' : 'color:var(--warn);'}">
            Auditorio y Horario Oficial de Presentación
          </div>
          <div class="value" style="font-size:14px; margin-top:4px;">
            ${cronograma ? `
              🏛️ <strong>${cronograma.auditorio}</strong> (ÚNICO) · 📅 <strong>${cronograma.fecha}</strong> a las <strong>${cronograma.hora}</strong> · Turno #${cronograma.orden}°
            ` : `
              ⏳ <em>Pendiente de selección</em> — No se ha escogido auditorio aún.
              <a href="cronograma.html" style="color:var(--primary); font-weight:700; text-decoration:underline; margin-left:8px;">
                Elegir Auditorio en Cronograma →
              </a>
            `}
          </div>
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
  const nombre = f.nombre || 'Harmonia String Quartet';
  const cronograma = getCronogramaData(codigo, nombre);

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

  // Si aún NO ha seleccionado auditorio en S4
  if(!cronograma) {
    return `
      <div class="card">
        <h2>Mi Cronograma de Presentación</h2>
        <p class="subtitle">Pendiente de Selección de Auditorio</p>

        <div class="alert alert-warn" style="margin-top:16px;">
          <div>
            <strong>⏳ Aún no has seleccionado tu auditorio ni horario de presentación</strong><br>
            Tu ficha se encuentra validada para el concurso. Para que tu turno quede registrado oficialmente en el sistema, debes dirigirte al módulo de <strong>Cronograma y Asignación de Auditorios</strong>.
          </div>
        </div>

        <div style="background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 12px; padding: 36px 20px; text-align: center; margin-top: 24px;">
          <div style="font-size: 48px; margin-bottom: 12px;">🏛️</div>
          <h3 style="font-size: 20px; color: var(--ink); margin-bottom: 8px;">Elige tu sala y bloque de horario</h3>
          <p style="color: var(--muted); font-size: 14px; max-width: 540px; margin: 0 auto 24px; line-height: 1.6;">
            Disponibilidad en tiempo real para <strong>Auditorio Principal</strong>, <strong>Auditorio B</strong>, <strong>Auditorio C</strong> y <strong>Sala de Cámara</strong>.<br>
            Al confirmar tu horario libre, el auditorio quedará guardado para tu cuarteto y se reflejará aquí al instante.
          </p>
          <a href="cronograma.html" class="btn btn-primary" style="font-size: 15px; padding: 12px 28px; text-decoration: none;">
            👉 Ir a Cronograma y Elegir Auditorio
          </a>
        </div>
      </div>
    `;
  }

  // Si YA tiene turno programado
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
          <div class="details">Tu ficha fue aprobada y validada para participar.</div>
        </div>

        <div class="timeline-item completado">
          <div class="time">Turno Oficial Programado</div>
          <div class="title">📅 ${fechaFormateada} a las ${cronograma.hora}</div>
          <div class="details">
            <strong>Sede:</strong> ${cronograma.sede}<br>
            <strong>Auditorio Asignado:</strong> ${cronograma.auditorio} (ÚNICO)<br>
            <strong>Orden de Presentación:</strong> ${cronograma.orden}° en escena<br>
            <strong>Terna de Jurados Evaluadores:</strong> ${cronograma.jurados?.join(' · ') || 'Terna Oficial'}
          </div>
        </div>

        <div class="timeline-item pendiente">
          <div class="time">Día de la Presentación</div>
          <div class="title">🎻 Interpretación de Obras Obligatoria y Libre</div>
          <div class="details">
            Presentarse 15 minutos antes con los 4 integrantes debidamente acreditados con DNI.
          </div>
        </div>
      </div>

      <div class="actions" style="margin-top:24px">
        <button class="btn btn-primary" onclick="switchTab('citacion')">📜 Ver Turno de Presentación</button>
        <a href="cronograma.html" class="btn btn-secondary" style="text-decoration:none;">🔄 Reprogramar en Cronograma</a>
      </div>
    </div>
  `;
}

/* ============================================================
   TAB: MI Turno de Presentación (S4 · RNF-16)
   ============================================================ */
function renderCitacion() {
  const f = Store.ficha;
  const codigo = f.codigo || 'CQ-2026-0147';
  const nombre = f.nombre || 'Harmonia String Quartet';
  const cronograma = getCronogramaData(codigo, nombre);

  if(!cronograma) {
    return `
      <div class="card">
        <h2>Mi Turno de Presentación</h2>
        <div class="alert alert-info" style="margin-top:16px;">
          <div>
            <strong>📜 Turno de Presentación no disponible aún</strong><br>
            Tu citación con orden de turno, terna de jurados y horario exacto se generará automáticamente en cuanto reserves tu auditorio en el <strong>Cronograma</strong>.
          </div>
        </div>
        <div style="text-align: center; margin: 32px 0;">
          <a href="cronograma.html" class="btn btn-primary" style="font-size:15px; padding:12px 24px; text-decoration:none;">
            📅 Elegir Auditorio en el Cronograma
          </a>
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
        <h2>Turno de Presentación</h2>
        <div class="codigo">${codigo}</div>
        <div style="font-size:22px; font-weight:800; margin-top:8px;">${nombre}</div>
      </div>

      <div class="citacion-grid">
        <div class="citacion-item">
          <div class="label">📅 Fecha</div>
          <div class="value">${fechaFormateada}</div>
        </div>
        <div class="citacion-item">
          <div class="label">⏰ Hora</div>
          <div class="value">${cronograma.hora}</div>
        </div>
        <div class="citacion-item">
          <div class="label">📍 Sede</div>
          <div class="value">${cronograma.sede}</div>
        </div>
        <div class="citacion-item" style="border: 2px solid #93c5fd; background: rgba(59, 130, 246, 0.3);">
          <div class="label">🎭 Auditorio Asignado</div>
          <div class="value" style="color: #fef08a;">${cronograma.auditorio} (ÚNICO)</div>
        </div>
        <div class="citacion-item">
          <div class="label">🔢 Orden de Turno</div>
          <div class="value">${cronograma.orden}°</div>
        </div>
        <div class="citacion-item">
          <div class="label">🎼 Obras a Interpretar</div>
          <div class="value" style="font-size:13px">
            ${f.repertorio?.obligatoria?.titulo || 'Ravel (Obligatoria)'} + ${f.repertorio?.libre?.titulo || 'Borodin (Libre)'}
          </div>
        </div>
      </div>

      <div class="citacion-footer">
        <strong>⚠️ Presentarse 15 minutos antes con los 4 integrantes y cédulas de identidad</strong><br>
        <small style="opacity:0.9;">Terna de Jurados Evaluadores (RF-33): ${cronograma.jurados?.join(' · ') || 'Terna Oficial'}</small>
      </div>
    </div>

    <div class="card" style="margin-top:20px">
      <h3>Instrucciones para el Día del Concurso</h3>
      <ul style="margin-top:12px; padding-left:20px; line-height:1.8; font-size:14px; color:var(--ink);">
        <li>Presentar partituras originales para la terna de jurados evaluadores.</li>
        <li>Los 4 integrantes deben estar presentes 15 minutos antes del turno indicado.</li>
        <li>No se admiten cambios de auditorio o de repertorio el día de la presentación oficial.</li>
        <li>La calificación emitida por la terna es inmutable y firmada digitalmente (RF-38 / RNF-21).</li>
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

  if(f.estado === 'retirado') {
    return `
      <div class="estado-banner retirado">
        <div class="estado-icon">🚪</div>
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

  if(f.estado === 'rechazado') {
    return `
      <div class="estado-banner rechazado">
        <div class="estado-icon">❌</div>
        <div class="estado-info">
          <h3>Retiro no disponible</h3>
          <p>Tu ficha está rechazada. El proceso ha finalizado.</p>
        </div>
      </div>
    `;
  }

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
            <strong>RNF-14: Deshabilitación automática</strong><br>
            El sistema bloqueó automáticamente la opción de retiro al vencer el plazo reglamentario.
          </div>
        </div>

        <div class="actions">
          <button class="btn btn-secondary" onclick="switchTab('ficha')">Volver a mi ficha</button>
        </div>
      </div>
    `;
  }

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
          <li>Se notificará al representante, integrantes y profesor responsable (RF-24)</li>
          <li>El cuarteto será excluido del concurso</li>
        </ul>
      </div>

      <div class="retiro-form">
        <div class="form-row">
          <label>Motivo del retiro <span class="req">*</span></label>
          <textarea id="motivoRetiro" rows="4" placeholder="Ej: Cruce de horarios con exámenes finales..."></textarea>
          <div class="hint">Este motivo será registrado y notificado a todas las partes.</div>
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
   EVENT LISTENERS DINÁMICOS
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

        Store.ficha.estado = 'preinscripcion';
        Store.ficha.historial.push({
          t: hoy(),
          a: 'Ficha reenviada para nueva evaluación administrativa (RF-22)'
        });

        alert('✅ Ficha reenviada correctamente. Recibirás una nueva notificación.');
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
          alert('⚠️ El motivo es obligatorio (RF-23)');
          return;
        }

        if(!confirm('¿Confirmas el retiro voluntario? Esta acción es irreversible.')) return;
        Store.ficha.motivo = motivo;
        Store.ficha.estado = 'retirado';
        Store.ficha.historial.push({
          t: hoy(),
          a: `Retiro voluntario confirmado · Motivo: ${motivo}`
        });

        alert('🚪 Retiro confirmado. Se notificó al representante, integrantes y profesor (RF-24)');
        switchTab('retiro');
      });
    }
  }
}

/* ============================================================
   BUZÓN DE OBSERVACIONES Y SUGERENCIAS SOBRE EL SISTEMA
   ============================================================ */
function configurarBuzonObservaciones() {
  const modal = $('modalObservacionSistema');
  const btnAbrirBanner = $('btnAbrirModalFeedback');
  const btnAbrirTop = $('btnTopObservacion');
  const btnCerrar = $('btnCerrarModalFeedback');
  const btnCancelar = $('btnCancelarFeedback');
  const form = $('formObservacionSistema');

  const abrirModal = () => {
    if(!modal) return;
    const codigo = Store.ficha.codigo || 'CQ-2026-0147';
    const nombre = Store.ficha.nombre || 'Harmonia String Quartet';
    const inputCuarteto = $('obsCuarteto');
    if(inputCuarteto) inputCuarteto.value = `${nombre} (${codigo})`;

    renderHistorialObservaciones();
    modal.style.display = 'flex';
  };

  const cerrarModal = () => {
    if(modal) modal.style.display = 'none';
  };

  btnAbrirBanner?.addEventListener('click', abrirModal);
  btnAbrirTop?.addEventListener('click', abrirModal);
  btnCerrar?.addEventListener('click', cerrarModal);
  btnCancelar?.addEventListener('click', cerrarModal);

  window.addEventListener('keydown', (e) => {
    if(e.key === 'Escape') cerrarModal();
  });

  form?.addEventListener('submit', (e) => {
    e.preventDefault();

    const tipo = $('obsTipo')?.value;
    const asunto = $('obsAsunto')?.value.trim();
    const detalle = $('obsDetalle')?.value.trim();
    const prioridad = $('obsPrioridad')?.value;
    const cuarteto = Store.ficha.nombre || 'Harmonia String Quartet';
    const codigo = Store.ficha.codigo || 'CQ-2026-0147';

    if(!asunto || !detalle) {
      alert('⚠️ Por favor completa el asunto y el detalle de tu observación.');
      return;
    }

    const ticketId = `OBS-2026-${Math.floor(Math.random()*9000)+1000}`;
    const nuevaObs = {
      id: ticketId,
      cuarteto,
      codigo,
      tipo,
      asunto,
      detalle,
      prioridad,
      fecha: hoy(),
      estado: 'Enviada al Comité'
    };

    let observaciones = [];
    try {
      const guardadas = localStorage.getItem(STORAGE_KEY_OBSERVACIONES);
      if(guardadas) observaciones = JSON.parse(guardadas);
    } catch(err) {}

    observaciones.unshift(nuevaObs);
    localStorage.setItem(STORAGE_KEY_OBSERVACIONES, JSON.stringify(observaciones));

    alert(`✅ ¡Observación enviada correctamente!

Número de Ticket: ${ticketId}
Tipo: ${tipo}
Asunto: ${asunto}

El comité organizador ha recibido tu mensaje.`);

    // Limpiar formulario y refrescar lista
    $('obsAsunto').value = '';
    $('obsDetalle').value = '';
    renderHistorialObservaciones();
  });
}

function renderHistorialObservaciones() {
  const container = $('listaObservacionesContainer');
  const countBadge = $('obsCountBadge');
  if(!container) return;

  let observaciones = [];
  try {
    const guardadas = localStorage.getItem(STORAGE_KEY_OBSERVACIONES);
    if(guardadas) observaciones = JSON.parse(guardadas);
  } catch(e) {}

  if(countBadge) countBadge.textContent = observaciones.length;

  if(observaciones.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:16px; color:var(--muted); font-size:12px;">
        No has enviado ninguna observación aún.
      </div>
    `;
    return;
  }

  container.innerHTML = observaciones.map(obs => `
    <div class="obs-card">
      <div class="obs-card-header">
        <span class="obs-card-title">${obs.asunto}</span>
        <span class="badge badge-draft" style="font-size:10px;">${obs.id}</span>
      </div>
      <div class="obs-card-meta">
        🏷️ ${obs.tipo} · 📅 ${obs.fecha} · <span style="color:var(--primary); font-weight:600;">${obs.estado}</span>
      </div>
      <div class="obs-card-body">
        ${obs.detalle}
      </div>
    </div>
  `).join('');
}
