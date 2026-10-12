/* ============================================================
   S4 · CRONOGRAMA Y ASIGNACIÓN DE AUDITORIOS
   Flujo optimizado: Auditorio -> Fecha -> Horarios Disponibles -> Cuarteto
   Responde a: "¿Se asigna un cuarteto en diferentes auditorios?" -> NO.
   ============================================================ */

const STORAGE_KEY_PROGRAMACIONES = 'concurso_cuartetos_s4_programaciones';

/* Catálogo Oficial de Auditorios */
const AUDITORIOS_BASE = [
  {
    id: 'aud-principal',
    nombre: 'Auditorio Principal',
    sede: 'Sede Central',
    capacidad: 400,
    terna: ['Dra. B. Morales', 'Dr. L. Paredes', 'Mg. A. Torres'],
    descripcion: 'Sala principal con acústica sinfónica'
  },
  {
    id: 'aud-b',
    nombre: 'Auditorio B — Sala Beethoven',
    sede: 'Sede Central',
    capacidad: 250,
    terna: ['Dr. C. Mendoza', 'Dra. M. Salazar', 'Mg. A. Torres'],
    descripcion: 'Sala acondicionada para cuartetos y grupos de cámara'
  },
  {
    id: 'aud-c',
    nombre: 'Auditorio C — Sala Mozart',
    sede: 'Sede Norte',
    capacidad: 200,
    terna: ['Dra. B. Morales', 'Dra. M. Salazar', 'Dr. L. Paredes'],
    descripcion: 'Acústica brillante para ensambles de cuerda'
  },
  {
    id: 'aud-camara',
    nombre: 'Sala de Cámara',
    sede: 'Sede Central',
    capacidad: 120,
    terna: ['Dr. C. Mendoza', 'Dr. L. Paredes', 'Mg. A. Torres'],
    descripcion: 'Espacio íntimo para evaluación de detalle técnico'
  }
];

/* Bloques de Horarios Oficiales (Turnos de 30 min según reglamento) */
const BLOQUES_HORARIOS = [
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '12:00 PM',
  '02:00 PM',
  '02:30 PM',
  '03:00 PM',
  '03:30 PM',
  '04:00 PM'
];

/* Cuartetos Registrados / Validados en S2 y S3 */
const CUARTETOS_BASE = [
  {
    codigo: 'CQ-2026-0147',
    nombre: 'Harmonia String Quartet',
    profesor: 'Dra. Beatriz Morales',
    fase: 'Primera Eliminatoria',
    obras: 'Cuarteto en Fa Mayor (Ravel) · Cuarteto No. 2 (Borodin)',
    estadoFicha: 'Validado'
  },
  {
    codigo: 'CQ-2026-0149',
    nombre: 'Sinfonia String Quartet',
    profesor: 'Dr. Luis Paredes',
    fase: 'Primera Eliminatoria',
    obras: 'Cuarteto en Re menor (Mozart) · Cuarteto Op.18 (Beethoven)',
    estadoFicha: 'Validado'
  },
  {
    codigo: 'CQ-2026-0151',
    nombre: 'Arpeggio Quartet',
    profesor: 'Mg. Ana Torres',
    fase: 'Segunda Eliminatoria',
    obras: 'Cuarteto Op.76 No.3 (Haydn) · Cuarteto No. 2 (Borodin)',
    estadoFicha: 'Validado'
  },
  {
    codigo: 'CQ-2026-0152',
    nombre: 'Camerata Ensemble',
    profesor: 'Dra. Lucía León',
    fase: 'Primera Eliminatoria',
    obras: 'Cuarteto en Fa Mayor (Ravel) · Cuarteto en Re menor (Mozart)',
    estadoFicha: 'Validado'
  }
];

