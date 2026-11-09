
import { supabase } from '../config/supabase.js';
import { validarNombreCuartetoUnico } from './services/validacionService.js';
import { validarDniIntegranteUnico, validarCorreoIntegranteUnico } from './services/validacionService.js';
import { obtenerUltimoCuartetoConDetalles } from './services/cuartetoService.js';
import { obtenerDocentesHabilitadosBD } from './services/profesorService.js';
import { obtenerObrasObligatoriasBD, guardarInscripcionCompletaBD } from './services/repertorioService.js';
function getCatalogoObrasActivo() {
  try {
    const saved = localStorage.getItem('concurso_s1_catalogo_obras');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return [...parsed].sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));
      }
    }
  } catch (e) { }
  return [...CATALOGO_OBRAS_DEFAULT].sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));
}


function getProgramacionCuartetoApp(codigo, nombre) {
  try {
    const progsGuardadas = localStorage.getItem('concurso_cuartetos_s4_programaciones');
    if (progsGuardadas) {
      const progs = JSON.parse(progsGuardadas);
      return progs.find(p =>
        (codigo && p.codigoCuarteto === codigo) ||
        (nombre && p.cuartetoNombre && p.cuartetoNombre.toLowerCase().trim() === nombre.toLowerCase().trim())
      ) || null;
    }
  } catch (e) { }
  return null;
}
/* ============================================================
   ESTADO GLOBAL (Store)
   ============================================================ */
const Store = {
  currentStep: 1,
  ficha: {
    codigo: null,
    nombre: '',
    integrantes: [],
    profesor: null,
    repertorio: { obligatoria: null, libre: null },
    estado: 'preinscripcion',
    motivo: '',
    historial: []
  }
};

/* ============================================================
   DATOS MOCK
   ============================================================ */
const CATALOGO_OBRAS_DEFAULT = [
  { id: 1, titulo: 'Cuarteto en Fa Mayor', compositor: 'Ravel, M.', duracion: '8:00' },
  { id: 2, titulo: 'Cuarteto Op.18 No.1', compositor: 'Beethoven', duracion: '8:30' },
  { id: 3, titulo: 'Cuarteto No.2', compositor: 'Borodin', duracion: '7:15' },
  { id: 4, titulo: 'Cuarteto en Re menor', compositor: 'Mozart', duracion: '9:00' },
  { id: 5, titulo: 'Cuarteto Op.76 No.3', compositor: 'Haydn', duracion: '8:45' }
];

const DOCENTES = [
  { nombre: 'Dra. Beatriz Morales', dni: '45678912', correo: 'bmorales@cons.pe', especialidad: 'Música de Cámara', esJurado: false },
  { nombre: 'Dr. Luis Paredes', dni: '23456789', correo: 'lparedes@cons.pe', especialidad: 'Violín', esJurado: false },
  { nombre: 'Mg. Ana Torres', dni: '34567890', correo: 'atorres@cons.pe', especialidad: 'Viola', esJurado: false },
  { nombre: 'Dr. Carlos Mendoza', dni: '45678901', correo: 'cmendoza@cons.pe', especialidad: 'Violonchelo', esJurado: true },
  { nombre: 'Dra. María Salazar', dni: '56789012', correo: 'msalazar@cons.pe', especialidad: 'Violonchelo', esJurado: true },
  { nombre: 'Mtro. Roberto Guimaray', dni: '67890123', correo: 'rguimaray@cons.pe', especialidad: 'Violín y Orquesta', esJurado: false },
  { nombre: 'Dra. Elena Bustamante', dni: '78901234', correo: 'ebustamante@cons.pe', especialidad: 'Viola y Música de Cámara', esJurado: false },
  { nombre: 'Mg. Javier Carpio', dni: '89012345', correo: 'jcarpio@cons.pe', especialidad: 'Contrabajo y Cuerdas', esJurado: false },
  { nombre: 'Dra. Lucía León', dni: '90123456', correo: 'lleon@cons.pe', especialidad: 'Violín Clásico', esJurado: false },
  { nombre: 'Dr. Fernando Alván', dni: '12345678', correo: 'falvan@cons.pe', especialidad: 'Dirección y Cámara', esJurado: true }
];

const CUARTETOS_REGISTRADOS = ['Arpeggio Quartet', 'Sinfonia String Quartet', 'Camerata Ensemble'];

const PLANTILLA = [
  { rol: 'Violín 1', idx: 0 },
  { rol: 'Violín 2', idx: 1 },
  { rol: 'Viola', idx: 2 },
  { rol: 'Violonchelo', idx: 3 }
];

/* ============================================================
   UTILIDADES
   ============================================================ */
const $ = id => document.getElementById(id);

const generarCodigo = () => {
  const year = new Date().getFullYear();
  const n = String(Math.floor(Math.random() * 9000) + 1000);
  return `CQ-${year}-${n}`;
};

const hoy = () => new Date().toLocaleString('es-PE', {
  day: '2-digit', month: '2-digit', year: 'numeric',
  hour: '2-digit', minute: '2-digit'
});

/* ============================================================
   NAVEGACIÓN DE VISTAS
   ============================================================ */
