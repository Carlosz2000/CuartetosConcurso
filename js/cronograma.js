import { supabase } from '../config/supabase.js';

/* ============================================================
   S4 · CRONOGRAMA Y ASIGNACIÓN DE AUDITORIOS
   Integración 100% Supabase · Filtro de 'Inscrito' · Persistencia Real
   ============================================================ */

const STORAGE_KEY_PROGRAMACIONES = 'concurso_cuartetos_s4_programaciones';

/* Helper para parsear JSON de forma segura sin romper la promesa */
function parseJSONSeguro(valor, valorPorDefecto = null) {
  if (!valor || typeof valor !== 'string' || valor.trim() === '' || valor === 'undefined') {
    return valorPorDefecto;
  }
  try {
    return JSON.parse(valor);
  } catch (e) {
    console.warn('⚠️ JSON corrupto o inválido:', e);
    return valorPorDefecto;
  }
}

/* Nómina Oficial de Jurados Evaluadores (S5) */
const JURADOS_CATALOGO = [
  { id: 1, nombre: 'Dra. Beatriz Morales', especialidad: 'Música de Cámara y Violín', correo: 'bmorales@cons.pe', dni: '45678912', institucion: 'Conservatorio Nacional', ternaAuditorio: 'Auditorio Principal' },
  { id: 2, nombre: 'Dr. Luis Paredes', especialidad: 'Violín Solista', correo: 'lparedes@cons.pe', dni: '23456789', institucion: 'Orquesta Sinfónica Nacional', ternaAuditorio: 'Auditorio Principal' },
  { id: 3, nombre: 'Mg. Ana Torres', especialidad: 'Viola y Práctica Orquestal', correo: 'atorres@cons.pe', dni: '34567890', institucion: 'Ensamble de Cuerdas', ternaAuditorio: 'Auditorio Principal' },
  { id: 4, nombre: 'Dr. Carlos Mendoza', especialidad: 'Violonchelo y Cuartetos', correo: 'cmendoza@cons.pe', dni: '45678901', institucion: 'Conservatorio Nacional', ternaAuditorio: 'Auditorio B — Sala Beethoven' },
  { id: 5, nombre: 'Dra. María Salazar', especialidad: 'Violonchelo Barroco', correo: 'msalazar@cons.pe', dni: '56789012', institucion: 'Academia Filarmónica', ternaAuditorio: 'Auditorio B — Sala Beethoven' },
  { id: 6, nombre: 'Mtro. Eduardo Valdivia', especialidad: 'Violín Primero y Concertino', correo: 'evaldivia@cons.pe', dni: '67890123', institucion: 'Sinfónica Juvenil', ternaAuditorio: 'Auditorio B — Sala Beethoven' },
  { id: 7, nombre: 'Dra. Patricia Sotomayor', especialidad: 'Viola de Concierto', correo: 'psotomayor@cons.pe', dni: '78901234', institucion: 'Conservatorio de Lima', ternaAuditorio: 'Auditorio C — Sala Mozart' },
  { id: 8, nombre: 'Dr. Gonzalo Cárdenas', especialidad: 'Violonchelo y Ensamble', correo: 'gcardenas@cons.pe', dni: '89012345', institucion: 'Camerata Filarmónica', ternaAuditorio: 'Auditorio C — Sala Mozart' },
  { id: 9, nombre: 'Mg. Valeria Benavides', especialidad: 'Violín y Cuarteto Clásico', correo: 'vbenavides@cons.pe', dni: '90123456', institucion: 'Orquesta de Cámara', ternaAuditorio: 'Auditorio C — Sala Mozart' },
  { id: 10, nombre: 'Dr. Andrés Holguín', especialidad: 'Dirección Orquestal y Cuerdas', correo: 'aholguin@cons.pe', dni: '11223344', institucion: 'Sociedad Filarmónica', ternaAuditorio: 'Sala de Cámara' },
  { id: 11, nombre: 'Dra. Carmen Revilla', especialidad: 'Viola y Análisis Interpretativo', correo: 'crevilla@cons.pe', dni: '22334455', institucion: 'Instituto de Música', ternaAuditorio: 'Sala de Cámara' },
  { id: 12, nombre: 'Mtro. Diego Seminario', especialidad: 'Violonchelo y Continuo', correo: 'dseminario@cons.pe', dni: '33445566', institucion: 'Orquesta Sinfónica Nacional', ternaAuditorio: 'Sala de Cámara' }
];