/* Programaciones Iniciales */
const PROGRAMACIONES_INICIALES = [
  {
    id: 'prog-1',
    codigoCuarteto: 'CQ-2026-0147',
    cuartetoNombre: 'Harmonia String Quartet',
    fase: 'Primera Eliminatoria',
    fecha: '2026-10-15',
    hora: '10:00 AM',
    sede: 'Sede Central',
    auditorioId: 'aud-principal',
    auditorioNombre: 'Auditorio Principal',
    orden: 1,
    terna: ['Dra. B. Morales', 'Dr. L. Paredes', 'Mg. A. Torres'],
    estado: 'Programado',
    obras: 'Cuarteto en Fa Mayor (Ravel) · Cuarteto No. 2 (Borodin)',
    trazabilidad: 'Turno programado por admin@conservatorio.edu.pe · 01/10/2026 09:30'
  },
  {
    id: 'prog-2',
    codigoCuarteto: 'CQ-2026-0151',
    cuartetoNombre: 'Arpeggio Quartet',
    fase: 'Segunda Eliminatoria',
    fecha: '2026-10-15',
    hora: '10:00 AM',
    sede: 'Sede Central',
    auditorioId: 'aud-b',
    auditorioNombre: 'Auditorio B — Sala Beethoven',
    orden: 2,
    terna: ['Dr. C. Mendoza', 'Dra. M. Salazar', 'Mg. A. Torres'],
    estado: 'Programado',
    obras: 'Cuarteto Op.76 No.3 (Haydn) · Cuarteto No. 2 (Borodin)',
    trazabilidad: 'Turno programado por admin@conservatorio.edu.pe · 01/10/2026 10:15'
  }
];

// Estado global en memoria
let programaciones = [];
let auditorios = [...AUDITORIOS_BASE];
let cuartetos = [...CUARTETOS_BASE];
let horarioSeleccionadoActual = null; // Guarda el horario seleccionado con un clic

document.addEventListener('DOMContentLoaded', () => {
  cargarDatos();
  sincronizarConS2();
  renderTodo();
  configurarEventos();
});

function cargarDatos() {
  const progsGuardadas = localStorage.getItem(STORAGE_KEY_PROGRAMACIONES);
  if (progsGuardadas) {
    try {
      programaciones = JSON.parse(progsGuardadas);
    } catch (e) {
      programaciones = [...PROGRAMACIONES_INICIALES];
    }
  } else {
    programaciones = [...PROGRAMACIONES_INICIALES];
    guardarDatos();
  }
}

function guardarDatos() {
  localStorage.setItem(STORAGE_KEY_PROGRAMACIONES, JSON.stringify(programaciones));
}

function sincronizarConS2() {
  const fichaLocal = localStorage.getItem('concurso_cuartetos_ficha');
  if (fichaLocal) {
    try {
      const f = JSON.parse(fichaLocal);
      if (f.codigo && f.nombre && !cuartetos.some(c => c.codigo === f.codigo)) {
        cuartetos.unshift({
          codigo: f.codigo,
          nombre: f.nombre,
          profesor: f.profesor ? f.profesor.nombre : 'Docente Asignado',
          fase: 'Primera Eliminatoria',
          obras: f.repertorio && f.repertorio.obligatoria ? f.repertorio.obligatoria.titulo : 'Obras reglamentarias',
          estadoFicha: f.estado === 'validado' ? 'Validado' : 'Validado (Automático)'
        });
      }
    } catch(e) {}
  }
}

/* Consultas de ocupación */
function getTurnoOcupado(auditorioId, fecha, hora) {
  return programaciones.find(p => p.auditorioId === auditorioId && p.fecha === fecha && p.hora === hora) || null;
}

function getTurnosDeAuditorioFecha(auditorioId, fecha) {
  return programaciones.filter(p => p.auditorioId === auditorioId && p.fecha === fecha);
}

function getProgramacionDeCuarteto(codigoCuarteto) {
  return programaciones.find(p => p.codigoCuarteto === codigoCuarteto) || null;
}

function getAuditorioPorId(auditorioId) {
  return auditorios.find(a => a.id === auditorioId);
}

function getCuartetoPorCodigo(codigo) {
  return cuartetos.find(c => c.codigo === codigo);
}

/* ============================================================
   RENDERIZADO GENERAL
   ============================================================ */
function renderTodo() {
  actualizarEstadisticas();
  renderAuditoriosGrid();
  inicializarSelectoresAuditorioYCuarteto();
  renderGrillaHorariosDisponibles();
  renderTablaCronograma();
  actualizarResumenTurno();
}

function actualizarEstadisticas() {
  const totalCuartetos = cuartetos.length;
  const programados = programaciones.length;
  const totalAuditorios = auditorios.length;

  document.getElementById('statTotalCuartetos').textContent = totalCuartetos;
  document.getElementById('statProgramados').textContent = `${programados}/${totalCuartetos}`;
  document.getElementById('statTotalAuditorios').textContent = totalAuditorios;
  document.getElementById('statTurnosTotales').textContent = programados;
}

