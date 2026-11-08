/* ============================================================
   CORE · DATOS COMPARTIDOS DEL CONCURSO
   Fuente única de verdad para todos los roles (localStorage hoy,
   Supabase mañana). No contiene lógica de vistas.
   ============================================================ */
const KEYS = {
  OBRAS: 'concurso_s1_catalogo_obras',
  CUARTETOS: 'concurso_s3_expedientes_cuartetos',
  HISTORIAL_DNI: 'concurso_s3_historial_dni',
  PROGRAMACIONES: 'concurso_cuartetos_s4_programaciones',
  JURADOS: 'concurso_s5_jurados_cuentas',
  TERNAS_AUDITORIO: 'concurso_s5_ternas_auditorio',
  EVALUACIONES: 'concurso_s6_evaluaciones_inmutables',
  ESTADO_CONCURSO: 'concurso_s7_estado_global',
  CORREOS: 'concurso_notificaciones_correo'
};

/* ---------------- DATOS SEMILLA ---------------- */
const OBRAS_SEED = [
  { id: 1, titulo: 'Cuarteto en Fa Mayor', compositor: 'Maurice Ravel', duracion: '8:00' },
  { id: 2, titulo: 'Cuarteto en Re menor K.421', compositor: 'Wolfgang A. Mozart', duracion: '9:00' },
  { id: 3, titulo: 'Cuarteto No. 2', compositor: 'Alexander Borodin', duracion: '7:15' },
  { id: 4, titulo: 'Cuarteto Op.18 No.1', compositor: 'Ludwig van Beethoven', duracion: '8:30' },
  { id: 5, titulo: 'Cuarteto Op.76 No.3 Emperador', compositor: 'Joseph Haydn', duracion: '8:45' }
];

const HISTORIAL_DNI_SEED = [
  { dni: '45891203', nombre: 'Marco Villavicencio', edicion: 'Edición 2024 · Primera Eliminatoria', cuartetoPrevio: 'Arpeggio Quartet' },
  { dni: '71234567', nombre: 'Valeria Delgado', edicion: 'Edición 2025 · Semifinal', cuartetoPrevio: 'Ensemble Austral' }
];