function showView(view) {
  ['view-nombre', 'view-integrantes', 'view-profesor', 'view-repertorio', 'view-ficha']
    .forEach(id => $(id).classList.add('hidden'));

  if (view === 'wizard') {
    goToStep(Store.currentStep);
  } else if (view === 'ficha') {
    $('view-ficha').classList.remove('hidden');
    renderFicha();
  }
}

function goToStep(n) {
  Store.currentStep = n;
  ['view-nombre', 'view-integrantes', 'view-profesor', 'view-repertorio', 'view-ficha']
    .forEach(id => $(id).classList.add('hidden'));

  const map = {
    1: 'view-nombre',
    2: 'view-integrantes',
    3: 'view-profesor',
    4: 'view-repertorio'
  };
  $(map[n]).classList.remove('hidden');
  updateStepper();

  if (n === 2) renderIntegrantes();
  if (n === 3) renderDocentes();
  if (n === 4) renderCatalogo();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateStepper() {
  document.querySelectorAll('.step').forEach(el => {
    const s = +el.dataset.step;
    el.classList.remove('active', 'done');
    if (s < Store.currentStep) el.classList.add('done');
    else if (s === Store.currentStep) el.classList.add('active');
  });
}

/* ============================================================
   PASO 1: NOMBRE DEL CUARTETO
   ============================================================ */
let nombreTimer = null;

function initNombreCuarteto() {
  const input = $('nombreCuarteto');
  const btn = $('btnGuardarNombre');
  if (!input || !btn) return;

  btn.disabled = true;


  input.addEventListener('input', async e => {
    clearTimeout(nombreTimer);
    const val = e.target.value.trim();
    const fb = $('nombreFeedback');
    if(!fb) return;
    
    fb.innerHTML = '';
    btn.disabled = true;
    if (!val) return;
    
    if (val.length < 3) {
      fb.innerHTML = '<div class="error">Mínimo 3 caracteres</div>';
      return;
    }
    
    fb.innerHTML = '<div class="hint">⏳ Validando disponibilidad en Supabase...</div>';
    
    nombreTimer = setTimeout(async () => {
      try {
        // Validación directa en la tabla cuarteto de Supabase
        const { data, error } = await supabase
          .from('cuarteto')
          .select('id_cuarteto')
          .ilike('nombre_cuarteto', val);

        if (error) throw error;

        if (data && data.length > 0) {
          fb.innerHTML = '<div class="error">[!] El nombre del cuarteto ya se encuentra registrado (RF-11)</div>';
          btn.disabled = true;
        } else {
          fb.innerHTML = '<div class="ok">[OK] Nombre disponible y único</div>';
          btn.disabled = false;
        }
      } catch (err) {
        console.error('Error validando nombre:', err);
        fb.innerHTML = '<div class="error">Error al conectar con la base de datos</div>';
      }
    }, 600);
  });

  btn.addEventListener('click', () => {
    const nombre = $('nombreCuarteto').value.trim();
    if (!nombre) return;
    Store.ficha.codigo = generarCodigo();
    Store.ficha.nombre = nombre;
    Store.ficha.historial.push({
      t: hoy(),
      a: `Borrador creado · Código ${Store.ficha.codigo}`
    });
    goToStep(2);
  });
}

/* ============================================================
   PASO 2: INTEGRANTES (con persistencia e instrumentos dinámicos)
   ============================================================ */

// Instrumentos disponibles en el concurso
const INSTRUMENTOS_DISPONIBLES = ['Violín 1', 'Violín 2', 'Viola', 'Violonchelo'];

function renderIntegrantes() {
  const c = $('integrantesContainer');
  if (!c) return;

  // Si ya hay datos en el Store, úsalos; si no, inicializa vacíos
  if (Store.ficha.integrantes.length === 0) {
    Store.ficha.integrantes = Array.from({ length: 4 }, () => ({
      nombre: '',
      edad: '',
      dni: '',
      correo: '',
      instrumento: ''
    }));
  }

  const integrantes = Store.ficha.integrantes;

  c.innerHTML = PLANTILLA.map((p, i) => {
    // Calcular instrumentos disponibles para este integrante
    const disponibles = getInstrumentosDisponibles(i, integrantes);

    return `
      <div class="integrante-card">
        <h4>Integrante ${i + 1} <span class="chip">${p.rol} (sugerido)</span></h4>
        <div class="grid-2">
          <div class="form-row">
            <label>Nombre completo <span class="req">*</span></label>
            <input type="text" data-i="${i}" data-f="nombre" 
                   value="${integrantes[i].nombre}" 
                   placeholder="Nombre y apellidos">
          </div>
          <div class="form-row">
            <label>Edad <span class="req">*</span></label>
            <input type="number" data-i="${i}" data-f="edad" 
                   value="${integrantes[i].edad}" 
                   min="14" max="35" placeholder="Ej: 20">
          </div>
          <div class="form-row">
            <label>DNI <span class="req">*</span></label>
            <input type="text" data-i="${i}" data-f="dni" 
                   value="${integrantes[i].dni}" 
                   maxlength="8" placeholder="8 dígitos">
          </div>
          <div class="form-row">
            <label>Correo institucional <span class="req">*</span></label>
            <input type="email" data-i="${i}" data-f="correo" 
                   value="${integrantes[i].correo}" 
                   placeholder="alumno@cons.pe">
          </div>
          <div class="form-row" style="grid-column: 1 / -1;">
            <label>Instrumento <span class="req">*</span></label>
            <select data-i="${i}" data-f="instrumento" class="instrumento-select">
              <option value="">-- Selecciona instrumento --</option>
              ${disponibles.map(inst =>
      `<option value="${inst}" ${integrantes[i].instrumento === inst ? 'selected' : ''}>${inst}</option>`
    ).join('')}
            </select>
            <div class="hint">RNF-07: Plantilla fija · Los instrumentos ya seleccionados no aparecerán</div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Agregar listeners a los selects de instrumento
  document.querySelectorAll('.instrumento-select').forEach(select => {
    select.addEventListener('change', function () {
      const i = +this.dataset.i;
      const nuevoInstrumento = this.value;

      // ⭐ CLAVE: Recoger TODOS los datos actuales del DOM antes de re-renderizar
      const inputs = document.querySelectorAll('#integrantesContainer input, #integrantesContainer select');
      inputs.forEach(inp => {
        const idx = +inp.dataset.i;
        const field = inp.dataset.f;
        Store.ficha.integrantes[idx][field] = inp.value.trim();
      });

      // Actualizar el instrumento seleccionado
      Store.ficha.integrantes[i].instrumento = nuevoInstrumento;

      // Ahora sí re-renderizar con todos los datos actualizados
      renderIntegrantes();
    });
  });
}


/**
 * Calcula qué instrumentos están disponibles para un integrante
 * Excluye los que ya fueron seleccionados por otros integrantes
 */
function getInstrumentosDisponibles(indiceActual, integrantes) {
  // Obtener todos los instrumentos ya seleccionados (excepto el del integrante actual)
  const seleccionados = integrantes
    .map((it, i) => i !== indiceActual ? it.instrumento : null)
    .filter(Boolean);

  // Retornar solo los que no están seleccionados
  return INSTRUMENTOS_DISPONIBLES.filter(inst => !seleccionados.includes(inst));
}

function marcarError(i, campo, msg) {
  const inp = document.querySelector(
    `#integrantesContainer [data-i="${i}"][data-f="${campo}"]`
  );
  if (!inp) return;
  inp.classList.add('invalid');
  const parent = inp.closest('.form-row');
  if (parent && !parent.querySelector('.error')) {
    const div = document.createElement('div');
    div.className = 'error';
    div.textContent = msg;
    parent.appendChild(div);
  }
}

/* ============================================================
   PASO 2: INTEGRANTES (Validación local y contra Supabase)
   ============================================================ */
async function guardarIntegrantes() {
  // 1. AQUÍ COLOCAS LA VARIABLE DE EDICIÓN (en la zona del óvalo rojo)
  const idEdicionActual = Store.ficha.id || null;

  const inputs = document.querySelectorAll(
    '#integrantesContainer input, #integrantesContainer select'
  );
  const errores = [];

  // Limpiar errores visuales previos
  inputs.forEach(inp => {
    inp.classList.remove('invalid');
    const parent = inp.closest('.form-row');
    const err = parent?.querySelector('.error');
    if (err) err.remove();
  });

  // Recoger datos y actualizar Store
  inputs.forEach(inp => {
    const i = +inp.dataset.i;
    const f = inp.dataset.f;
    Store.ficha.integrantes[i][f] = inp.value.trim();
  });

  const integrantes = Store.ficha.integrantes;
  let errorEnBD = false;

  // 2. MÁS ABAJO, EN EL BUCLE DE VALIDACIÓN, LE PASAS EL ID:
  for (let i = 0; i < integrantes.length; i++) {
    const it = integrantes[i];

    // Aquí pasas idEdicionActual como segundo parámetro:
    const existeDni = await validarDniIntegranteUnico(it.dni, idEdicionActual);
    if (existeDni) {
      marcarError(i, 'dni', `El DNI ${it.dni} ya está registrado en otro cuarteto (RF-15)`);
      errorEnBD = true;
    }

    const existeCorreo = await validarCorreoIntegranteUnico(it.correo, idEdicionActual);
    if (existeCorreo) {
      marcarError(i, 'correo', `El correo ${it.correo} ya está registrado en otro cuarteto`);
      errorEnBD = true;
    }
  }

  // Limpiar errores visuales previos
  inputs.forEach(inp => {
    inp.classList.remove('invalid');
    const parent = inp.closest('.form-row');
    const err = parent?.querySelector('.error');
    if (err) err.remove();
  });

  // Recoger datos y actualizar Store
  inputs.forEach(inp => {
    const i = +inp.dataset.i;
    const f = inp.dataset.f;
    Store.ficha.integrantes[i][f] = inp.value.trim();
  });

  // 1. Validaciones básicas de formato por cada integrante
  integrantes.forEach((it, i) => {
    // Validar nombre (solo letras y espacios, sin números)
    const soloLetrasRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
    if (!it.nombre) {
      marcarError(i, 'nombre', 'Nombre obligatorio');
      errores.push(`Integrante ${i + 1}: nombre vacío`);
    } else if (!soloLetrasRegex.test(it.nombre)) {
      marcarError(i, 'nombre', 'El nombre solo debe contener letras (sin números ni símbolos)');
      errores.push(`Integrante ${i + 1}: nombre con formato inválido`);
    }

    if (!it.edad) {
      marcarError(i, 'edad', 'Edad obligatoria');
      errores.push(`Integrante ${i + 1}: edad vacía`);
    } else if (it.edad < 14 || it.edad > 35) {
      marcarError(i, 'edad', 'Edad debe estar entre 14 y 35 años');
      errores.push(`Integrante ${i + 1}: edad fuera de rango`);
    }

    if (!it.dni) {
      marcarError(i, 'dni', 'DNI obligatorio');
      errores.push(`Integrante ${i + 1}: DNI vacío`);
    } else if (!/^\d{8}$/.test(it.dni)) {
      marcarError(i, 'dni', 'El DNI debe tener exactamente 8 dígitos numéricos');
      errores.push(`Integrante ${i + 1}: DNI inválido`);
    }

    if (!it.correo) {
      marcarError(i, 'correo', 'Correo obligatorio');
      errores.push(`Integrante ${i + 1}: correo vacío`);
    } else if (!it.correo.endsWith('@cons.pe')) {
      marcarError(i, 'correo', 'Debe ser un correo institucional @cons.pe');
      errores.push(`Integrante ${i + 1}: correo institucional inválido`);
    }

    if (!it.instrumento) {
      marcarError(i, 'instrumento', 'Instrumento obligatorio');
      errores.push(`Integrante ${i + 1}: instrumento no seleccionado`);
    }
  });

  // 2. Validar DNIs duplicados internos (dentro del mismo formulario)
  const dnis = integrantes.map(x => x.dni).filter(Boolean);
  if (new Set(dnis).size !== dnis.length) {
    errores.push('Hay DNIs duplicados entre los integrantes de este cuarteto');
    const seen = {};
    integrantes.forEach((it, i) => {
      if (seen[it.dni] !== undefined) {
        marcarError(i, 'dni', 'DNI repetido en otro integrante del grupo');
        marcarError(seen[it.dni], 'dni', 'DNI repetido en otro integrante del grupo');
      } else {
        seen[it.dni] = i;
      }
    });
  }

  // 3. Validar correos duplicados internos
  const correos = integrantes.map(x => x.correo).filter(Boolean);
  if (new Set(correos).size !== correos.length) {
    errores.push('Hay correos institucionales duplicados en este cuarteto');
    const seenCorreo = {};
    integrantes.forEach((it, i) => {
      if (seenCorreo[it.correo] !== undefined) {
        marcarError(i, 'correo', 'Correo repetido en otro integrante');
        marcarError(seenCorreo[it.correo], 'correo', 'Correo repetido en otro integrante');
      } else {
        seenCorreo[it.correo] = i;
      }
    });
  }

  if (errores.length > 0) {
    const primerError = document.querySelector('#integrantesContainer .invalid');
    if (primerError) primerError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  // 4. Validar contra la BASE DE DATOS de Supabase (DNI o Correo ya registrados en otros cuartetos)
  //Mostramos un mensaje de espera rápido
  // 4. Validar contra la BASE DE DATOS de Supabase (DNI o Correo ya registrados en otros cuartetos)
  const btnGuardar = $('btnGuardarIntegrantes');
  if (btnGuardar) {
    btnGuardar.disabled = true;
    btnGuardar.textContent = 'Verificando con BD...';
  }

  for (let i = 0; i < integrantes.length; i++) {
    const it = integrantes[i];

    // Consultar Supabase si el DNI ya existe en la tabla 'integrante'
    const existeDni = await validarDniIntegranteUnico(it.dni, idEdicionActual);
    if (existeDni) {
      marcarError(i, 'dni', `El DNI ${it.dni} ya está registrado en otro cuarteto (RF-15)`);
      errorEnBD = true;
    }

    // Consultar Supabase si el correo ya existe en la tabla 'integrante'
    const existeCorreo = await validarCorreoIntegranteUnico(it.correo, idEdicionActual);
    if (existeCorreo) {
      marcarError(i, 'correo', `El correo ${it.correo} ya está registrado en otro cuarteto`);
      errorEnBD = true;
    }
  }

  if (btnGuardar) {
    btnGuardar.disabled = false;
    btnGuardar.textContent = 'Guardar y Continuar →';
  }

  // 🛑 BLOQUEO OBLIGATORIO SI HAY ERRORES EN LA BD
  if (errorEnBD) {
    alert('⚠️ No se puede avanzar: Uno o más DNIs o correos institucionales ya se encuentran registrados en otros cuartetos.');
    const primerError = document.querySelector('#integrantesContainer .invalid');
    if (primerError) primerError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return; // <--- Esto frena el paso al siguiente nivel de inmediato
  }

  // Si pasa todas las validaciones, avanza al Paso 3
  Store.ficha.historial.push({
    t: hoy(),
    a: '4 integrantes registrados · DNI únicos validados en BD · Plantilla correcta'
  });
  goToStep(3);
}

/* ============================================================
   PASO 3: PROFESOR (Conectado a Supabase)
   ============================================================ */
let listaDocentesBD = [];

async function renderDocentes() {
  const cont = $('sugerenciasDocentes');
  if (cont) cont.innerHTML = '<div class="hint">⏳ Cargando docentes de la base de datos...</div>';
  
  // Cargar docentes activos desde Supabase
  listaDocentesBD = await obtenerDocentesHabilitadosBD();
  filtrarDocentes();
}

function filtrarDocentes() {
  const input = $('buscarDocente');
  if (!input) return;
  const q = input.value.toLowerCase().trim();
  
  const lista = listaDocentesBD.filter(d => 
    d.nombre.toLowerCase().includes(q) || 
    d.dni.includes(q) || 
    d.correo.toLowerCase().includes(q)
  );

  const cont = $('sugerenciasDocentes');
  if (cont) {
    if (lista.length === 0) {
      cont.innerHTML = '<div class="hint" style="color:var(--danger)">No se encontraron docentes activos con ese criterio</div>';
      return;
    }

    cont.innerHTML = lista.map(d => {
      if (d.esJurado) {
        return `<button class="docente-btn jurado-btn" data-id="${d.id}" style="border-color:var(--danger); color:var(--danger); background:var(--danger-soft);">
                  ⚖️ ${d.nombre} (Jurado)
                </button>`;
      }
      return `<button class="docente-btn" data-id="${d.id}">
                👨‍🏫 ${d.nombre}
              </button>`;
    }).join('');
  }
}

function seleccionarDocente(idDocente) {
  const d = listaDocentesBD.find(x => x.id === idDocente);
  if (!d) return;

  const info = $('docenteInfo');
  const btn = $('btnGuardarProfesor');

  if (d.esJurado) {
    info.innerHTML = `
      <div class="alert alert-danger" style="margin-top:12px;">
        <div>
          <strong>⚠️ Incompatibilidad por Conflicto de Interés (HU-06 / RF-18)</strong><br>
          <strong>${d.nombre}</strong> tiene rol activo de <b>${d.rolNombre}</b> en el concurso.
          <br><small>Bloqueo automático: Un integrante de la Terna de Jurados no puede ser profesor responsable de un cuarteto.</small>
        </div>
      </div>`;
    if (btn) btn.disabled = true;
    Store.ficha.profesor = null;
    return;
  }

  info.innerHTML = `
    <div class="docente-info" style="margin-top:12px; background:#f0fdf4; border:1px solid #86efac; padding:14px; border-radius:8px;">
      <strong style="font-size:15px; color:#166534;">👨‍🏫 ${d.nombre}</strong><br>
      <span style="font-size:13px; color:var(--muted);">DNI: ${d.dni} · Correo: ${d.correo}</span><br>
      <span style="color:var(--success); font-weight:600; font-size:12px;">[OK] Docente activo · Rol: ${d.rolNombre} (Sin conflicto de interés)</span>
    </div>`;

  // Guardar en el estado global el ID de usuario real de Supabase
  Store.ficha.profesor = {
    id_usuario: d.id,
    nombre: d.nombre,
    dni: d.dni,
    correo: d.correo
  };

  if (btn) btn.disabled = false;
}
//Esto borro?
function guardarProfesor() {
  if (!Store.ficha.profesor) return;
  Store.ficha.historial.push({
    t: hoy(),
    a: `Profesor vinculado: ${Store.ficha.profesor.nombre} · Notificación enviada (RF-13)`
  });
  goToStep(4);
}

/* ============================================================
   PASO 4: REPERTORIO (Consulta y guardado en Supabase)
   ============================================================ */
let obrasObligatoriasBD = [];

async function renderCatalogo() {
  const sel = $('obraObligatoria');
  if (!sel) return;

  sel.innerHTML = '<option value="">⏳ Cargando catálogo de obras desde Supabase...</option>';

  obrasObligatoriasBD = await obtenerObrasObligatoriasBD();

  if (obrasObligatoriasBD.length === 0) {
    sel.innerHTML = '<option value="">-- No hay obras obligatorias disponibles --</option>';
    return;
  }

  sel.innerHTML = '<option value="">-- Selecciona una obra del catálogo --</option>' +
    obrasObligatoriasBD.map(o =>
      `<option value="${o.id_obra}">${o.titulo} ${o.compositor ? '· ' + o.compositor : ''}</option>`
    ).join('');
}

async function finalizarInscripcion() {
  const idObra = $('obraObligatoria').value;
  const titulo = $('obraLibreTitulo').value.trim();
  const comp = $('obraLibreCompositor').value.trim();
  const dur = $('obraLibreDuracion').value.trim();

  if (!idObra) {
    alert('⚠️ Selecciona una obra obligatoria del catálogo institucional');
    return;
  }
  if (!titulo) {
    alert('⚠️ El título de la obra libre es obligatorio');
    return;
  }

  // Validación de Compositor (Solo letras, espacios, puntos, comas y guiones)
  const compRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s.,-]+$/;
  if (!comp) {
    alert('⚠️ El nombre del compositor es obligatorio');
    return;
  } else if (!compRegex.test(comp)) {
    alert('⚠️ El nombre del compositor solo debe contener letras, puntos, comas o guiones (sin números ni símbolos)');
    return;
  }

  // Validación de Duración estimada (Formato MM:SS o número de minutos)
  const durRegex = /^([0-5]?[0-9]):([0-5][0-9])$/; // ej: 07:15 o 12:30
  let duracionSegundos = 0;

  if (!dur) {
    alert('⚠️ La duración estimada es obligatoria (Ej: 7:15)');
    return;
  } else if (durRegex.test(dur)) {
    const [min, seg] = dur.split(':').map(Number);
    duracionSegundos = min * 60 + seg;
  } else if (!isNaN(dur) && Number(dur) > 0) {
    duracionSegundos = Math.round(Number(dur) * 60);
  } else {
    alert('⚠️ Formato de duración inválido. Usa el formato Minutos:Segundos (Ejemplo: 7:15)');
    return;
  }

  const obraObligadaObj = obrasObligatoriasBD.find(o => o.id_obra == idObra);

  Store.ficha.repertorio = {
    obligatoria: obraObligadaObj,
    libre: {
      titulo,
      compositor: comp,
      duracionTexto: dur,
      duracionSegundos: duracionSegundos
    }
  };

  const btnFinalizar = $('btnFinalizarInscripcion');
  if (btnFinalizar) {
    btnFinalizar.disabled = true;
    btnFinalizar.textContent = '⏳ Guardando en Supabase...';
  }

  // Guardar inscripción transaccional en Supabase
  const resultado = await guardarInscripcionCompletaBD(Store.ficha);

  if (btnFinalizar) {
    btnFinalizar.disabled = false;
    btnFinalizar.textContent = '✓ Finalizar Inscripción';
  }

  if (resultado.success) {
    alert(`✅ ¡Inscripción completada exitosamente en la BD!\n\nCódigo de registro: ${Store.ficha.codigo}\nCuarteto: ${Store.ficha.nombre}\n\nSerás redirigido al Portal del Representante.`);
    window.location.href = 'representante.html';
  } else {
    alert(`❌ Ocurrió un error al guardar en la base de datos: ${resultado.message}`);
  }
}

/* ============================================================
   VISTA: MI FICHA
   ============================================================ */
function renderFicha() {
  const f = Store.ficha;
  const elCodigo = $('fichaCodigo');
  if (elCodigo) elCodigo.textContent = f.codigo || '—';

  const estados = {
    preinscripcion: {
      badge: 'badge-draft',
      label: 'Preinscripción Completa',
      alert: `<div class="alert alert-info"><div><strong>📋 En espera de revisión administrativa</strong>Tu ficha ha sido recibida. Recibirás una notificación cuando sea evaluada.</div></div>`,
      actions: `<button class="btn btn-danger" data-accion="retiro">Solicitar retiro voluntario</button>`
    },
    observado: {
      badge: 'badge-obs',
      label: 'Observado',
      alert: `<div class="alert alert-warn"><div><strong>[!] Tu ficha requiere corrección</strong>Motivo: ${f.motivo || 'El integrante 2 no registra matrícula activa'}<br><small>Edita los campos indicados y reenvía para nueva evaluación (RF-22)</small></div></div>`,
      actions: `<button class="btn btn-primary" data-accion="reenviar">📤 Reenviar ficha</button>`
    },
    validado: {
      badge: 'badge-ok',
      label: 'Validado',
      alert: `<div class="alert alert-success"><div><strong>[OK] Ficha validada · Modo lectura (RNF-13)</strong>No puedes modificar los datos. Espera la Turno de Presentación.</div></div>`,
      actions: `<button class="btn btn-primary" data-accion="cronograma">📅 Ver mi cronograma</button>`
    },
    rechazado: {
      badge: 'badge-rej',
      label: 'Rechazado',
      alert: `<div class="alert alert-danger"><div><strong>[X] Ficha rechazada</strong>Motivo: ${f.motivo || 'Documentación incompleta'}<br><small>No es posible reenviar esta ficha. Contacta a administración.</small></div></div>`,
      actions: `<button class="btn btn-secondary" data-accion="inicio">Volver al inicio</button>`
    },
    retirado: {
      badge: 'badge-rej',
      label: 'Retirado',
      alert: `<div class="alert alert-danger"><div><strong>[X] Inscripción retirada</strong>Motivo: ${f.motivo || 'Cruce de horarios con exámenes finales'}<br><small>El cuarteto ha sido excluido del concurso (RF-24)</small></div></div>`,
      actions: `<button class="btn btn-secondary" data-accion="inicio">Volver al inicio</button>`
    }
  };

  const e = estados[f.estado];
  const elEstado = $('fichaEstado');
  const elDetalle = $('fichaDetalle');
  const elAcciones = $('fichaActions');

  if (elEstado) {
    elEstado.innerHTML = `
      <div style="display:flex;gap:10px;align-items:center;margin-bottom:12px">
        <span class="badge ${e.badge}">${e.label}</span>
      </div>
      ${e.alert}
    `;
  }

  const progTurno = getProgramacionCuartetoApp(f.codigo, f.nombre);

  if (elDetalle) {
    elDetalle.innerHTML = `
      <div class="ficha-item"><div class="label">Código</div><div class="value">${f.codigo || '—'}</div></div>
      <div class="ficha-item"><div class="label">Cuarteto</div><div class="value">${f.nombre || '—'}</div></div>
      <div class="ficha-item"><div class="label">Integrantes</div><div class="value">${f.integrantes.length || 0} · Plantilla 2Vn · 1Va · 1Vc</div></div>
      <div class="ficha-item"><div class="label">Profesor</div><div class="value">${f.profesor?.nombre || '—'}</div></div>
      <div class="ficha-item"><div class="label">Obra Obligatoria</div><div class="value">${f.repertorio.obligatoria?.titulo || '—'}</div></div>
      <div class="ficha-item"><div class="label">Obra Libre</div><div class="value">${f.repertorio.libre?.titulo || '—'}</div></div>
      <div class="ficha-item" style="grid-column: 1 / -1; ${progTurno ? 'border: 1.5px solid #86efac; background: #f0fdf4;' : 'border: 1.5px dashed var(--warn); background: var(--warn-soft);'}">
        <div class="label" style="font-weight:700; ${progTurno ? 'color:#15803d;' : 'color:var(--warn);'}">Auditorio y Horario Asignado</div>
        <div class="value" style="font-size:14px; margin-top:4px;">
          ${progTurno ? `🏛️ <strong>${progTurno.auditorioNombre}</strong> · 📅 ${progTurno.fecha} (${progTurno.hora}) · Turno #${progTurno.orden}` : `⏳ <em>Pendiente de selección</em> · <a href="cronograma.html" style="color:var(--primary); font-weight:700; text-decoration:underline;">Elegir Auditorio en Cronograma →</a>`}
        </div>
      </div>
    `;
  }

  if (elAcciones) {
    elAcciones.innerHTML = e.actions;
  }
}

function solicitarRetiro() {
  const motivo = prompt('Motivo del retiro voluntario (RF-23):');
  if (!motivo) return;
  Store.ficha.motivo = motivo;
  Store.ficha.estado = 'retirado';
  Store.ficha.historial.push({
    t: hoy(),
    a: `Retiro voluntario confirmado · Motivo: ${motivo}`
  });
  renderFicha();
}

function reenviarFicha() {
  Store.ficha.estado = 'preinscripcion';
  Store.ficha.historial.push({
    t: hoy(),
    a: 'Ficha reenviada para nueva evaluación administrativa (RF-22)'
  });
  alert('✅ Ficha reenviada correctamente');
  renderFicha();
}

function resetApp() {
  Store.currentStep = 1;
  Store.ficha = {
    codigo: null,
    nombre: '',
    integrantes: [],
    profesor: null,
    repertorio: { obligatoria: null, libre: null },
    estado: 'preinscripcion',
    motivo: '',
    historial: []
  };
  const inputNombre = $('nombreCuarteto');
  const fb = $('nombreFeedback');
  if (inputNombre) inputNombre.value = '';
  if (fb) fb.innerHTML = '';
  showView('wizard');
}

function cerrarSesion() {
  if (confirm('¿Cerrar sesión y volver al inicio?')) {
    sessionStorage.removeItem('competia_session');
    window.location.href = 'landing.html';
  }
}

/* ============================================================
   EVENT DELEGATION GLOBAL (solución definitiva)
   ============================================================ */
document.addEventListener('click', function (e) {
  const target = e.target;

  // Botones del header
  if (target.matches('#btnReiniciar') || target.closest('#btnReiniciar')) {
    e.preventDefault();
    if (confirm('¿Reiniciar todo el proceso de inscripción?')) {
      resetApp();
    }
    return;
  }

  if (target.matches('#btnMiFicha') || target.closest('#btnMiFicha')) {
    e.preventDefault();
    showView('ficha');
    return;
  }

  // Botones de navegación del wizard
  if (target.matches('#btnGuardarNombre') || target.closest('#btnGuardarNombre')) {
    e.preventDefault();
    $('btnGuardarNombre').click();
    return;
  }

  if (target.matches('#btnVolverIntegrantes') || target.closest('#btnVolverIntegrantes')) {
    e.preventDefault();
    goToStep(1);
    return;
  }

  if (target.matches('#btnGuardarIntegrantes') || target.closest('#btnGuardarIntegrantes')) {
    e.preventDefault();
    guardarIntegrantes();
    return;
  }

  if (target.matches('#btnVolverProfesor') || target.closest('#btnVolverProfesor')) {
    e.preventDefault();
    goToStep(2);
    return;
  }

  if (target.matches('#btnGuardarProfesor') || target.closest('#btnGuardarProfesor')) {
    e.preventDefault();
    guardarProfesor();
    return;
  }

  if (target.matches('#btnVolverRepertorio') || target.closest('#btnVolverRepertorio')) {
    e.preventDefault();
    goToStep(3);
    return;
  }

  if (target.matches('#btnFinalizarInscripcion') || target.closest('#btnFinalizarInscripcion')) {
    e.preventDefault();
    finalizarInscripcion();
    return;
  }

  if (target.matches('#btnVolverWizard') || target.closest('#btnVolverWizard')) {
    e.preventDefault();
    showView('wizard');
    return;
  }

  // Botones dinámicos de la ficha (retiro, reenviar, etc.)
  const accionBtn = target.matches('[data-accion]') ? target : target.closest('[data-accion]');
  if (accionBtn) {
    e.preventDefault();
    const accion = accionBtn.dataset.accion;
    if (accion === 'retiro') solicitarRetiro();
    else if (accion === 'reenviar') reenviarFicha();
    else if (accion === 'cronograma') window.location.href = 'cronograma.html';
    else if (accion === 'inicio') resetApp();
    return;
  }

  // Botones de estado (tabs)
  if (target.matches('.estado-tabs button')) {
    const estado = target.dataset.estado;
    if (estado) {
      Store.ficha.estado = estado;
      document.querySelectorAll('.estado-tabs button')
        .forEach(b => b.classList.remove('active'));
      target.classList.add('active');
      renderFicha();
    }
    return;
  }

  //Botones de sugerencia de docente (Paso 3)
  if (target.matches('.docente-btn') || target.closest('.docente-btn')) {
    const btnDocente = target.matches('.docente-btn') ? target : target.closest('.docente-btn');
    seleccionarDocente(btnDocente.dataset.id);
    return;
  }
});

/* ============================================================
   EVENTO: Búsqueda de docente
   ============================================================ */
document.addEventListener('input', function (e) {
  if (e.target.matches('#buscarDocente')) {
    filtrarDocentes();
  }
});

/* ============================================================
   INIT: Todo se ejecuta cuando el DOM está listo
   ============================================================ */
document.addEventListener('DOMContentLoaded', async function () {
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('edit_id');

  if (editId) {
    try {
      // 1. Consultar el cuarteto, sus integrantes, profesor y la inscripción asociada
      const { data: c, error } = await supabase
        .from('cuarteto')
        .select(`
          *,
          integrante (*),
          usuario:id_profesor_responsable (*)
        `)
        .eq('id_cuarteto', editId)
        .single();

      if (error) throw error;

      if (c) {
        // Cargar en el estado global Store.ficha
        Store.ficha.id = c.id_cuarteto;
        Store.ficha.codigo = c.codigo_cuarteto;
        Store.ficha.nombre = c.nombre_cuarteto;

        // --- PASO 1: Nombre del Cuarteto ---
        const inputNombre = $('nombreCuarteto');
        if (inputNombre) inputNombre.value = c.nombre_cuarteto;
        
        const btnGuardarNombre = $('btnGuardarNombre');
        if (btnGuardarNombre) btnGuardarNombre.disabled = false;

        // --- PASO 2: Integrantes ---
        if (c.integrante && c.integrante.length > 0) {
          Store.ficha.integrantes = c.integrante.map(it => ({
            dni: it.dni || '',
            nombre: it.nombre_completo || '',
            correo: it.correo_institucional || '',
            edad: it.edad || '',
            instrumento: it.instrumento || ''
          }));
          
          // Si tienes una función visual para renderizar integrantes en pantalla, la llamamos:
          if (typeof renderIntegrantesInputs === 'function') {
            renderIntegrantesInputs();
          } else {
            // O llenamos los inputs directamente por índice si ya están pintados en el DOM
            c.integrante.forEach((it, idx) => {
              const inputDni = $(`integranteDni_${idx}`) || document.querySelectorAll('.integrante-dni')[idx];
              const inputNombreIt = $(`integranteNombre_${idx}`) || document.querySelectorAll('.integrante-nombre')[idx];
              const inputCorreo = $(`integranteCorreo_${idx}`) || document.querySelectorAll('.integrante-correo')[idx];
              const inputEdad = $(`integranteEdad_${idx}`) || document.querySelectorAll('.integrante-edad')[idx];
              
              if (inputDni) inputDni.value = it.dni || '';
              if (inputNombreIt) inputNombreIt.value = it.nombre_completo || '';
              if (inputCorreo) inputCorreo.value = it.correo_institucional || '';
              if (inputEdad) inputEdad.value = it.edad || '';
            });
          }
        }

        // --- PASO 3: Profesor Responsable ---
        if (c.usuario) {
          Store.ficha.profesor = {
            id_usuario: c.usuario.id_usuario,
            nombre: `${c.usuario.nombres} ${c.usuario.apellidos}`,
            dni: c.usuario.dni,
            correo: c.usuario.correo_institucional
          };
          
          // Mostrar visualmente el profesor seleccionado si existe el contenedor
          const infoDocente = $('docenteInfo');
          const btnProfesor = $('btnGuardarProfesor');
          if (infoDocente) {
            infoDocente.innerHTML = `
              <div class="docente-info" style="margin-top:12px; background:#f0fdf4; border:1px solid #86efac; padding:14px; border-radius:8px;">
                <strong style="font-size:15px; color:#166534;">👨‍🏫 ${Store.ficha.profesor.nombre}</strong><br>
                <span style="font-size:13px; color:var(--muted);">DNI: ${Store.ficha.profesor.dni} · Correo: ${Store.ficha.profesor.correo}</span>
              </div>`;
          }
          if (btnProfesor) btnProfesor.disabled = false;
        }

        // --- PASO 4: Repertorio (Obra Libre y Obligatoria) ---
        Store.ficha.repertorio = {
          obligatoria: { titulo: c.obra_obligatoria || '' },
          libre: {
            titulo: c.obra_libre_titulo || '',
            duracionTexto: c.obra_libre_duracion || ''
          }
        };

        // Rellenar inputs de repertorio libre si están presentes en la vista
        const inputObraLibre = $('obraLibreTitulo');
        const inputDuracion = $('obraLibreDuracion');
        if (inputObraLibre) inputObraLibre.value = c.obra_libre_titulo || '';
        if (inputDuracion) inputDuracion.value = c.obra_libre_duracion || '';

        console.log('✅ Datos del cuarteto precargados correctamente para edición.');
      }
    } catch (err) {
      console.error('Error al precargar datos del cuarteto desde Supabase:', err);
    }
  }

  initNombreCuarteto();
  updateStepper();
});