/* Monitor de Auditorios */
function renderAuditoriosGrid() {
  const container = document.getElementById('auditoriosGrid');
  container.innerHTML = '';

  auditorios.forEach(aud => {
    const turnos = programaciones.filter(p => p.auditorioId === aud.id);
    const tieneTurnos = turnos.length > 0;

    const card = document.createElement('div');
    card.className = `auditorio-card ${tieneTurnos ? 'ocupado' : 'disponible'}`;

    card.innerHTML = `
      <div>
        <div class="auditorio-header">
          <div>
            <div class="auditorio-titulo">${aud.nombre}</div>
            <div class="auditorio-sede">${aud.sede} · Capacidad: ${aud.capacidad} personas</div>
          </div>
          <span class="status-badge ${tieneTurnos ? 'status-ocupado' : 'status-disponible'}">
            ${tieneTurnos ? `🔒 ${turnos.length} Turno(s)` : '🟢 Disponible'}
          </span>
        </div>

        <div class="auditorio-info">
          ${tieneTurnos ? `
            <div style="font-size:12px; margin-bottom:8px;">
              <strong>Cuarteto(s) con auditorio asignado:</strong>
              ${turnos.map(t => `
                <div class="cuarteto-ocupante" style="margin-top:4px;">
                  🎻 <strong>${t.cuartetoNombre}</strong> (${t.fecha} · ${t.hora})
                </div>
              `).join('')}
            </div>
          ` : `
            <div style="color:var(--success); font-weight:600; font-size:13px; margin: 8px 0;">
              ✨ Auditorio totalmente libre para nuevas programaciones
            </div>
          `}
          <div class="terna-jurados">
            👨‍⚖️ <strong>Terna Oficial (RF-33):</strong><br>
            ${aud.terna.join(' · ')}
          </div>
        </div>
      </div>

      <div class="auditorio-actions">
        <button class="btn btn-primary" style="font-size:12px; padding:7px 12px; width:100%;" onclick="seleccionarAuditorioDesdeTarjeta('${aud.id}')">
          👉 Ver y Escoger Horarios en este Auditorio
        </button>
      </div>
    `;

    container.appendChild(card);
  });
}

function seleccionarAuditorioDesdeTarjeta(auditorioId) {
  document.getElementById('selectAuditorio').value = auditorioId;
  actualizarInfoAuditorioSeleccionado();
  renderGrillaHorariosDisponibles();
  document.getElementById('formProgramar').scrollIntoView({ behavior: 'smooth' });
}

/* Inicializa select de auditorio y de cuarteto */
function inicializarSelectoresAuditorioYCuarteto() {
  const selectAud = document.getElementById('selectAuditorio');
  const selectCuarteto = document.getElementById('selectCuarteto');

  const audActual = selectAud.value;
  const cuartetoActual = selectCuarteto.value;

  // Llenar Auditorios
  selectAud.innerHTML = '';
  auditorios.forEach(aud => {
    const turnosCount = programaciones.filter(p => p.auditorioId === aud.id).length;
    const opt = document.createElement('option');
    opt.value = aud.id;
    opt.textContent = `${aud.nombre} (${aud.sede} · Cap. ${aud.capacidad}) ${turnosCount > 0 ? `— [${turnosCount} turno(s) asignado(s)]` : '— [Disponible]'}`;
    selectAud.appendChild(opt);
  });

  if (audActual && auditorios.some(a => a.id === audActual)) {
    selectAud.value = audActual;
  } else {
    selectAud.value = auditorios[0].id;
  }

  // Llenar Cuartetos
  selectCuarteto.innerHTML = '<option value="">-- Seleccionar Cuarteto a Programar --</option>';
  cuartetos.forEach(c => {
    const yaAsignado = getProgramacionDeCuarteto(c.codigo);
    const opt = document.createElement('option');
    opt.value = c.codigo;
    if (yaAsignado) {
      opt.textContent = `${c.nombre} (${c.codigo}) — 🔒 Ya tiene auditorio: ${yaAsignado.auditorioNombre} (${yaAsignado.hora})`;
    } else {
      opt.textContent = `${c.nombre} (${c.codigo}) — 🟢 Pendiente de Programación`;
    }
    selectCuarteto.appendChild(opt);
  });

  if (cuartetoActual) {
    selectCuarteto.value = cuartetoActual;
  }

  actualizarInfoAuditorioSeleccionado();
  actualizarEstadoCuartetoSeleccionado();
}

function actualizarInfoAuditorioSeleccionado() {
  const audId = document.getElementById('selectAuditorio').value;
  const aud = getAuditorioPorId(audId);
  const infoEl = document.getElementById('infoAuditorioSeleccionado');

  if (aud) {
    infoEl.innerHTML = `
      <div style="font-size:13px; color:var(--ink); background:#f8fafc; padding:10px 14px; border-radius:8px; border:1px solid var(--border);">
        🏛️ <strong>${aud.nombre}</strong> (${aud.sede} · Capacidad: ${aud.capacidad}) · 👨‍⚖️ <strong>Terna (RF-33):</strong> ${aud.terna.join(' · ')}
      </div>
    `;
  }
}