const CUARTETOS_EXPEDIENTES_SEED = [
  {
    codigo: 'CQ-2026-0147', nombre: 'Harmonia String Quartet',
    profesor: 'Dra. Beatriz Morales',
    correoRepresentante: 'harmonia.rep@cons.pe', correoProfesor: 'bmorales@cons.pe',
    obraObligatoria: 'Cuarteto en Fa Mayor (Maurice Ravel)',
    obraLibre: 'Cuarteto No. 2 (Alexander Borodin)',
    integrantes: [
      { nombre: 'Lucía Fernández', edad: 21, dni: '72104511', correo: 'lfernandez@cons.pe', instrumento: 'Violín 1' },
      { nombre: 'Sebastián Rojas', edad: 22, dni: '73401922', correo: 'srojas@cons.pe', instrumento: 'Violín 2' },
      { nombre: 'Camila Vargas', edad: 20, dni: '74901183', correo: 'cvargas@cons.pe', instrumento: 'Viola' },
      { nombre: 'Mateo Quispe', edad: 23, dni: '75112094', correo: 'mquispe@cons.pe', instrumento: 'Violonchelo' }
    ],
    estadoFicha: 'Validado', motivoObservacion: '',
    faseAsignada: 'Primera Eliminatoria',
    antecedentesDetectados: 'Sin antecedentes previos (0/4 DNIs)'
  },
  {
    codigo: 'CQ-2026-0149', nombre: 'Sinfonia String Quartet',
    profesor: 'Dr. Luis Paredes',
    correoRepresentante: 'sinfonia.rep@cons.pe', correoProfesor: 'lparedes@cons.pe',
    obraObligatoria: 'Cuarteto en Re menor K.421 (Wolfgang A. Mozart)',
    obraLibre: 'Cuarteto Op.18 No.1 (Ludwig van Beethoven)',
    integrantes: [
      { nombre: 'Diego Alarcón', edad: 22, dni: '70192831', correo: 'dalarcon@cons.pe', instrumento: 'Violín 1' },
      { nombre: 'Andrea Huamán', edad: 21, dni: '70293842', correo: 'ahuaman@cons.pe', instrumento: 'Violín 2' },
      { nombre: 'Rodrigo Paz', edad: 24, dni: '70394853', correo: 'rpaz@cons.pe', instrumento: 'Viola' },
      { nombre: 'Sofía Medina', edad: 20, dni: '70495864', correo: 'smedina@cons.pe', instrumento: 'Violonchelo' }
    ],
    estadoFicha: 'Validado', motivoObservacion: '',
    faseAsignada: 'Primera Eliminatoria',
    antecedentesDetectados: 'Sin antecedentes previos (0/4 DNIs)'
  },
  {
    codigo: 'CQ-2026-0151', nombre: 'Arpeggio Quartet',
    profesor: 'Mg. Ana Torres',
    correoRepresentante: 'arpeggio.rep@cons.pe', correoProfesor: 'atorres@cons.pe',
    obraObligatoria: 'Cuarteto Op.76 No.3 Emperador (Joseph Haydn)',
    obraLibre: 'Cuarteto No. 2 (Alexander Borodin)',
    integrantes: [
      { nombre: 'Marco Villavicencio', edad: 24, dni: '45891203', correo: 'mvillavicencio@cons.pe', instrumento: 'Violín 1' },
      { nombre: 'Elena Salazar', edad: 22, dni: '76123981', correo: 'esalazar@cons.pe', instrumento: 'Violín 2' },
      { nombre: 'Gabriel Castro', edad: 23, dni: '76234982', correo: 'gcastro@cons.pe', instrumento: 'Viola' },
      { nombre: 'Paula Mendoza', edad: 21, dni: '76345983', correo: 'pmendoza@cons.pe', instrumento: 'Violonchelo' }
    ],
    estadoFicha: 'Validado', motivoObservacion: '',
    faseAsignada: 'Segunda Eliminatoria',
    antecedentesDetectados: 'DNI 45891203 participó en Edición 2024'
  },
  {
    codigo: 'CQ-2026-0152', nombre: 'Camerata Ensemble',
    profesor: 'Dra. Lucía León',
    correoRepresentante: 'camerata.rep@cons.pe', correoProfesor: 'lleon@cons.pe',
    obraObligatoria: 'Cuarteto en Fa Mayor (Maurice Ravel)',
    obraLibre: 'Cuarteto en Re menor K.421 (Mozart)',
    integrantes: [
      { nombre: 'Joaquín Lira', edad: 19, dni: '78112233', correo: 'jlira@cons.pe', instrumento: 'Violín 1' },
      { nombre: 'Natalia Chávez', edad: 20, dni: '78223344', correo: 'nchavez@cons.pe', instrumento: 'Violín 2' },
      { nombre: 'Braulio Reyes', edad: 21, dni: '78334455', correo: 'breyes@cons.pe', instrumento: 'Viola' },
      { nombre: 'Clara Fuentes', edad: 22, dni: '78445566', correo: 'cfuentes@cons.pe', instrumento: 'Violonchelo' }
    ],
    estadoFicha: 'Preinscripción Completa', motivoObservacion: '',
    faseAsignada: 'Pendiente de Filtro',
    antecedentesDetectados: 'Pendiente de filtro histórico'
  }
];

const JURADOS_CUENTAS_SEED = [
  { id: 1, nombre: 'Dra. Beatriz Morales', dni: '45678912', correo: 'bmorales@conservatorio.edu.pe', especialidad: 'Música de Cámara y Violín', credencial: 'JUR-2026-BM91', auditorio: 'Auditorio Principal', etiqueta: 'Jurado A' },
  { id: 2, nombre: 'Dr. Luis Paredes', dni: '23456789', correo: 'lparedes@conservatorio.edu.pe', especialidad: 'Violín Solista', credencial: 'JUR-2026-LP82', auditorio: 'Auditorio Principal', etiqueta: 'Jurado B' },
  { id: 3, nombre: 'Mg. Ana Torres', dni: '34567890', correo: 'atorres@conservatorio.edu.pe', especialidad: 'Viola y Práctica Orquestal', credencial: 'JUR-2026-AT73', auditorio: 'Auditorio Principal', etiqueta: 'Jurado C' },
  { id: 4, nombre: 'Dr. Carlos Mendoza', dni: '45678901', correo: 'cmendoza@conservatorio.edu.pe', especialidad: 'Violonchelo y Cuartetos', credencial: 'JUR-2026-CM64', auditorio: 'Auditorio B — Sala Beethoven', etiqueta: 'Jurado A' },
  { id: 5, nombre: 'Dra. María Salazar', dni: '56789012', correo: 'msalazar@conservatorio.edu.pe', especialidad: 'Violonchelo Barroco', credencial: 'JUR-2026-MS55', auditorio: 'Auditorio B — Sala Beethoven', etiqueta: 'Jurado B' },
  { id: 6, nombre: 'Mtro. Eduardo Valdivia', dni: '67890123', correo: 'evaldivia@conservatorio.edu.pe', especialidad: 'Violín Primero y Concertino', credencial: 'JUR-2026-EV46', auditorio: 'Auditorio B — Sala Beethoven', etiqueta: 'Jurado C' },
  { id: 7, nombre: 'Dra. Patricia Sotomayor', dni: '78901234', correo: 'psotomayor@conservatorio.edu.pe', especialidad: 'Viola de Concierto', credencial: 'JUR-2026-PS37', auditorio: 'Auditorio C — Sala Mozart', etiqueta: 'Jurado A' },
  { id: 8, nombre: 'Dr. Gonzalo Cárdenas', dni: '89012345', correo: 'gcardenas@conservatorio.edu.pe', especialidad: 'Violonchelo y Ensamble', credencial: 'JUR-2026-GC28', auditorio: 'Auditorio C — Sala Mozart', etiqueta: 'Jurado B' },
  { id: 9, nombre: 'Mg. Valeria Benavides', dni: '90123456', correo: 'vbenavides@conservatorio.edu.pe', especialidad: 'Violín y Cuarteto Clásico', credencial: 'JUR-2026-VB19', auditorio: 'Auditorio C — Sala Mozart', etiqueta: 'Jurado C' }
];

