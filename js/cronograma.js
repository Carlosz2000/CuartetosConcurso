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

// Mapa global para nombres de jurados
let mapaNombresJurados = {};

async function cargarMapaNombresJurados() {
  try {
    const { data: usuariosBD } = await supabase.from('usuario').select('id_usuario, nombres, apellidos');
    if (usuariosBD) {
      usuariosBD.forEach(u => {
        mapaNombresJurados[u.id_usuario] = `${u.nombres || ''} ${u.apellidos || ''}`.trim();
      });
    }
  } catch (e) {
    console.warn('No se pudo cargar el mapa de jurados:', e);
  }
}

/* Helper universal para formatear terna de manera segura (evita error de .join) */
function formatearTernaSegura(ternaRaw) {
  if (!ternaRaw) return 'No asignada';
  
  let ternaObj = typeof ternaRaw === 'string' ? parseJSONSeguro(ternaRaw, ternaRaw) : ternaRaw;

  if (Array.isArray(ternaObj)) {
    return ternaObj.map(j => mapaNombresJurados[j] || j).join(' · ');
  } else if (typeof ternaObj === 'object' && ternaObj !== null) {
    const idA = ternaObj.a || ternaObj[0];
    const idB = ternaObj.b || ternaObj[1];
    const idC = ternaObj.c || ternaObj[2];
    
    const arr = [
      mapaNombresJurados[idA] || idA || 'Jurado A',
      mapaNombresJurados[idB] || idB || 'Jurado B',
      mapaNombresJurados[idC] || idC || 'Jurado C'
    ];
    return arr.join(' · ');
  }
  return String(ternaRaw);
}

/* ============================================================
   CARGA DE PROGRAMACIONES Y TERNAS DESDE SUPABASE / S5
   ============================================================ */
async function cargarDatosDinamicosBD() {
  await cargarMapaNombresJurados();

  const ternasGuardadas = parseJSONSeguro(localStorage.getItem('concurso_ternas_auditorio'), null);
  if (ternasGuardadas) {
    auditorios.forEach(aud => {
      if (ternasGuardadas[aud.nombre]) {
        aud.terna = ternasGuardadas[aud.nombre];
      }
    });
  }

  // Sincronizar ternas desde configuracion_concurso en Supabase si existen
  try {
    const { data: config } = await supabase.from('configuracion_concurso').select('ternas_auditorios').eq('id', 1).maybeSingle();
    if (config && config.ternas_auditorios) {
      const ternasSupabase = typeof config.ternas_auditorios === 'string' ? JSON.parse(config.ternas_auditorios) : config.ternas_auditorios;
      auditorios.forEach(aud => {
        if (ternasSupabase[aud.nombre]) {
          aud.terna = ternasSupabase[aud.nombre];
        }
      });
    }
  } catch (e) {}

  try {
    // 1. Consultar únicamente programados que NO estén descalificados
    const { data: programadosBD, error } = await supabase
      .from('cuarteto')
      .select('*')
      .not('auditorio', 'is', null)
      .neq('estado_presentacion', 'Descalificado');

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
   CARGA DE CUARTETOS DESDE SUPABASE (EXCLUYENDO DESCALIFICADOS)
   ============================================================ */
async function inicializarSelectoresAuditorioYCuarteto() {
  const selectAud = document.getElementById('selectAuditorio');
  const selectCuarteto = document.getElementById('selectCuarteto');

  if (!selectAud || !selectCuarteto) return;

  const audActual = selectAud.value;
  const cuartetoActual = selectCuarteto.value;

  try {
    const { data: cuartetosBD, error } = await supabase
      .from('cuarteto')
      .select('*')
      .eq('estado_inscripcion', 'Inscrito')
      .neq('estado_presentacion', 'Descalificado');

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

  // Poblar Auditorios
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

  // Poblar Cuartetos
  selectCuarteto.innerHTML = '<option value="">-- Seleccionar Cuarteto a Programar --</option>';
  if (cuartetos.length === 0) {
    const opt = document.createElement('option');
    opt.value = "";
    opt.disabled = true;
    opt.textContent = "No hay cuartetos disponibles";
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
            ${formatearTernaSegura(aud.terna)}
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
        🏛️ <strong>${aud.nombre}</strong> (${aud.sede} · Capacidad: ${aud.capacidad}) · 👨‍⚖️ <strong>Terna (RF-33):</strong> ${formatearTernaSegura(aud.terna)}
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
        Cuarteto: <strong>${cuarteto.nombre}</strong> (${cuarteto.codigo}) · Terna: ${formatearTernaSegura(aud.terna)}
      </div>
    `;
    btnProgramar.disabled = false;
  } else {
    resumenBox.style.display = 'none';
    if (!horarioSeleccionadoActual) btnProgramar.disabled = true;
  }
}

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
      <td><small>${formatearTernaSegura(prog.terna)}</small></td>
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

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') cerrarTodosLosModales();
  });
}

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
  setT('citacionJurados', formatearTernaSegura(prog.terna));

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
      <strong>Terna de Jurados (RF-33):</strong> ${formatearTernaSegura(turno.terna)}
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

async function abrirModalCatalogoJurados() {
  const modal = document.getElementById('modalCatalogoJurados');
  if (!modal) return;
  await renderTablaCatalogoJurados();
  modal.style.display = 'flex';
}

function cerrarModalCatalogoJurados() {
  const modal = document.getElementById('modalCatalogoJurados');
  if (modal) modal.style.display = 'none';
}

/* ============================================================
   CONSULTA DINÁMICA DE JURADOS DESDE SUPABASE (S5)
   ============================================================ */
async function renderTablaCatalogoJurados() {
  const tbody = document.getElementById('tablaJuradosBody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:var(--muted);">Cargando jurados desde Supabase...</td></tr>`;

  try {
    const { data: juradosBD, error } = await supabase
      .from('usuario')
      .select('*')
      .eq('id_rol', 7);

    if (error) throw error;

    const listaJurados = juradosBD || [];

    if (listaJurados.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; padding:24px; color:var(--muted);">
            No hay jurados registrados en Supabase. Registre cuentas de jurado desde el Subsistema 5 (Panel Administrador).
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = listaJurados.map((j, idx) => {
      const nombreCompleto = `${j.nombres || ''} ${j.apellidos || ''}`.trim() || j.nombre || 'Sin Nombre';
      const correoInst = j.correo_institucional || j.correo || '—';
      const especialidadMus = j.especialidad || 'Música de Cámara';
      const documentoDni = j.dni || '—';
      const institucionOrig = j.institucion || 'Conservatorio Nacional';

      return `
        <tr>
          <td><strong>#${idx + 1}</strong></td>
          <td><strong>${nombreCompleto}</strong><br><small style="color:var(--muted);">${correoInst}</small></td>
          <td>${especialidadMus}</td>
          <td><span class="badge badge-code">${documentoDni}</span></td>
          <td>${institucionOrig}</td>
          <td><span class="table-badge-auditorio" style="font-size:11px;">🏛️ Habilitado (Supabase)</span></td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    console.error('Error al obtener jurados de Supabase:', err);
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; color:var(--danger); padding:20px;">
          Error al cargar la nómina de jurados: ${err.message}
        </td>
      </tr>
    `;
  }
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