function actualizarEstadoCuartetoSeleccionado() {
  const codigo = document.getElementById('selectCuarteto').value;
  const alertEl = document.getElementById('alertCuartetoEstado');
  const btnProgramar = document.getElementById('btnProgramar');

  if (!codigo) {
    alertEl.style.display = 'none';
    btnProgramar.disabled = true;
    return;
  }

  const prog = getProgramacionDeCuarteto(codigo);
  if (prog) {
    alertEl.className = 'alert alert-warn';
    alertEl.style.display = 'block';
    alertEl.innerHTML = `
      <div>
        <strong>⚠️ Cuarteto con Auditorio Único ya Asignado</strong>
        El cuarteto <strong>${prog.cuartetoNombre}</strong> ya tiene asignado el <strong>${prog.auditorioNombre}</strong> el ${prog.fecha} a las ${prog.hora}.
        <br><small><strong>Regla de negocio:</strong> Un cuarteto NO puede estar en diferentes auditorios. Para cambiarlo, use <strong>"Reprogramar Turno"</strong> o libere el auditorio actual.</small>
      </div>
    `;
    btnProgramar.disabled = true;
  } else {
    alertEl.style.display = 'none';
    btnProgramar.disabled = (horarioSeleccionadoActual === null);
  }

  actualizarResumenTurno();
}

/* ============================================================
   NUEVA FUNCIONALIDAD CLAVE: GRILLA DE HORARIOS DEL AUDITORIO
   ============================================================ */
function renderGrillaHorariosDisponibles() {
  const audId = document.getElementById('selectAuditorio').value;
  const fecha = document.getElementById('inputFecha').value;
  const container = document.getElementById('slotsGrid');
  const countDisponiblesEl = document.getElementById('slotsDisponiblesCount');

  container.innerHTML = '';
  let disponiblesCount = 0;

  // Si el horario seleccionado previamente no está disponible en este nuevo auditorio/fecha, resetearlo
  if (horarioSeleccionadoActual) {
    const ocupante = getTurnoOcupado(audId, fecha, horarioSeleccionadoActual);
    if (ocupante) {
      horarioSeleccionadoActual = null;
    }
  }

  BLOQUES_HORARIOS.forEach(hora => {
    const ocupante = getTurnoOcupado(audId, fecha, hora);
    const estaOcupado = ocupante !== null;
    const esSeleccionado = (horarioSeleccionadoActual === hora);

    if (!estaOcupado) disponiblesCount++;

    const slotCard = document.createElement('div');
    slotCard.className = `slot-card ${estaOcupado ? 'ocupado' : 'disponible'} ${esSeleccionado ? 'selected' : ''}`;

    slotCard.innerHTML = `
      <div>
        <div class="slot-header">
          <span class="slot-hora">${hora}</span>
          <span class="slot-badge ${estaOcupado ? 'badge-busy' : 'badge-free'}">
            ${estaOcupado ? '🔒 Ocupado' : (esSeleccionado ? '✓ Elegido' : '🟢 Libre')}
          </span>
        </div>
        <div class="slot-detalle ${estaOcupado ? 'ocupante-nombre' : ''}">
          ${estaOcupado ? `
            Asignado a:<br>
            <strong>${ocupante.cuartetoNombre}</strong>
            <br><small style="color:#94a3b8;">${ocupante.codigoCuarteto}</small>
          ` : (esSeleccionado ? `
            <strong style="color:var(--primary);">Turno seleccionado</strong><br>
            Haz clic en otro para cambiar
          ` : `
            Horario disponible.<br>
            Haz clic para seleccionar este turno.
          `)}
        </div>
      </div>
    `;

    if (!estaOcupado) {
      slotCard.onclick = () => {
        horarioSeleccionadoActual = hora;
        renderGrillaHorariosDisponibles();
        actualizarEstadoCuartetoSeleccionado();
      };
    } else {
      slotCard.title = `Este horario ya está reservado por ${ocupante.cuartetoNombre}. No se puede seleccionar.`;
    }

    container.appendChild(slotCard);
  });

  countDisponiblesEl.textContent = `${disponiblesCount} de ${BLOQUES_HORARIOS.length} horarios libres`;
  actualizarResumenTurno();
}