const EVALUACIONES_SEED = [
  {
    codigoCuarteto: 'CQ-2026-0147', nombreCuarteto: 'Harmonia String Quartet',
    auditorio: 'Auditorio C — Sala Mozart', fecha: '2026-10-15', hora: '09:30 AM', orden: 1,
    obraObligatoria: 'Cuarteto en Fa Mayor (Ravel)', obraLibre: 'Cuarteto No. 2 (Borodin)',
    profesor: 'Dra. Beatriz Morales', estadoPresentacion: 'Evaluado', motivoDescalificacion: '',
    notas: {
      A: { valor: 9.0, jurado: 'Dra. Patricia Sotomayor', fecha: '15/10/2026 09:55', inmutable: true },
      B: { valor: 9.5, jurado: 'Dr. Gonzalo Cárdenas', fecha: '15/10/2026 09:56', inmutable: true },
      C: { valor: 9.1, jurado: 'Mg. Valeria Benavides', fecha: '15/10/2026 09:57', inmutable: true }
    }
  },
  {
    codigoCuarteto: 'CQ-2026-0149', nombreCuarteto: 'Sinfonia String Quartet',
    auditorio: 'Auditorio Principal', fecha: '2026-10-15', hora: '10:00 AM', orden: 2,
    obraObligatoria: 'Cuarteto en Re menor K.421 (Mozart)', obraLibre: 'Cuarteto Op.18 No.1 (Beethoven)',
    profesor: 'Dra. Lucía León', estadoPresentacion: 'Evaluado', motivoDescalificacion: '',
    notas: {
      A: { valor: 8.8, jurado: 'Dra. Beatriz Morales', fecha: '15/10/2026 10:25', inmutable: true },
      B: { valor: 9.0, jurado: 'Dr. Luis Paredes', fecha: '15/10/2026 10:26', inmutable: true },
      C: { valor: 8.9, jurado: 'Mg. Ana Torres', fecha: '15/10/2026 10:27', inmutable: true }
    }
  },
  {
    codigoCuarteto: 'CQ-2026-0151', nombreCuarteto: 'Arpeggio Quartet',
    auditorio: 'Auditorio B — Sala Beethoven', fecha: '2026-10-15', hora: '10:00 AM', orden: 3,
    obraObligatoria: 'Cuarteto Op.76 No.3 (Haydn)', obraLibre: 'Cuarteto No. 2 (Borodin)',
    profesor: 'Mg. Ana Torres', estadoPresentacion: 'Programado', motivoDescalificacion: '',
    notas: {
      A: { valor: 8.6, jurado: 'Dr. Carlos Mendoza', fecha: '15/10/2026 10:25', inmutable: true },
      B: { valor: 8.7, jurado: 'Dra. María Salazar', fecha: '15/10/2026 10:26', inmutable: true },
      C: { valor: null, jurado: 'Mtro. Eduardo Valdivia', fecha: null, inmutable: false }
    }
  }
];

const ESTADO_CONCURSO_SEED = {
  faseEliminatoriaEstado: 'Activa',
  faseFinalEstado: 'Activa',
  cuadroPublicado: false,
  edicionArchivada: false,
  cuposClasificacion: 3,
  ganadores: null,
  fechaArchivado: null
};