/* Catálogo Oficial de Auditorios */
const AUDITORIOS_BASE = [
  { id: 'aud-principal', nombre: 'Auditorio Principal', sede: 'Sede Central', capacidad: 400, terna: ['Dra. Beatriz Morales', 'Dr. Luis Paredes', 'Mg. Ana Torres'] },
  { id: 'aud-b', nombre: 'Auditorio B — Sala Beethoven', sede: 'Sede Central', capacidad: 250, terna: ['Dr. Carlos Mendoza', 'Dra. María Salazar', 'Mtro. Eduardo Valdivia'] },
  { id: 'aud-c', nombre: 'Auditorio C — Sala Mozart', sede: 'Sede Norte', capacidad: 200, terna: ['Dra. Patricia Sotomayor', 'Dr. Gonzalo Cárdenas', 'Mg. Valeria Benavides'] },
  { id: 'aud-camara', nombre: 'Sala de Cámara', sede: 'Sede Central', capacidad: 120, terna: ['Dr. Andrés Holguín', 'Dra. Carmen Revilla', 'Mtro. Diego Seminario'] }
];

/* Bloques de Horarios Oficiales */
const BLOQUES_HORARIOS = [
  '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM'
];

// Estado global en memoria
let programaciones = [];
let auditorios = [...AUDITORIOS_BASE];
let cuartetos = [];
let horarioSeleccionadoActual = null;
let turnoEnReprogramacionId = null;

/* ============================================================
   CARGA DE PROGRAMACIONES Y TERNAS DESDE SUPABASE / S5
   ============================================================ */
async function cargarDatosDinamicosBD() {
  // 1. Cargar ternas asignadas en S5 desde localStorage
  const ternasGuardadas = parseJSONSeguro(localStorage.getItem('concurso_ternas_auditorio'), null);
  if (ternasGuardadas) {
    auditorios.forEach(aud => {
      if (ternasGuardadas[aud.nombre]) {
        aud.terna = ternasGuardadas[aud.nombre];
      }
    });
  }

  // 2. Extraer cuartetos programados en Supabase
  try {
    const { data: programadosBD, error } = await supabase
      .from('cuarteto')
      .select('*')
      .not('auditorio', 'is', null);

    if (!error && programadosBD) {
      programaciones = programadosBD.map((c, idx) => {
        const audObj = auditorios.find(a => a.nombre === c.auditorio || a.id === c.auditorio);
        const ternaActual = audObj ? audObj.terna : ['Jurado A', 'Jurado B', 'Jurado C'];

        return {
          id: `prog-${c.id_cuarteto}`,
          cuartetoId: c.id_cuarteto,
          codigoCuarteto: c.codigo_cuarteto || (`CQ-2026-${c.id_cuarteto}`),
          cuartetoNombre: c.nombre_cuarteto,
          fase: 'Primera Eliminatoria',
          fecha: c.fecha_presentacion || '2026-10-15',
          hora: c.hora_presentacion || '10:00 AM',
          sede: c.sede || 'Sede Central',
          auditorioId: audObj ? audObj.id : 'aud-b',
          auditorioNombre: c.auditorio,
          orden: idx + 1,
          terna: ternaActual,
          estado: c.estado_presentacion || 'Programado',
          obras: `${c.obra_obligatoria || 'Obra Obligatoria'} · ${c.obra_libre_titulo || 'Obra Libre'}`,
          trazabilidad: `Sincronizado desde Supabase`
        };
      });
    }
  } catch (err) {
    console.warn('⚠️ Error al sincronizar programaciones:', err);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await cargarDatosDinamicosBD();
  await inicializarSelectoresAuditorioYCuarteto();
  renderTodo();
  configurarEventos();
});

function cargarDatos() {
  const progsGuardadas = localStorage.getItem(STORAGE_KEY_PROGRAMACIONES);
  const datos = parseJSONSeguro(progsGuardadas, null);
  if (datos && Array.isArray(datos)) {
    programaciones = datos;
  } else {
    programaciones = [];
    guardarDatos();
  }
}

function guardarDatos() {
  localStorage.setItem(STORAGE_KEY_PROGRAMACIONES, JSON.stringify(programaciones));
}

/* Consultas de ocupación */
function getTurnoOcupado(auditorioId, fecha, hora) {
  return programaciones.find(p => (p.auditorioId === auditorioId || p.auditorioNombre === auditorioId) && p.fecha === fecha && p.hora === hora) || null;
}

function getProgramacionDeCuarteto(codigoCuarteto) {
  return programaciones.find(p => p.codigoCuarteto === codigoCuarteto || p.cuartetoId === codigoCuarteto) || null;
}