function actualizarResumenTurno() {
  const audId = document.getElementById('selectAuditorio').value;
  const fecha = document.getElementById('inputFecha').value;
  const codigoCuarteto = document.getElementById('selectCuarteto').value;
  const aud = getAuditorioPorId(audId);
  const cuarteto = getCuartetoPorCodigo(codigoCuarteto);
  const resumenBox = document.getElementById('resumenTurnoBox');
  const resumenInfo = document.getElementById('resumenTurnoInfo');
  const btnProgramar = document.getElementById('btnProgramar');

  if (horarioSeleccionadoActual && aud && cuarteto && !getProgramacionDeCuarteto(codigoCuarteto)) {
    resumenBox.style.display = 'flex';
    resumenInfo.innerHTML = `
      <div>
        🎯 <strong>Turno Preparado para Guardar:</strong><br>
        Auditorio: <strong>${aud.nombre}</strong> (${aud.sede}) · Fecha: <strong>${fecha}</strong> · Hora: <strong>${horarioSeleccionadoActual}</strong><br>
        Cuarteto: <strong>${cuarteto.nombre}</strong> (${cuarteto.codigo}) · Terna: ${aud.terna.join(' · ')}
      </div>
    `;
    btnProgramar.disabled = false;
  } else {
    resumenBox.style.display = 'none';
    if (!horarioSeleccionadoActual) {
      btnProgramar.disabled = true;
    }
  }
}

/* ============================================================
   TABLA DE CRONOGRAMA
   ============================================================ */