/* ---------------- ESTADO GLOBAL EN MEMORIA ---------------- */
let s1Obras = [];
let s3Cuartetos = [];
let s3HistorialDni = [];
let s5Jurados = [];
let s6Evaluaciones = [];
let s7Estado = {};
let s4Programaciones = [];

/* ---------------- UTILIDADES DE PERSISTENCIA ---------------- */
function safeGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return JSON.parse(JSON.stringify(fallback));
}

function safeSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
}

function showToast(msg, tipo) {
  let cont = document.getElementById('toastContainer');
  if (!cont) {
    cont = document.createElement('div');
    cont.id = 'toastContainer';
    cont.className = 'toast-container';
    document.body.appendChild(cont);
  }
  const item = document.createElement('div');
  item.className = 'toast-item';
  if (tipo === 'error') item.style.borderLeftColor = '#ef4444';
  if (tipo === 'ok') item.style.borderLeftColor = '#22c55e';
  item.innerHTML = msg;
  cont.appendChild(item);
  setTimeout(() => item.remove(), 4200);
}

function registrarCorreoSimulado(para, asunto, detalle, rf) {
  const correos = safeGet(KEYS.CORREOS, []);
  correos.unshift({
    id: 'MAIL-' + Math.floor(Math.random() * 9000 + 1000),
    fecha: new Date().toLocaleString('es-PE'),
    para, asunto, detalle, rf
  });
  safeSet(KEYS.CORREOS, correos.slice(0, 30));
}

/* ---------------- CARGA / GUARDADO TOTAL ---------------- */
function cargarEstadoSubsistemas() {
  s1Obras = safeGet(KEYS.OBRAS, OBRAS_SEED);
  s3Cuartetos = safeGet(KEYS.CUARTETOS, CUARTETOS_EXPEDIENTES_SEED);
  s3HistorialDni = safeGet(KEYS.HISTORIAL_DNI, HISTORIAL_DNI_SEED);
  s5Jurados = safeGet(KEYS.JURADOS, JURADOS_CUENTAS_SEED);
  s6Evaluaciones = safeGet(KEYS.EVALUACIONES, EVALUACIONES_SEED);
  s7Estado = safeGet(KEYS.ESTADO_CONCURSO, ESTADO_CONCURSO_SEED);
  s4Programaciones = safeGet(KEYS.PROGRAMACIONES, []);

  // Sincronizar cuarteto creado en S2 (wizard) si existe
  try {
    const fRaw = localStorage.getItem('concurso_cuartetos_ficha');
    if (fRaw) {
      const f = JSON.parse(fRaw);
      if (f && f.codigo && f.nombre && !s3Cuartetos.some(c => c.codigo === f.codigo)) {
        s3Cuartetos.unshift({
          codigo: f.codigo,
          nombre: f.nombre,
          profesor: f.profesor ? f.profesor.nombre : 'Dra. Beatriz Morales',
          correoRepresentante: (f.integrantes && f.integrantes[0] && f.integrantes[0].correo) || 'representante@cons.pe',
          correoProfesor: (f.profesor && f.profesor.correo) || 'docente@cons.pe',
          obraObligatoria: f.repertorio && f.repertorio.obligatoria ? f.repertorio.obligatoria.titulo : 'Cuarteto en Fa Mayor',
          obraLibre: f.repertorio && f.repertorio.libre ? f.repertorio.libre.titulo : 'Obra Libre',
          integrantes: f.integrantes && f.integrantes.length === 4 ? f.integrantes : CUARTETOS_EXPEDIENTES_SEED[0].integrantes,
          estadoFicha: f.estado === 'observado' ? 'Observado' : (f.estado === 'rechazado' ? 'Rechazado' : 'Preinscripción Completa'),
          motivoObservacion: f.motivo || '',
          faseAsignada: 'Pendiente de Filtro',
          antecedentesDetectados: 'Pendiente de filtro histórico'
        });
        safeSet(KEYS.CUARTETOS, s3Cuartetos);
      }
    }
  } catch (e) {}
}

function guardarTodoSubsistemas() {
  safeSet(KEYS.OBRAS, s1Obras);
  safeSet(KEYS.CUARTETOS, s3Cuartetos);
  safeSet(KEYS.HISTORIAL_DNI, s3HistorialDni);
  safeSet(KEYS.JURADOS, s5Jurados);
  safeSet(KEYS.EVALUACIONES, s6Evaluaciones);
  safeSet(KEYS.ESTADO_CONCURSO, s7Estado);
}