function getAuditorioPorId(auditorioId) {
  return auditorios.find(a => a.id === auditorioId || a.nombre === auditorioId);
}

function getCuartetoPorCodigo(codigo) {
  return cuartetos.find(c => c.codigo === codigo || c.id === codigo);
}

/* ============================================================
   CARGA DE CUARTETOS DESDE SUPABASE (SOLO ESTADO 'INSCRITO')
   ============================================================ */
async function inicializarSelectoresAuditorioYCuarteto() {
  const selectAud = document.getElementById('selectAuditorio');
  const selectCuarteto = document.getElementById('selectCuarteto');

  if (!selectAud || !selectCuarteto) return;

  const audActual = selectAud.value;
  const cuartetoActual = selectCuarteto.value;

  // 1. Consultar a Supabase únicamente las agrupaciones con estado_inscripcion = 'Inscrito'
  try {
    const { data: cuartetosBD, error } = await supabase
      .from('cuarteto')
      .select('*')
      .eq('estado_inscripcion', 'Inscrito');

    if (!error && cuartetosBD) {
      cuartetos = cuartetosBD.map(c => ({
        id: c.id_cuarteto,
        codigo: c.codigo_cuarteto || (`CQ-2026-${c.id_cuarteto}`),
        nombre: c.nombre_cuarteto,
        profesor: 'Docente Responsable',
        auditorioAsignado: c.auditorio,
        horaAsignada: c.hora_presentacion,
        fechaAsignada: c.fecha_presentacion,
        obras: `${c.obra_obligatoria || 'Obra Obligatoria'} · ${c.obra_libre_titulo || 'Obra Libre'}`
      }));
    } else {
      cuartetos = [];
    }
  } catch (err) {
    console.warn('⚠️ No se pudo obtener la nómina desde Supabase:', err);
    cuartetos = [];
  }

  // 2. Poblar selector de auditorios
  selectAud.innerHTML = '';
  auditorios.forEach(aud => {
    const turnosCount = programaciones.filter(p => p.auditorioId === aud.id || p.auditorioNombre === aud.nombre).length;
    const opt = document.createElement('option');
    opt.value = aud.id;
    opt.textContent = `${aud.nombre} (${aud.sede} · Cap. ${aud.capacidad}) ${turnosCount > 0 ? `— [${turnosCount} turno(s) asignado(s)]` : '— [Disponible]'}`;
    selectAud.appendChild(opt);
  });

  if (audActual && auditorios.some(a => a.id === audActual)) {
    selectAud.value = audActual;
  } else if (auditorios.length > 0) {
    selectAud.value = auditorios[0].id;
  }

  // 3. Poblar selector de cuartetos inscritos
  selectCuarteto.innerHTML = '<option value="">-- Seleccionar Cuarteto a Programar --</option>';

  if (cuartetos.length === 0) {
    const opt = document.createElement('option');
    opt.value = "";
    opt.disabled = true;
    opt.textContent = "No hay cuartetos en estado 'Inscrito'";
    selectCuarteto.appendChild(opt);
  } else {
    cuartetos.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.codigo;

      if (c.auditorioAsignado && c.horaAsignada) {
        opt.textContent = `${c.nombre} (${c.codigo}) — 🔒 Ya tiene auditorio: ${c.auditorioAsignado} (${c.horaAsignada})`;
      } else {
        opt.textContent = `${c.nombre} (${c.codigo}) — 🟢 Pendiente de Programación`;
      }
      selectCuarteto.appendChild(opt);
    });
  }

  if (cuartetoActual) {
    selectCuarteto.value = cuartetoActual;
  }

  actualizarInfoAuditorioSeleccionado();
  actualizarEstadoCuartetoSeleccionado();
}

/* ============================================================
   RENDERIZADO GENERAL
   ============================================================ */
function renderTodo() {
  actualizarEstadisticas();
  renderAuditoriosGrid();
  renderGrillaHorariosDisponibles();
  renderTablaCronograma();
  actualizarResumenTurno();
}

function actualizarEstadisticas() {
  const totalCuartetos = cuartetos.length;
  const programados = programaciones.length;
  const totalAuditorios = auditorios.length;

  const elTot = document.getElementById('statTotalCuartetos');
  const elProg = document.getElementById('statProgramados');
  const elAud = document.getElementById('statTotalAuditorios');
  const elTurnos = document.getElementById('statTurnosTotales');

  if (elTot) elTot.textContent = totalCuartetos;
  if (elProg) elProg.textContent = `${programados}/${totalCuartetos}`;
  if (elAud) elAud.textContent = totalAuditorios;
  if (elTurnos) elTurnos.textContent = programados;
}