function renderTablaCronograma() {
  const tbody = document.getElementById('cronogramaTableBody');
  tbody.innerHTML = '';

  if (programaciones.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding:30px; color:var(--muted);">
          No hay turnos programados aún. Asigne auditorios y horarios usando el formulario superior.
        </td>
      </tr>
    `;
    return;
  }

  // Ordenar cronológicamente por fecha y hora
  const ordenados = [...programaciones].sort((a,b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));

  ordenados.forEach(prog => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${prog.fecha}</strong></td>
      <td><span class="badge badge-code">${prog.hora}</span></td>
      <td>
        <strong>${prog.cuartetoNombre}</strong>
        <br><small style="color:var(--muted);">${prog.codigoCuarteto}</small>
      </td>
      <td>
        <span class="table-badge-auditorio">🏛️ ${prog.auditorioNombre}</span>
        <br><small style="color:var(--muted);">${prog.sede} · Turno #${prog.orden}</small>
      </td>
      <td>
        <small>${prog.terna.join(' · ')}</small>
      </td>
      <td>
        <span class="badge badge-ok">${prog.estado}</span>
      </td>
      <td>
        <div style="display:flex; gap:6px;">
          <button class="btn btn-secondary" style="font-size:12px; padding:4px 8px;" onclick="abrirModalCitacion('${prog.id}')">
            📜 Citación
          </button>
          <button class="btn btn-primary" style="font-size:12px; padding:4px 8px;" onclick="abrirModalReprogramar('${prog.id}')">
            🔄 Reprogramar
          </button>
          <button class="btn btn-danger" style="font-size:12px; padding:4px 8px;" onclick="confirmarLiberar('${prog.id}')">
            ❌
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

/* ============================================================
   EVENTOS Y ACCIONES
   ============================================================ */
function configurarEventos() {
  // Cambio en Auditorio -> recarga info y horarios del auditorio
  document.getElementById('selectAuditorio').addEventListener('change', () => {
    actualizarInfoAuditorioSeleccionado();
    renderGrillaHorariosDisponibles();
  });

  // Cambio en Fecha -> recarga horarios disponibles de esa fecha
  document.getElementById('inputFecha').addEventListener('change', () => {
    renderGrillaHorariosDisponibles();
  });

  // Cambio en Cuarteto
  document.getElementById('selectCuarteto').addEventListener('change', () => {
    actualizarEstadoCuartetoSeleccionado();
  });

  // Envío del formulario
  document.getElementById('formProgramar').addEventListener('submit', (e) => {
    e.preventDefault();
    ejecutarProgramacionTurno();
  });

  // Botón para simular conflicto
  document.getElementById('btnSimularConflicto').addEventListener('click', () => {
    simularConflictoAuditorio();
  });

  // Restablecer
  document.getElementById('btnRestablecer').addEventListener('click', () => {
    if (confirm('¿Restablecer los datos de cronograma y auditorios a los valores iniciales de prueba?')) {
      programaciones = [...PROGRAMACIONES_INICIALES];
      horarioSeleccionadoActual = null;
      guardarDatos();
      renderTodo();
      mostrarAlertaExito('Datos de prueba restablecidos correctamente.');
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') cerrarTodosLosModales();
  });
}

function ejecutarProgramacionTurno() {
  const codigoCuarteto = document.getElementById('selectCuarteto').value;
  const auditorioId = document.getElementById('selectAuditorio').value;
  const fecha = document.getElementById('inputFecha').value;
  const hora = horarioSeleccionadoActual;
  const fase = document.getElementById('selectFase').value;

  if (!codigoCuarteto) {
    alert('⚠️ Por favor seleccione el cuarteto a programar.');
    return;
  }
  if (!auditorioId) {
    alert('⚠️ Por favor seleccione el auditorio.');
    return;
  }
  if (!fecha) {
    alert('⚠️ Por favor seleccione la fecha de presentación.');
    return;
  }
  if (!hora) {
    alert('⚠️ Por favor seleccione un horario disponible haciendo clic en la grilla de horarios.');
    return;
  }

  const cuarteto = getCuartetoPorCodigo(codigoCuarteto);
  const auditorio = getAuditorioPorId(auditorioId);

  // VALIDACIÓN 1: ¿El cuarteto ya tiene asignado un auditorio?
  const progExistenteCuarteto = getProgramacionDeCuarteto(codigoCuarteto);
  if (progExistenteCuarteto) {
    mostrarModalError(
      'Cuarteto ya asignado a un auditorio',
      `El cuarteto <strong>${cuarteto.nombre}</strong> ya tiene asignado el <strong>${progExistenteCuarteto.auditorioNombre}</strong> el ${progExistenteCuarteto.fecha} a las ${progExistenteCuarteto.hora}.<br><br><strong>Regla de negocio:</strong> Cada cuarteto tiene un <strong>auditorio único</strong>. No se asigna un cuarteto en diferentes auditorios.`
    );
    return;
  }

  // VALIDACIÓN 2: ¿El horario en este auditorio ya está ocupado? (RNF-15)
  const ocupanteActual = getTurnoOcupado(auditorioId, fecha, hora);
  if (ocupanteActual) {
    mostrarModalConflicto(auditorio.nombre, fecha, hora, ocupanteActual.cuartetoNombre, ocupanteActual.codigoCuarteto);
    return;
  }

  // Guardado exitoso
  const nuevoTurno = {
    id: `prog-${Date.now()}`,
    codigoCuarteto: cuarteto.codigo,
    cuartetoNombre: cuarteto.nombre,
    fase: fase,
    fecha: fecha,
    hora: hora,
    sede: auditorio.sede,
    auditorioId: auditorio.id,
    auditorioNombre: auditorio.nombre,
    orden: programaciones.length + 1,
    terna: auditorio.terna,
    estado: 'Programado',
    obras: cuarteto.obras,
    trazabilidad: `Programado por admin@conservatorio.edu.pe · ${new Date().toLocaleString('es-PE')}`
  };

  programaciones.push(nuevoTurno);
  horarioSeleccionadoActual = null;
  guardarDatos();
  renderTodo();

  mostrarModalTurnoProgramado(nuevoTurno);
}

function simularConflictoAuditorio() {
  const audId = document.getElementById('selectAuditorio').value || 'aud-principal';
  const fecha = document.getElementById('inputFecha').value || '2026-10-15';
  const aud = getAuditorioPorId(audId);

  // Buscar un turno ocupado para simular el conflicto
  const ocupado = programaciones.find(p => p.auditorioId === audId && p.fecha === fecha) || programaciones[0];

  mostrarModalConflicto(
    ocupado.auditorioNombre,
    ocupado.fecha,
    ocupado.hora,
    ocupado.cuartetoNombre,
    ocupado.codigoCuarteto
  );
}

function confirmarLiberar(progId) {
  const prog = programaciones.find(p => p.id === progId);
  if (!prog) return;

  if (confirm(`¿Liberar el turno en ${prog.auditorioNombre} (${prog.fecha} · ${prog.hora}) asignado a ${prog.cuartetoNombre}?\n\nEl horario volverá a estar disponible de inmediato para que otro cuarteto lo pueda escoger.`)) {
    programaciones = programaciones.filter(p => p.id !== progId);
    guardarDatos();
    renderTodo();
    mostrarAlertaExito(`El turno en ${prog.auditorioNombre} (${prog.hora}) ha sido liberado y ya está disponible.`);
  }
}

/* ============================================================
   MODALES
   ============================================================ */
function abrirModalCitacion(progId) {
  const prog = programaciones.find(p => p.id === progId);
  if (!prog) return;

  const modal = document.getElementById('modalCitacion');
  document.getElementById('citacionCuartetoNombre').textContent = prog.cuartetoNombre;
  document.getElementById('citacionCodigo').textContent = prog.codigoCuarteto;
  document.getElementById('citacionFecha').textContent = prog.fecha;
  document.getElementById('citacionHora').textContent = prog.hora;
  document.getElementById('citacionSede').textContent = prog.sede;
  document.getElementById('citacionAuditorio').textContent = `${prog.auditorioNombre} (ÚNICO)`;
  document.getElementById('citacionOrden').textContent = `#${prog.orden}`;
  document.getElementById('citacionObras').textContent = prog.obras;
  document.getElementById('citacionJurados').textContent = prog.terna.join(' · ');

  modal.style.display = 'flex';
}

let turnoEnReprogramacionId = null;

function abrirModalReprogramar(progId) {
  const prog = programaciones.find(p => p.id === progId);
  if (!prog) return;

  turnoEnReprogramacionId = progId;
  const modal = document.getElementById('modalReprogramar');

  document.getElementById('reprogCuarteto').textContent = `${prog.cuartetoNombre} (${prog.codigoCuarteto})`;
  document.getElementById('reprogTurnoActual').textContent = `${prog.fecha} · ${prog.hora} · ${prog.auditorioNombre}`;

  document.getElementById('reprogNuevaFecha').value = prog.fecha;
  document.getElementById('reprogMotivo').value = '';

  // Select de auditorio
  const selectAud = document.getElementById('reprogNuevoAuditorio');
  selectAud.innerHTML = '';
  auditorios.forEach(aud => {
    const opt = document.createElement('option');
    opt.value = aud.id;
    opt.textContent = `${aud.nombre} (${aud.sede})`;
    if (aud.id === prog.auditorioId) opt.selected = true;
    selectAud.appendChild(opt);
  });

  actualizarHorariosReprogramacion();
  selectAud.onchange = actualizarHorariosReprogramacion;
  document.getElementById('reprogNuevaFecha').onchange = actualizarHorariosReprogramacion;

  modal.style.display = 'flex';
}

function actualizarHorariosReprogramacion() {
  const prog = programaciones.find(p => p.id === turnoEnReprogramacionId);
  const audId = document.getElementById('reprogNuevoAuditorio').value;
  const fecha = document.getElementById('reprogNuevaFecha').value;
  const selectHora = document.getElementById('reprogNuevaHora');

  selectHora.innerHTML = '';
  BLOQUES_HORARIOS.forEach(hora => {
    const ocupante = getTurnoOcupado(audId, fecha, hora);
    const opt = document.createElement('option');
    opt.value = hora;

    if (prog && prog.auditorioId === audId && prog.fecha === fecha && prog.hora === hora) {
      opt.textContent = `📍 ${hora} (Horario actual del cuarteto)`;
      opt.selected = true;
    } else if (ocupante) {
      opt.disabled = true;
      opt.textContent = `🔒 ${hora} — Ocupado por ${ocupante.cuartetoNombre} (No disponible)`;
    } else {
      opt.textContent = `🟢 ${hora} — Disponible`;
    }
    selectHora.appendChild(opt);
  });
}

function ejecutarReprogramacion() {
  if (!turnoEnReprogramacionId) return;

  const prog = programaciones.find(p => p.id === turnoEnReprogramacionId);
  if (!prog) return;

  const nuevaFecha = document.getElementById('reprogNuevaFecha').value;
  const nuevaHora = document.getElementById('reprogNuevaHora').value;
  const nuevoAudId = document.getElementById('reprogNuevoAuditorio').value;
  const motivo = document.getElementById('reprogMotivo').value.trim();

  if (!motivo) {
    alert('⚠️ El motivo de reprogramación es obligatorio (RNF-17 / RF-29)');
    return;
  }

  // Verificar que el horario no esté ocupado por otro
  const ocupante = getTurnoOcupado(nuevoAudId, nuevaFecha, nuevaHora);
  if (ocupante && ocupante.id !== prog.id) {
    alert(`⚠️ El horario ${nuevaHora} en ese auditorio ya está ocupado por ${ocupante.cuartetoNombre}`);
    return;
  }

  const audAnterior = prog.auditorioNombre;
  const horaAnterior = prog.hora;
  const nuevoAud = getAuditorioPorId(nuevoAudId);

  prog.fecha = nuevaFecha;
  prog.hora = nuevaHora;
  prog.auditorioId = nuevoAud.id;
  prog.auditorioNombre = nuevoAud.nombre;
  prog.sede = nuevoAud.sede;
  prog.terna = nuevoAud.terna;
  prog.trazabilidad = `Reprogramado por admin@conservatorio.edu.pe el ${new Date().toLocaleString('es-PE')} · Motivo: ${motivo}`;

  guardarDatos();
  cerrarTodosLosModales();
  renderTodo();

  mostrarModalReprogramadoExitoso(prog.cuartetoNombre, `${audAnterior} (${horaAnterior})`, `${nuevoAud.nombre} (${nuevaHora})`, nuevaFecha, nuevaHora, motivo);
}

function mostrarModalTurnoProgramado(turno) {
  const modal = document.getElementById('modalTurnoProgramado');
  document.getElementById('tpDetalle').innerHTML = `
    <div style="font-size:14px; line-height:1.7;">
      <strong>Cuarteto:</strong> ${turno.cuartetoNombre} (${turno.codigoCuarteto})<br>
      <strong>Auditorio Asignado:</strong> <strong>${turno.auditorioNombre} (ÚNICO)</strong><br>
      <strong>Fecha y Hora:</strong> ${turno.fecha} · <strong>${turno.hora}</strong><br>
      <strong>Sede:</strong> ${turno.sede} · <strong>Turno:</strong> #${turno.orden}<br>
      <strong>Terna de Jurados (RF-33):</strong> ${turno.terna.join(' · ')}
    </div>
  `;
  modal.style.display = 'flex';
}

function mostrarModalConflicto(auditorioNombre, fecha, hora, cuartetoOcupante, codigoOcupante) {
  const modal = document.getElementById('modalConflicto');
  document.getElementById('conflictoDetalle').innerHTML = `
    El horario <strong>${hora}</strong> en el <strong>${auditorioNombre}</strong> (fecha: ${fecha}) ya se encuentra asignado y bloqueado para:
    <div style="margin-top:10px; padding:10px; background:#fee2e2; border-radius:6px; font-weight:700; color:#991b1b;">
      🎻 ${cuartetoOcupante} (${codigoOcupante})
    </div>
    <div style="margin-top:10px; font-size:13px; color:#475569;">
      <strong>RNF-15:</strong> Bloqueo estricto de doble asignación de auditorio y horario. Ningún cuarteto puede ocupar un horario que ya fue escogido por otro cuarteto.
    </div>
  `;
  modal.style.display = 'flex';
}

function mostrarModalReprogramadoExitoso(cuarteto, ant, nuevo, fecha, hora, motivo) {
  const modal = document.getElementById('modalReprogramadoExitoso');
  document.getElementById('reprogExitoDetalle').innerHTML = `
    <div style="font-size:14px; line-height:1.6;">
      <strong>Cuarteto:</strong> ${cuarteto}<br>
      <strong>Turno Anterior:</strong> <span style="text-decoration:line-through; color:var(--muted);">${ant}</span> (Liberado)<br>
      <strong>Nuevo Turno:</strong> <strong style="color:var(--primary);">${nuevo}</strong> (Guardado y Bloqueado)<br>
      <strong>Fecha:</strong> ${fecha}<br>
      <strong>Motivo registrado (RNF-17):</strong> ${motivo}<br>
      <div style="margin-top:10px; font-size:12px; color:var(--muted); border-top:1px dashed #cbd5e1; padding-top:6px;">
        ✉️ RF-30: Correo oficial de reprogramación enviado al representante y profesor responsable.
      </div>
    </div>
  `;
  modal.style.display = 'flex';
}

function mostrarModalError(titulo, contenido) {
  alert(`⚠️ ${titulo}\n\n${contenido.replace(/<[^>]*>/g, '')}`);
}

function mostrarAlertaExito(msg) {
  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert alert-success';
  alertDiv.style.position = 'fixed';
  alertDiv.style.top = '20px';
  alertDiv.style.right = '20px';
  alertDiv.style.zIndex = '9999';
  alertDiv.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15)';
  alertDiv.innerHTML = `<strong>[OK]</strong> ${msg}`;
  document.body.appendChild(alertDiv);
  setTimeout(() => alertDiv.remove(), 3500);
}

function cerrarModal(id) {
  document.getElementById(id).style.display = 'none';
}

function cerrarTodosLosModales() {
  document.querySelectorAll('.modal-backdrop').forEach(m => m.style.display = 'none');
}