function renderAuditoriosGrid() {
  const container = document.getElementById('auditoriosGrid');
  if (!container) return;
  container.innerHTML = '';

  auditorios.forEach(aud => {
    const turnos = programaciones.filter(p => p.auditorioId === aud.id || p.auditorioNombre === aud.nombre);
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
  const selectAud = document.getElementById('selectAuditorio');
  if (selectAud) {
    selectAud.value = auditorioId;
    actualizarInfoAuditorioSeleccionado();
    renderGrillaHorariosDisponibles();
  }
  const formP = document.getElementById('formProgramar');
  if (formP) formP.scrollIntoView({ behavior: 'smooth' });
}

function cerrarSesion() {
  if (confirm('¿Cerrar sesión y volver al inicio?')) {
    sessionStorage.removeItem('competia_session');
    window.location.href = 'landing.html';
  }
}

function actualizarInfoAuditorioSeleccionado() {
  const selectAud = document.getElementById('selectAuditorio');
  const infoEl = document.getElementById('infoAuditorioSeleccionado');
  if (!selectAud || !infoEl) return;

  const audId = selectAud.value;
  const aud = getAuditorioPorId(audId);

  if (aud) {
    infoEl.innerHTML = `
      <div style="font-size:13px; color:var(--ink); background:#f8fafc; padding:10px 14px; border-radius:8px; border:1px solid var(--border);">
        🏛️ <strong>${aud.nombre}</strong> (${aud.sede} · Capacidad: ${aud.capacidad}) · 👨‍⚖️ <strong>Terna (RF-33):</strong> ${aud.terna.join(' · ')}
      </div>
    `;
  }
}

function actualizarEstadoCuartetoSeleccionado() {
  const selectCuarteto = document.getElementById('selectCuarteto');
  const alertEl = document.getElementById('alertCuartetoEstado');
  const btnProgramar = document.getElementById('btnProgramar');

  if (!selectCuarteto || !alertEl || !btnProgramar) return;

  const codigo = selectCuarteto.value;
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

function renderGrillaHorariosDisponibles() {
  const selectAud = document.getElementById('selectAuditorio');
  const inputFecha = document.getElementById('inputFecha');
  const container = document.getElementById('slotsGrid');
  const countDisponiblesEl = document.getElementById('slotsDisponiblesCount');

  if (!selectAud || !inputFecha || !container) return;

  const audId = selectAud.value;
  const fecha = inputFecha.value;

  container.innerHTML = '';
  let disponiblesCount = 0;

  if (horarioSeleccionadoActual) {
    const ocupante = getTurnoOcupado(audId, fecha, horarioSeleccionadoActual);
    if (ocupante) horarioSeleccionadoActual = null;
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
            <strong style="color:var(--primary);">Turno seleccionado</strong><br>Haz clic en otro para cambiar
          ` : `
            Horario disponible.<br>Haz clic para seleccionar este turno.
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
      slotCard.title = `Reservado por ${ocupante.cuartetoNombre}.`;
    }

    container.appendChild(slotCard);
  });

  if (countDisponiblesEl) {
    countDisponiblesEl.textContent = `${disponiblesCount} de ${BLOQUES_HORARIOS.length} horarios libres`;
  }
  actualizarResumenTurno();
}

function actualizarResumenTurno() {
  const selectAud = document.getElementById('selectAuditorio');
  const inputFecha = document.getElementById('inputFecha');
  const selectCuarteto = document.getElementById('selectCuarteto');
  const resumenBox = document.getElementById('resumenTurnoBox');
  const resumenInfo = document.getElementById('resumenTurnoInfo');
  const btnProgramar = document.getElementById('btnProgramar');

  if (!selectAud || !inputFecha || !selectCuarteto || !resumenBox || !resumenInfo || !btnProgramar) return;

  const audId = selectAud.value;
  const fecha = inputFecha.value;
  const codigoCuarteto = selectCuarteto.value;

  const aud = getAuditorioPorId(audId);
  const cuarteto = getCuartetoPorCodigo(codigoCuarteto);

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
    if (!horarioSeleccionadoActual) btnProgramar.disabled = true;
  }
}

/* Helper: Convertir formato "03:30 PM" a minutos para ordenamiento cronológico real */
function horaAMinutos(horaStr) {
  if (!horaStr) return 0;
  const partes = horaStr.split(' ');
  if (partes.length < 2) return 0;
  
  const [tiempo, ampm] = partes;
  let [horas, minutos] = tiempo.split(':').map(Number);

  if (ampm === 'PM' && horas < 12) horas += 12;
  if (ampm === 'AM' && horas === 12) horas = 0;

  return horas * 60 + minutos;
}

/* ============================================================
   TABLA DE CRONOGRAMA CON ORDEN CRONOLÓGICO REAL
   ============================================================ */
function renderTablaCronograma() {
  const tbody = document.getElementById('cronogramaTableBody');
  if (!tbody) return;
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

  // Ordenar por Fecha y luego por Hora en minutos reales
  const ordenados = [...programaciones].sort((a, b) => {
    const compFecha = a.fecha.localeCompare(b.fecha);
    if (compFecha !== 0) return compFecha;
    return horaAMinutos(a.hora) - horaAMinutos(b.hora);
  });

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
      <td><small>${prog.terna.join(' · ')}</small></td>
      <td><span class="badge badge-ok">${prog.estado}</span></td>
      <td>
        <div style="display:flex; gap:6px;">
          <button class="btn btn-secondary" style="font-size:12px; padding:4px 8px;" onclick="abrirModalCitacion('${prog.id}')">📜 Presentación</button>
          <button class="btn btn-primary" style="font-size:12px; padding:4px 8px;" onclick="abrirModalReprogramar('${prog.id}')">🔄 Reprogramar</button>
          <button class="btn btn-danger" style="font-size:12px; padding:4px 8px;" onclick="confirmarLiberar('${prog.id}')">❌</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function configurarEventos() {
  const selAud = document.getElementById('selectAuditorio');
  if (selAud) {
    selAud.addEventListener('change', () => {
      actualizarInfoAuditorioSeleccionado();
      renderGrillaHorariosDisponibles();
    });
  }

  const inpFecha = document.getElementById('inputFecha');
  if (inpFecha) {
    inpFecha.addEventListener('change', () => {
      renderGrillaHorariosDisponibles();
    });
  }

  const selCuarteto = document.getElementById('selectCuarteto');
  if (selCuarteto) {
    selCuarteto.addEventListener('change', () => {
      actualizarEstadoCuartetoSeleccionado();
    });
  }

  const formProg = document.getElementById('formProgramar');
  if (formProg) {
    formProg.addEventListener('submit', (e) => {
      e.preventDefault();
      ejecutarProgramacionTurno();
    });
  }

  const btnConflicto = document.getElementById('btnSimularConflicto');
  if (btnConflicto) {
    btnConflicto.addEventListener('click', () => {
      simularConflictoAuditorio();
    });
  }

  const btnRestablecer = document.getElementById('btnRestablecer');
  if (btnRestablecer) {
    btnRestablecer.addEventListener('click', () => {
      if (confirm('¿Restablecer los datos de cronograma y auditorios?')) {
        programaciones = [];
        horarioSeleccionadoActual = null;
        guardarDatos();
        inicializarSelectoresAuditorioYCuarteto().then(() => renderTodo());
        mostrarAlertaExito('Datos de cronograma restablecidos.');
      }
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') cerrarTodosLosModales();
  });
}

/* ============================================================
   PROGRAMAR Y LIBERAR CON ACTUALIZACIÓN REAL EN SUPABASE
   ============================================================ */
async function ejecutarProgramacionTurno() {
  const selCuarteto = document.getElementById('selectCuarteto');
  const selAud = document.getElementById('selectAuditorio');
  const inpFecha = document.getElementById('inputFecha');
  const selFase = document.getElementById('selectFase');

  const codigoCuarteto = selCuarteto ? selCuarteto.value : '';
  const auditorioId = selAud ? selAud.value : '';
  const fecha = inpFecha ? inpFecha.value : '';
  const hora = horarioSeleccionadoActual;
  const fase = selFase ? selFase.value : 'Primera Eliminatoria';

  if (!codigoCuarteto || !auditorioId || !fecha || !hora) {
    alert('⚠️ Complete todos los campos requeridos y seleccione un horario libre de la grilla.');
    return;
  }

  const cuarteto = getCuartetoPorCodigo(codigoCuarteto);
  const auditorio = getAuditorioPorId(auditorioId);

  // Validaciones
  const progExistenteCuarteto = getProgramacionDeCuarteto(codigoCuarteto);
  if (progExistenteCuarteto) {
    mostrarModalError(
      'Cuarteto ya asignado',
      `El cuarteto <strong>${cuarteto.nombre}</strong> ya tiene asignado el <strong>${progExistenteCuarteto.auditorioNombre}</strong> el ${progExistenteCuarteto.fecha} a las ${progExistenteCuarteto.hora}.`
    );
    return;
  }

  const ocupanteActual = getTurnoOcupado(auditorioId, fecha, hora);
  if (ocupanteActual) {
    mostrarModalConflicto(auditorio.nombre, fecha, hora, ocupanteActual.cuartetoNombre, ocupanteActual.codigoCuarteto);
    return;
  }

  // 1️⃣ UPDATE EN SUPABASE FILTRANDO POR codigo_cuarteto
  const { error } = await supabase
    .from('cuarteto')
    .update({
      sede: auditorio.sede,
      auditorio: auditorio.nombre,
      fecha_presentacion: fecha,
      hora_presentacion: hora,
      estado_presentacion: 'Programado'
    })
    .eq('codigo_cuarteto', cuarteto.codigo);

  if (error) {
    alert(`❌ Error al guardar en Supabase: ${error.message}`);
    return;
  }

  // 2️⃣ Actualización en estado local
  const nuevoTurno = {
    id: `prog-${Date.now()}`,
    cuartetoId: cuarteto.id,
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
    trazabilidad: `Programado por admin@cons.pe · ${new Date().toLocaleString('es-PE')}`
  };

  programaciones.push(nuevoTurno);
  horarioSeleccionadoActual = null;
  guardarDatos();

  await inicializarSelectoresAuditorioYCuarteto();
  renderTodo();

  if (typeof registrarCorreoSimulado === 'function') {
    registrarCorreoSimulado(
      'representante@cons.pe, docente@cons.pe',
      `Citación Oficial Concurso: ${cuarteto.nombre}`,
      `Se ha programado su turno para el ${fecha} a las ${hora} hrs en el ${auditorio.nombre}.`,
      'RF-31 / RF-34'
    );
  }

  mostrarModalTurnoProgramado(nuevoTurno);
}

async function confirmarLiberar(progId) {
  const prog = programaciones.find(p => p.id === progId);
  if (!prog) return;

  if (confirm(`¿Liberar el turno en ${prog.auditorioNombre} (${prog.fecha} · ${prog.hora}) asignado a ${prog.cuartetoNombre}?`)) {
    
    // Actualización segura en Supabase usando codigo_cuarteto
    if (prog.codigoCuarteto) {
      const { error } = await supabase
        .from('cuarteto')
        .update({
          sede: null,
          auditorio: null,
          fecha_presentacion: null,
          hora_presentacion: null,
          estado_presentacion: 'Pendiente'
        })
        .eq('codigo_cuarteto', prog.codigoCuarteto);

      if (error) console.warn('Advertencia al liberar en Supabase:', error.message);
    }

    programaciones = programaciones.filter(p => p.id !== progId);
    guardarDatos();
    await inicializarSelectoresAuditorioYCuarteto();
    renderTodo();
    mostrarAlertaExito(`El turno en ${prog.auditorioNombre} (${prog.hora}) ha sido liberado.`);
  }
}

/* ============================================================
   MODALES Y UTILIDADES DE INTERFAZ
   ============================================================ */
function abrirModalCitacion(progId) {
  const prog = programaciones.find(p => p.id === progId);
  if (!prog) return;
  const modal = document.getElementById('modalCitacion');
  if (!modal) return;

  const setT = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setT('citacionCuartetoNombre', prog.cuartetoNombre);
  setT('citacionCodigo', prog.codigoCuarteto);
  setT('citacionFecha', prog.fecha);
  setT('citacionHora', prog.hora);
  setT('citacionSede', prog.sede);
  setT('citacionAuditorio', `${prog.auditorioNombre} (ÚNICO)`);
  setT('citacionOrden', `#${prog.orden}`);
  setT('citacionObras', prog.obras);
  setT('citacionJurados', prog.terna.join(' · '));

  modal.style.display = 'flex';
}

function abrirModalReprogramar(progId) {
  const prog = programaciones.find(p => p.id === progId);
  if (!prog) return;

  turnoEnReprogramacionId = progId;
  const modal = document.getElementById('modalReprogramar');
  if (!modal) return;

  const elCuarteto = document.getElementById('reprogCuarteto');
  const elTurnoActual = document.getElementById('reprogTurnoActual');
  const inpNuevaFecha = document.getElementById('reprogNuevaFecha');
  const inpMotivo = document.getElementById('reprogMotivo');

  if (elCuarteto) elCuarteto.textContent = `${prog.cuartetoNombre} (${prog.codigoCuarteto})`;
  if (elTurnoActual) elTurnoActual.textContent = `${prog.fecha} · ${prog.hora} · ${prog.auditorioNombre}`;
  if (inpNuevaFecha) inpNuevaFecha.value = prog.fecha;
  if (inpMotivo) inpMotivo.value = '';

  const selectAud = document.getElementById('reprogNuevoAuditorio');
  if (selectAud) {
    selectAud.innerHTML = '';
    auditorios.forEach(aud => {
      const opt = document.createElement('option');
      opt.value = aud.id;
      opt.textContent = `${aud.nombre} (${aud.sede})`;
      if (aud.id === prog.auditorioId || aud.nombre === prog.auditorioNombre) opt.selected = true;
      selectAud.appendChild(opt);
    });
    selectAud.onchange = actualizarHorariosReprogramacion;
  }

  if (inpNuevaFecha) inpNuevaFecha.onchange = actualizarHorariosReprogramacion;

  actualizarHorariosReprogramacion();
  modal.style.display = 'flex';
}

function actualizarHorariosReprogramacion() {
  const prog = programaciones.find(p => p.id === turnoEnReprogramacionId);
  const selAud = document.getElementById('reprogNuevoAuditorio');
  const inpFecha = document.getElementById('reprogNuevaFecha');
  const selectHora = document.getElementById('reprogNuevaHora');

  if (!selAud || !inpFecha || !selectHora) return;

  const audId = selAud.value;
  const fecha = inpFecha.value;

  selectHora.innerHTML = '';
  BLOQUES_HORARIOS.forEach(hora => {
    const ocupante = getTurnoOcupado(audId, fecha, hora);
    const opt = document.createElement('option');
    opt.value = hora;

    if (prog && (prog.auditorioId === audId || prog.auditorioNombre === audId) && prog.fecha === fecha && prog.hora === hora) {
      opt.textContent = `📍 ${hora} (Horario actual del cuarteto)`;
      opt.selected = true;
    } else if (ocupante) {
      opt.disabled = true;
      opt.textContent = `🔒 ${hora} — Ocupado por ${ocupante.cuartetoNombre}`;
    } else {
      opt.textContent = `🟢 ${hora} — Disponible`;
    }
    selectHora.appendChild(opt);
  });
}

async function ejecutarReprogramacion() {
  if (!turnoEnReprogramacionId) return;
  const prog = programaciones.find(p => p.id === turnoEnReprogramacionId);
  if (!prog) return;

  const inpFecha = document.getElementById('reprogNuevaFecha');
  const selHora = document.getElementById('reprogNuevaHora');
  const selAud = document.getElementById('reprogNuevoAuditorio');
  const inpMotivo = document.getElementById('reprogMotivo');

  const nuevaFecha = inpFecha ? inpFecha.value : prog.fecha;
  const nuevaHora = selHora ? selHora.value : prog.hora;
  const nuevoAudId = selAud ? selAud.value : prog.auditorioId;
  const motivo = inpMotivo ? inpMotivo.value.trim() : '';

  if (!motivo) {
    alert('⚠️ El motivo de reprogramación es obligatorio.');
    return;
  }

  const ocupante = getTurnoOcupado(nuevoAudId, nuevaFecha, nuevaHora);
  if (ocupante && ocupante.id !== prog.id) {
    alert(`⚠️ El horario ${nuevaHora} en ese auditorio ya está ocupado por ${ocupante.cuartetoNombre}`);
    return;
  }

  const nuevoAud = getAuditorioPorId(nuevoAudId);

  // UPDATE EN SUPABASE FILTRANDO POR codigo_cuarteto
  const { error } = await supabase
    .from('cuarteto')
    .update({
      sede: nuevoAud.sede,
      auditorio: nuevoAud.nombre,
      fecha_presentacion: nuevaFecha,
      hora_presentacion: nuevaHora,
      estado_presentacion: 'Programado'
    })
    .eq('codigo_cuarteto', prog.codigoCuarteto);

  if (error) {
    alert(`❌ Error al reprogramar en Supabase: ${error.message}`);
    return;
  }

  const audAnterior = prog.auditorioNombre;
  const horaAnterior = prog.hora;

  prog.fecha = nuevaFecha;
  prog.hora = nuevaHora;
  prog.auditorioId = nuevoAud.id;
  prog.auditorioNombre = nuevoAud.nombre;
  prog.sede = nuevoAud.sede;
  prog.terna = nuevoAud.terna;
  prog.trazabilidad = `Reprogramado el ${new Date().toLocaleString('es-PE')} · Motivo: ${motivo}`;

  guardarDatos();
  cerrarTodosLosModales();
  await inicializarSelectoresAuditorioYCuarteto();
  renderTodo();

  mostrarModalReprogramadoExitoso(prog.cuartetoNombre, `${audAnterior} (${horaAnterior})`, `${nuevoAud.nombre} (${nuevaHora})`, nuevaFecha, nuevaHora, motivo);
}

function simularConflictoAuditorio() {
  const selAud = document.getElementById('selectAuditorio');
  const inpFecha = document.getElementById('inputFecha');

  const audId = selAud ? selAud.value : 'aud-principal';
  const fecha = inpFecha ? inpFecha.value : '2026-10-15';
  const aud = getAuditorioPorId(audId);

  const ocupado = programaciones.find(p => (p.auditorioId === audId || p.auditorioNombre === aud.nombre) && p.fecha === fecha) || programaciones[0];

  if (ocupado) {
    mostrarModalConflicto(ocupado.auditorioNombre, ocupado.fecha, ocupado.hora, ocupado.cuartetoNombre, ocupado.codigoCuarteto);
  }
}

function mostrarModalTurnoProgramado(turno) {
  const modal = document.getElementById('modalTurnoProgramado');
  const det = document.getElementById('tpDetalle');
  if (!modal || !det) return;

  det.innerHTML = `
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
  const det = document.getElementById('conflictoDetalle');
  if (!modal || !det) return;

  det.innerHTML = `
    El horario <strong>${hora}</strong> en el <strong>${auditorioNombre}</strong> (fecha: ${fecha}) ya se encuentra asignado y bloqueado para:
    <div style="margin-top:10px; padding:10px; background:#fee2e2; border-radius:6px; font-weight:700; color:#991b1b;">
      🎻 ${cuartetoOcupante} (${codigoOcupante})
    </div>
  `;
  modal.style.display = 'flex';
}

function mostrarModalReprogramadoExitoso(cuarteto, ant, nuevo, fecha, hora, motivo) {
  const modal = document.getElementById('modalReprogramadoExitoso');
  const det = document.getElementById('reprogExitoDetalle');
  if (!modal || !det) return;

  det.innerHTML = `
    <div style="font-size:14px; line-height:1.6;">
      <strong>Cuarteto:</strong> ${cuarteto}<br>
      <strong>Turno Anterior:</strong> <span style="text-decoration:line-through; color:var(--muted);">${ant}</span> (Liberado)<br>
      <strong>Nuevo Turno:</strong> <strong style="color:var(--primary);">${nuevo}</strong> (Guardado y Bloqueado)<br>
      <strong>Fecha:</strong> ${fecha}<br>
      <strong>Motivo registrado (RNF-17):</strong> ${motivo}
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
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

function cerrarTodosLosModales() {
  document.querySelectorAll('.modal-backdrop').forEach(m => m.style.display = 'none');
}

function abrirModalCatalogoJurados() {
  const modal = document.getElementById('modalCatalogoJurados');
  if (!modal) return;
  renderTablaCatalogoJurados();
  modal.style.display = 'flex';
}

function cerrarModalCatalogoJurados() {
  const modal = document.getElementById('modalCatalogoJurados');
  if (modal) modal.style.display = 'none';
}

function renderTablaCatalogoJurados() {
  const tbody = document.getElementById('tablaJuradosBody');
  if (!tbody) return;

  tbody.innerHTML = JURADOS_CATALOGO.map(j => `
    <tr>
      <td><strong>#${j.id}</strong></td>
      <td><strong>${j.nombre}</strong><br><small style="color:var(--muted);">${j.correo}</small></td>
      <td>${j.especialidad}</td>
      <td><span class="badge badge-code">${j.dni}</span></td>
      <td>${j.institucion}</td>
      <td><span class="table-badge-auditorio" style="font-size:11px;">🏛️ ${j.ternaAuditorio}</span></td>
    </tr>
  `).join('');
}

// Exportación global de funciones inline
window.seleccionarAuditorioDesdeTarjeta = seleccionarAuditorioDesdeTarjeta;
window.cerrarSesion = cerrarSesion;
window.abrirModalCitacion = abrirModalCitacion;
window.abrirModalReprogramar = abrirModalReprogramar;
window.confirmarLiberar = confirmarLiberar;
window.ejecutarReprogramacion = ejecutarReprogramacion;
window.cerrarModal = cerrarModal;
window.abrirModalCatalogoJurados = abrirModalCatalogoJurados;
window.cerrarModalCatalogoJurados = cerrarModalCatalogoJurados;