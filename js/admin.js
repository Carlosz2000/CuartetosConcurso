/* ============================================================
   ROL ADMINISTRADOR · Panel Integral (S1, S4, S5, S6, S7, BD)
   HU-01 a HU-22 · RF-01 a RF-54
   ============================================================ */

import { requireRol } from './core/session.js';
import { 
  obtenerTodasLasObrasObligatoriasBD, 
  registrarObraObligatoriaBD, 
  cambiarEstadoObraBD, 
  segundosAMmSs 
} from './services/obraService.js';
import { supabase } from '../config/supabase.js';

let adminSesion = null;
let activeAdminTab = 's1';
let filtroAuditorioAdminS6 = 'TODOS';

// Función auxiliar única para notificaciones
function notificar(mensaje, tipo = 'ok') {
  if (typeof showToast === 'function') {
    showToast(mensaje, tipo);
  } else if (typeof window.showToast === 'function') {
    window.showToast(mensaje, tipo);
  } else {
    console.log(`[Toast ${tipo}]: ${mensaje}`);
  }
}

// 🔒 BLINDAJE DE SEGURIDAD POR ROL AL CARGAR LA VISTA
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Valida estrictamente que la sesión pertenezca al rol 'administrador'
    adminSesion = requireRol('administrador');
  } catch (e) {
    console.warn('⚠️ Intento de acceso no autorizado detectado:', e);
    window.location.replace('login.html');
    return;
  }

  if (!adminSesion || adminSesion.rol !== 'administrador') {
    window.location.replace('login.html');
    return;
  }

  const elCred = document.getElementById('adminCredencial');
  if (elCred) elCred.textContent = `${adminSesion.nombre || adminSesion.nombres || 'Admin'} · ${(adminSesion.rol || 'administrador').toUpperCase()}`;

  // Navegación por tabs
  document.querySelectorAll('[data-admin-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      activeAdminTab = btn.dataset.adminTab;
      
      // Si hacen clic en S4, redirige inmediatamente a cronograma.html
      if (activeAdminTab === 's4') {
        window.location.href = 'cronograma.html';
        return;
      }

      document.querySelectorAll('[data-admin-tab]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderAdminTab();
    });
  });

  await renderAdminTab();
});

/* ---------- Render principal por tab ---------- */
async function renderAdminTab() {
  const cont = document.getElementById('adminMainContent');
  if (!cont) return;

  switch (activeAdminTab) {
    case 's1': cont.innerHTML = await renderS1(); bindS1(); break;
    case 's4': window.location.href = 'cronograma.html'; break;  
    case 's5': cont.innerHTML = await renderS5(); bindS5(); break;
    case 's6': cont.innerHTML = await renderS6(); bindS6(); break;
    case 's7': cont.innerHTML = await renderS7(); bindS7(); break;
  }
}

/* ============================================================================
   HELPERS DB · ESTADO GLOBAL DE EDICIÓN Y FASES (SUPABASE)
   ============================================================================ */
async function obtenerEstadoConcursoBD() {
  try {
    const { data, error } = await supabase
      .from('configuracion_concurso')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error || !data) {
      return {
        fase_eliminatoria_estado: 'En Curso',
        edicion_archivada: false,
        portal_publicado: false
      };
    }
    return data;
  } catch (err) {
    return {
      fase_eliminatoria_estado: 'En Curso',
      edicion_archivada: false,
      portal_publicado: false
    };
  }
}

async function guardarEstadoConcursoBD(cambios) {
  const { error } = await supabase
    .from('configuracion_concurso')
    .update(cambios)
    .eq('id', 1);
  if (error) console.error('Error al guardar estado de concurso en Supabase:', error.message);
}

/* ============================================================================
   S1 · CATÁLOGO DE OBRAS (HU-01) - SUPABASE (Con Edición y Activación/Desactivación)
   ============================================================================ */
async function renderS1() {
  const estadoConcurso = await obtenerEstadoConcursoBD();
  const bloqueado = estadoConcurso.edicion_archivada;

  const obras = await obtenerTodasLasObrasObligatoriasBD();
  const obrasActivasCount = obras.filter(o => o.estado === true).length;

  return `
    <div class="card">
      <div class="ficha-header">
        <div>
          <h2>🎼 Subsistema 1 · Catálogo de Obras Obligatorias</h2>
          <p class="subtitle">HU-01 · HU-02 · Gestión, Edición y Activación de Obras</p>
        </div>
        <span class="badge badge-ok">${obrasActivasCount} activas / ${obras.length} totales</span>
      </div>

      <div class="grid-2" style="margin-top:16px; align-items:start;">
        <div class="integrante-card" style="background:#fff;">
          <h4 id="s1FormTitulo">➕ Registrar Obra Obligatoria</h4>
          <form id="formS1Obra">
            <input type="hidden" id="s1ObraId" value="">
            
            <div class="form-row">
              <label>Título de la Obra <span class="req">*</span></label>
              <input type="text" id="s1Titulo" placeholder="Ej: Cuarteto en Fa Mayor" ${bloqueado ? 'disabled' : ''} required>
            </div>
            
            <div class="form-row">
              <label>Compositor <span class="req">*</span> (CA3)</label>
              <input type="text" id="s1Compositor" placeholder="Ej: Maurice Ravel" ${bloqueado ? 'disabled' : ''} required>
            </div>
            
            <div class="form-row">
              <label>Duración Estimada (mm:ss)</label>
              <input type="text" id="s1Duracion" placeholder="Ej: 5:15" value="5:15" ${bloqueado ? 'disabled' : ''}>
            </div>
            
            <div id="s1Feedback" style="margin-bottom:12px;"></div>
            
            <div style="display:flex; gap:8px;">
              <button type="submit" class="btn btn-primary" style="flex:1;" ${bloqueado ? 'disabled' : ''}>
                💾 Guardar en Catálogo
              </button>
              <button type="button" class="btn btn-secondary" id="s1BtnCancelar" style="display:none;">
                Cancelar Edición
              </button>
            </div>
          </form>
        </div>

        <div>
          <h4 style="font-size:15px; margin-bottom:10px;">📚 Catálogo Institucional (A–Z)</h4>
          <div class="table-container">
            <table class="table" style="font-size:13px;">
              <thead>
                <tr>
                  <th>Título / Compositor</th>
                  <th>Duración</th>
                  <th>Estado</th>
                  <th style="text-align:center;">Acciones</th>
                </tr>
              </thead>
              <tbody>
                ${obras.length === 0 ? '<tr><td colspan="4" style="text-align:center;">No hay obras obligatorias registradas.</td></tr>' : 
                  obras.map(o => {
                    const durSegundos = o.duracion_estimada || o.duracion || 0;
                    const esActiva = o.estado === true;
                    
                    return `
                      <tr style="background: ${esActiva ? '#fff' : '#f8fafc'}; opacity: ${esActiva ? '1' : '0.6'};">
                        <td>
                          <strong>${o.titulo}</strong><br>
                          <small style="color:var(--muted);">${o.compositor || '—'}</small>
                        </td>
                        <td><span class="badge badge-code">${segundosAMmSs(durSegundos)} min</span></td>
                        <td>
                          <span class="badge ${esActiva ? 'badge-ok' : 'badge-rej'}">
                            ${esActiva ? 'ACTIVA' : 'INACTIVA'}
                          </span>
                        </td>
                        <td style="text-align:center; white-space:nowrap;">
                          <button type="button" class="btn btn-secondary btn-editar-obra" 
                            data-id="${o.id_obra || o.id}" 
                            data-titulo="${o.titulo}" 
                            data-compositor="${o.compositor || ''}" 
                            data-duracion="${segundosAMmSs(durSegundos)}" 
                            style="padding:3px 8px; font-size:11px;" ${bloqueado ? 'disabled' : ''}>
                            ✏️ Editar
                          </button>
                          <button type="button" class="btn ${esActiva ? 'btn-danger' : 'btn-success'} btn-toggle-estado" 
                            data-id="${o.id_obra || o.id}" 
                            data-nuevo-estado="${!esActiva}" 
                            style="padding:3px 8px; font-size:11px;" ${bloqueado ? 'disabled' : ''}>
                            ${esActiva ? '🔴 Desactivar' : '🟢 Activar'}
                          </button>
                        </td>
                      </tr>
                    `;
                  }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

function bindS1() {
  const form = document.getElementById('formS1Obra');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const idObra = document.getElementById('s1ObraId').value;
    const titulo = document.getElementById('s1Titulo').value.trim();
    const compositor = document.getElementById('s1Compositor').value.trim();
    const duracionStr = document.getElementById('s1Duracion').value.trim();
    const fb = document.getElementById('s1Feedback');

    try {
      if (idObra) {
        let segundos = 315;
        if (duracionStr.includes(':')) {
          const partes = duracionStr.split(':');
          segundos = (parseInt(partes[0]) || 0) * 60 + (parseInt(partes[1]) || 0);
        } else {
          segundos = parseInt(duracionStr) || 315;
        }

        const { error } = await supabase
          .from('obra')
          .update({
            titulo: titulo,
            compositor: compositor,
            duracion_estimada: segundos
          })
          .eq('id_obra', idObra);

        if (error) throw error;
        notificar(`✅ Obra "${titulo}" actualizada correctamente.`, 'ok');
      } else {
        await registrarObraObligatoriaBD(titulo, compositor, duracionStr);
        notificar(`✅ Obra "${titulo}" agregada al catálogo.`, 'ok');
      }

      form.reset();
      document.getElementById('s1ObraId').value = '';
      document.getElementById('s1FormTitulo').textContent = '➕ Registrar Obra Obligatoria';
      document.getElementById('s1BtnCancelar').style.display = 'none';
      await renderAdminTab();
    } catch (err) {
      fb.innerHTML = `<div class="alert alert-danger"><div>⚠️ ${err.message}</div></div>`;
    }
  });

  document.querySelectorAll('.btn-editar-obra').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('s1ObraId').value = btn.dataset.id;
      document.getElementById('s1Titulo').value = btn.dataset.titulo;
      document.getElementById('s1Compositor').value = btn.dataset.compositor;
      document.getElementById('s1Duracion').value = btn.dataset.duracion;
      document.getElementById('s1FormTitulo').textContent = '✏️ Editar Obra Obligatoria';
      document.getElementById('s1BtnCancelar').style.display = 'inline-block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  const btnCancelar = document.getElementById('s1BtnCancelar');
  if (btnCancelar) {
    btnCancelar.addEventListener('click', () => {
      form.reset();
      document.getElementById('s1ObraId').value = '';
      document.getElementById('s1FormTitulo').textContent = '➕ Registrar Obra Obligatoria';
      btnCancelar.style.display = 'none';
    });
  }

  document.querySelectorAll('.btn-toggle-estado').forEach(btn => {
    btn.addEventListener('click', async () => {
      const idObra = btn.dataset.id;
      const nuevoEstado = btn.dataset.nuevoEstado === 'true';

      try {
        await cambiarEstadoObraBD(idObra, nuevoEstado);
        notificar(`✅ Obra marcada como ${nuevoEstado ? 'ACTIVA' : 'INACTIVA'}`, 'ok');
        await renderAdminTab();
      } catch (err) {
        notificar(`Error al cambiar estado: ${err.message}`, 'error');
      }
    });
  });
}

/* ============================================================================
   S5 · GESTIÓN DE JURADOS Y ASIGNACIÓN INCOMPATIBLE (HU-14, HU-15) - SUPABASE
   ============================================================================ */
async function renderS5() {
  const estadoConcurso = await obtenerEstadoConcursoBD();
  const bloqueado = estadoConcurso.edicion_archivada;

  const { data: juradosBD, error } = await supabase
    .from('usuario')
    .select('*')
    .eq('id_rol', 7);

  if (error) {
    console.error('⚠️ Error al consultar jurados en Supabase:', error.message);
  }

  const listaJurados = juradosBD || [];

  // Obtener ternas guardadas actualmente en Supabase
  let ternasGuardadas = {};
  try {
    const { data: configTernas } = await supabase
      .from('configuracion_concurso')
      .select('ternas_auditorios')
      .eq('id', 1)
      .maybeSingle();
    
    if (configTernas && configTernas.ternas_auditorios) {
      ternasGuardadas = typeof configTernas.ternas_auditorios === 'string' 
        ? JSON.parse(configTernas.ternas_auditorios) 
        : configTernas.ternas_auditorios;
    }
  } catch (e) {
    console.warn('No se pudieron leer las ternas de Supabase:', e);
  }

  const auditorioActual = document.getElementById('s5Auditorio')?.value || 'Auditorio Principal';
  const ternaActual = ternasGuardadas[auditorioActual] || { a: '', b: '', c: '' };

  return `
    <div class="card">
      <div class="ficha-header">
        <div>
          <h2>👨‍⚖️ Subsistema 5 · Gestión de Jurados y Control de Incompatibilidad</h2>
          <p class="subtitle">HU-14 · HU-15 · RF-35 a RF-38 (Sincronizado con Base de Datos)</p>
        </div>
        <span class="badge badge-ok">${listaJurados.length} Jurados Registrados</span>
      </div>

      <div class="grid-2" style="margin-top:20px; align-items:start; gap:20px;">
        <div class="integrante-card" style="background:#fff; padding:20px; border-radius:12px; border:1px solid #e2e8f0;">
          <h4>🔐 HU-14 · Crear Cuenta de Jurado con Contraseña</h4>
          <form id="formCrearJurado">
            <div class="form-row" style="margin-bottom:12px;">
              <label style="display:block; font-weight:600; margin-bottom:4px;">Nombre Completo <span class="req">*</span></label>
              <input type="text" id="s5Nombre" placeholder="Ej: Dra. Beatriz Morales" style="width:100%; padding:8px 12px; border-radius:6px; border:1px solid #cbd5e1;" ${bloqueado ? 'disabled' : ''} required>
            </div>
            <div class="grid-2" style="gap:12px;">
              <div class="form-row" style="margin-bottom:12px;">
                <label style="display:block; font-weight:600; margin-bottom:4px;">DNI (8 dígitos) <span class="req">*</span></label>
                <input type="text" id="s5Dni" maxlength="8" placeholder="Ej: 45678912" style="width:100%; padding:8px 12px; border-radius:6px; border:1px solid #cbd5e1;" ${bloqueado ? 'disabled' : ''} required>
              </div>
              <div class="form-row" style="margin-bottom:12px;">
                <label style="display:block; font-weight:600; margin-bottom:4px;">Especialidad Musical <span class="req">*</span></label>
                <input type="text" id="s5Especialidad" placeholder="Ej: Violín y Música de Cámara" style="width:100%; padding:8px 12px; border-radius:6px; border:1px solid #cbd5e1;" ${bloqueado ? 'disabled' : ''} required>
              </div>
            </div>
            <div class="form-row" style="margin-bottom:12px;">
              <label style="display:block; font-weight:600; margin-bottom:4px;">Correo Institucional <span class="req">*</span></label>
              <input type="email" id="s5Correo" placeholder="Ej: bmorales@conservatorio.edu.pe" style="width:100%; padding:8px 12px; border-radius:6px; border:1px solid #cbd5e1;" ${bloqueado ? 'disabled' : ''} required>
            </div>
            <div class="form-row" style="margin-bottom:16px;">
              <label style="display:block; font-weight:600; margin-bottom:4px;">Contraseña Provisional <span class="req">*</span></label>
              <input type="password" id="s5Password" placeholder="Mínimo 6 caracteres" style="width:100%; padding:8px 12px; border-radius:6px; border:1px solid #cbd5e1;" ${bloqueado ? 'disabled' : ''} required minlength="6">
            </div>
            <div id="s5FeedbackJurado" style="margin-bottom:10px;"></div>
            <button type="submit" class="btn btn-primary" style="width:100%; padding:10px;" ${bloqueado ? 'disabled' : ''}>
              ✉️ Crear Cuenta Auth y Enviar Credenciales
            </button>
          </form>
        </div>

        <div class="integrante-card" style="background:#fff; padding:20px; border-radius:12px; border:1px solid #e2e8f0;">
          <h4>⚖️ HU-15 · Asignar Terna de 3 Jurados por Auditorio</h4>
          <p style="font-size:12px; color:#64748b; margin-bottom:14px;">
            Valida que ningún jurado sea Profesor Responsable de un cuarteto en ese auditorio.
          </p>
          <form id="formAsignarTerna">
            <div class="form-row" style="margin-bottom:10px;">
              <label style="display:block; font-weight:600; margin-bottom:4px;">Auditorio <span class="req">*</span></label>
              <select id="s5Auditorio" style="width:100%; padding:8px 12px; border-radius:6px; border:1px solid #cbd5e1;" ${bloqueado ? 'disabled' : ''}>
                <option value="Auditorio Principal" ${auditorioActual === 'Auditorio Principal' ? 'selected' : ''}>Auditorio Principal</option>
                <option value="Auditorio B — Sala Beethoven" ${auditorioActual === 'Auditorio B — Sala Beethoven' ? 'selected' : ''}>Auditorio B — Sala Beethoven</option>
                <option value="Auditorio C — Sala Mozart" ${auditorioActual === 'Auditorio C — Sala Mozart' ? 'selected' : ''}>Auditorio C — Sala Mozart</option>
              </select>
            </div>
            <div class="form-row" style="margin-bottom:10px;">
              <label style="display:block; font-weight:600; margin-bottom:4px;">Jurado A <span class="req">*</span></label>
              <select id="s5JuradoA" style="width:100%; padding:8px 12px; border-radius:6px; border:1px solid #cbd5e1;" ${bloqueado ? 'disabled' : ''}>
                <option value="">-- Seleccionar Jurado A --</option>
                ${listaJurados.map(j => {
                  const nombre = `${j.nombres || ''} ${j.apellidos || ''}`.trim() || j.nombre || j.correo_institucional;
                  const idJ = j.id_usuario || j.id;
                  const seleccionado = (ternaActual.a === idJ || ternaActual[0] === idJ) ? 'selected' : '';
                  return `<option value="${idJ}" ${seleccionado}>${nombre}</option>`;
                }).join('')}
              </select>
            </div>
            <div class="form-row" style="margin-bottom:10px;">
              <label style="display:block; font-weight:600; margin-bottom:4px;">Jurado B <span class="req">*</span></label>
              <select id="s5JuradoB" style="width:100%; padding:8px 12px; border-radius:6px; border:1px solid #cbd5e1;" ${bloqueado ? 'disabled' : ''}>
                <option value="">-- Seleccionar Jurado B --</option>
                ${listaJurados.map(j => {
                  const nombre = `${j.nombres || ''} ${j.apellidos || ''}`.trim() || j.nombre || j.correo_institucional;
                  const idJ = j.id_usuario || j.id;
                  const seleccionado = (ternaActual.b === idJ || ternaActual[1] === idJ) ? 'selected' : '';
                  return `<option value="${idJ}" ${seleccionado}>${nombre}</option>`;
                }).join('')}
              </select>
            </div>
            <div class="form-row" style="margin-bottom:14px;">
              <label style="display:block; font-weight:600; margin-bottom:4px;">Jurado C <span class="req">*</span></label>
              <select id="s5JuradoC" style="width:100%; padding:8px 12px; border-radius:6px; border:1px solid #cbd5e1;" ${bloqueado ? 'disabled' : ''}>
                <option value="">-- Seleccionar Jurado C --</option>
                ${listaJurados.map(j => {
                  const nombre = `${j.nombres || ''} ${j.apellidos || ''}`.trim() || j.nombre || j.correo_institucional;
                  const idJ = j.id_usuario || j.id;
                  const seleccionado = (ternaActual.c === idJ || ternaActual[2] === idJ) ? 'selected' : '';
                  return `<option value="${idJ}" ${seleccionado}>${nombre}</option>`;
                }).join('')}
              </select>
            </div>
            <div id="s5FeedbackTerna" style="margin-bottom:10px;"></div>
            <div style="display:flex; gap:10px;">
              <button type="submit" class="btn btn-primary" style="flex:1; padding:9px;" ${bloqueado ? 'disabled' : ''}>
                ✓ Validar y Guardar Terna en BD
              </button>
            </div>
          </form>
        </div>
      </div>

      <h4 style="margin-top:28px; margin-bottom:14px; font-size:16px;">📋 Nómina de Jurados Registrados (Supabase)</h4>
      <div style="background:#fff; border-radius:10px; border:1px solid #e2e8f0; overflow:hidden;">
        <table style="width:100%; border-collapse:collapse; text-align:left; font-size:13px;">
          <thead>
            <tr style="background:#f8fafc; border-bottom:1px solid #e2e8f0; color:#475569; font-weight:700;">
              <th style="padding:14px 18px; width:25%;">Jurado</th>
              <th style="padding:14px 18px; width:15%;">DNI</th>
              <th style="padding:14px 18px; width:30%;">Correo Institucional</th>
              <th style="padding:14px 18px; width:20%;">Especialidad</th>
              <th style="padding:14px 18px; width:10%; text-align:center;">Estado</th>
            </tr>
          </thead>
          <tbody>
            ${listaJurados.length === 0 ? `
              <tr>
                <td colspan="5" style="text-align:center; padding:24px; color:#64748b;">
                  No hay jurados registrados en Supabase (id_rol = 7). Registre uno desde el formulario superior.
                </td>
              </tr>
            ` : listaJurados.map(j => {
              const nombre = `${j.nombres || ''} ${j.apellidos || ''}`.trim() || j.nombre || 'Sin Nombre';
              const correo = j.correo_institucional || j.correo || '—';
              return `
                <tr style="border-bottom:1px solid #f1f5f9; transition:background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='#fff'">
                  <td style="padding:14px 18px; font-weight:600; color:#0f172a;">${nombre}</td>
                  <td style="padding:14px 18px;">
                    <code style="background:#f1f5f9; color:#334155; padding:3px 8px; border-radius:4px; font-family:monospace;">${j.dni || '—'}</code>
                  </td>
                  <td style="padding:14px 18px; color:#334155;">${correo}</td>
                  <td style="padding:14px 18px; color:#475569;">${j.especialidad || 'Música de Cámara'}</td>
                  <td style="padding:14px 18px; text-align:center;">
                    <span style="background:#dcfce7; color:#15803d; padding:4px 10px; border-radius:12px; font-size:11px; font-weight:700; display:inline-block;">
                      ${j.estado ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function bindS5() {
  const formCrear = document.getElementById('formCrearJurado');
  if (formCrear) {
    formCrear.addEventListener('submit', async e => {
      e.preventDefault();
      const nombre = document.getElementById('s5Nombre').value.trim();
      const dni = document.getElementById('s5Dni').value.trim();
      const esp = document.getElementById('s5Especialidad').value.trim();
      const correo = document.getElementById('s5Correo').value.trim();
      const password = document.getElementById('s5Password').value;
      const fb = document.getElementById('s5FeedbackJurado');

      if (!nombre || !dni || !esp || !correo || !password) {
        fb.innerHTML = '<div class="alert alert-danger"><div><strong>[!] RF-35:</strong> Complete todos los campos, incluyendo la contraseña.</div></div>';
        return;
      }

      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: correo.toLowerCase(),
          password: password,
          options: {
            data: { nombres: nombre, rol: 'jurado' }
          }
        });

        if (authError) {
          throw new Error(`Error en Auth de Supabase: ${authError.message}`);
        }

        const authUserId = authData.user ? authData.user.id : null;
        if (!authUserId) {
          throw new Error('No se pudo obtener el ID del usuario autenticado.');
        }

        const { error: dbError } = await supabase
          .from('usuario')
          .insert([{
            id_usuario: authUserId,
            auth_user_id: authUserId,
            nombres: nombre,
            apellidos: '',
            dni: dni,
            especialidad: esp,
            correo_institucional: correo.toLowerCase(),
            id_rol: 7,
            estado: true
          }]);

        if (dbError) {
          throw new Error(`Error al registrar perfil en la tabla usuario: ${dbError.message}`);
        }

        notificar(`✅ Cuenta de jurado creada exitosamente en Auth y BD para ${nombre}.`, 'ok');
        await renderAdminTab();
      } catch (err) {
        fb.innerHTML = `<div class="alert alert-danger"><div>⚠️ ${err.message}</div></div>`;
      }
    });
  }

  const selAuditorio = document.getElementById('s5Auditorio');
  if (selAuditorio) {
    selAuditorio.addEventListener('change', async () => {
      await renderAdminTab();
    });
  }

  const formTerna = document.getElementById('formAsignarTerna');
  if (formTerna) {
    formTerna.addEventListener('submit', async e => {
      e.preventDefault();
      const aud = document.getElementById('s5Auditorio').value;
      const jA = document.getElementById('s5JuradoA').value;
      const jB = document.getElementById('s5JuradoB').value;
      const jC = document.getElementById('s5JuradoC').value;
      const fb = document.getElementById('s5FeedbackTerna');

      const setJurados = new Set([jA, jB, jC]);
      if (!jA || !jB || !jC || setJurados.size < 3) {
        fb.innerHTML = '<div class="alert alert-danger"><div><strong>[!] RF-37:</strong> Debe seleccionar 3 jurados distintos.</div></div>';
        return;
      }

      try {
        const { data: configActual } = await supabase
          .from('configuracion_concurso')
          .select('ternas_auditorios')
          .eq('id', 1)
          .maybeSingle();

        let ternas = {};
        if (configActual && configActual.ternas_auditorios) {
          ternas = typeof configActual.ternas_auditorios === 'string'
            ? JSON.parse(configActual.ternas_auditorios)
            : configActual.ternas_auditorios;
        }

        ternas[aud] = { a: jA, b: jB, c: jC };

        const { error: updateError } = await supabase
          .from('configuracion_concurso')
          .update({ ternas_auditorios: JSON.stringify(ternas) })
          .eq('id', 1);

        if (updateError) throw updateError;

        localStorage.setItem('concurso_ternas_auditorio', JSON.stringify(ternas));

        fb.innerHTML = `<div class="alert alert-success"><div><strong>✅ Terna guardada en Base de Datos (Supabase):</strong> Asignada correctamente al <b>${aud}</b>.</div></div>`;
        notificar(`✅ Terna de 3 jurados guardada en BD para ${aud}`, 'ok');
      } catch (err) {
        fb.innerHTML = `<div class="alert alert-danger"><div>Error al guardar en Supabase: ${err.message}</div></div>`;
      }
    });
  }
}

/* ============================================================================
   S6 · SUPERVISIÓN DE SESIONES, OBSERVACIONES Y DESCALIFICACIÓN (HU-18)
   ============================================================================ */
async function renderS6() {
  const estadoConcurso = await obtenerEstadoConcursoBD();
  const bloqueado = estadoConcurso.edicion_archivada || estadoConcurso.fase_eliminatoria_estado === 'Concluida';

  const { data: cuartetosBD } = await supabase
    .from('cuarteto')
    .select('*')
    .eq('estado_inscripcion', 'Inscrito');

  let listaEvaluaciones = [];
  try {
    const { data: evaluacionesBD } = await supabase
      .from('evaluacion')
      .select('*');
    if (evaluacionesBD) listaEvaluaciones = evaluacionesBD;
  } catch (err) {
    console.warn('⚠️ No se pudo leer la tabla evaluacion:', err);
  }

  // Cargar observaciones desde la tabla en la nube buzon_observaciones
  let listaBuzonGeneral = [];
  try {
    const { data: buzonBD } = await supabase
      .from('buzon_observaciones')
      .select('*')
      .order('id', { ascending: false });
    if (buzonBD) {
      listaBuzonGeneral = buzonBD;
    }
  } catch (err) {
    console.warn('⚠️ No se pudo leer el buzón de observaciones:', err);
  }

  // Cargar nombres de usuarios para traducir los IDs de la terna correctamente
  let mapaNombresJurados = {};
  try {
    const { data: usuariosBD } = await supabase.from('usuario').select('id_usuario, nombres, apellidos');
    if (usuariosBD) {
      usuariosBD.forEach(u => {
        mapaNombresJurados[u.id_usuario] = `${u.nombres || ''} ${u.apellidos || ''}`.trim();
      });
    }
  } catch (e) {}

  let ternasGuardadas = JSON.parse(localStorage.getItem('concurso_ternas_auditorio') || '{}');
  try {
    const { data: config } = await supabase.from('configuracion_concurso').select('ternas_auditorios').eq('id', 1).maybeSingle();
    if (config && config.ternas_auditorios) {
      const t = typeof config.ternas_auditorios === 'string' ? JSON.parse(config.ternas_auditorios) : config.ternas_auditorios;
      ternasGuardadas = Object.assign({}, ternasGuardadas, t);
    }
  } catch (e) {}

  const listaCuartetos = cuartetosBD || [];

  const evaluacionesMapeadas = listaCuartetos.map(c => {
    const evs = listaEvaluaciones.filter(e => e.id_cuarteto === c.id_cuarteto || e.codigo_cuarteto === c.codigo_cuarteto);
    const ternaObj = ternasGuardadas[c.auditorio] || { a: '', b: '', c: '' };

    // Corrección para evitar mostrar nombres antiguos y asegurar el nombre real de la base de datos
    const rawNombreA = mapaNombresJurados[ternaObj.a || ternaObj[0]];
    const rawNombreB = mapaNombresJurados[ternaObj.b || ternaObj[1]];
    const rawNombreC = mapaNombresJurados[ternaObj.c || ternaObj[2]];

    const nombreA = (rawNombreA && rawNombreA !== 'Carlos Mendoza') ? rawNombreA : (rawNombreA || 'Matias Jurado');
    const nombreB = rawNombreB || 'Jurado Segundo';
    const nombreC = rawNombreC || 'Jerick Juez';

    const ternaNombresArreglo = [nombreA, nombreB, nombreC];

    const getNota = (letra, index) => {
      const e = evs.find(x => x.etiqueta_jurado === letra);
      const nombreJuradoAsignado = ternaNombresArreglo[index] || `Jurado ${letra}`;
      
      if (!e) {
        return { jurado: nombreJuradoAsignado, valor: null, inmutable: false, fecha: '' };
      }
      return { jurado: e.nombre_jurado || nombreJuradoAsignado, valor: e.nota, inmutable: !!e.inmutable, fecha: e.fecha_evaluacion || '' };
    };

    return {
      idCuarteto: c.id_cuarteto,
      codigoCuarteto: c.codigo_cuarteto || (`CQ-2026-${c.id_cuarteto}`),
      nombreCuarteto: c.nombre_cuarteto,
      auditorio: c.auditorio || 'Sin Asignar',
      fecha: c.fecha_presentacion || '—',
      hora: c.hora_presentacion || '—',
      estadoPresentacion: c.estado_presentacion || 'Pendiente',
      motivoDescalificacion: c.motivo_descalificacion || '',
      notas: {
        A: getNota('A', 0),
        B: getNota('B', 1),
        C: getNota('C', 2)
      }
    };
  });

  function convertirHoraAMinutos(horaStr) {
    if (!horaStr || horaStr === '—') return 0;
    const upper = horaStr.toString().toUpperCase().trim();
    let horas = 0;
    let minutos = 0;
    
    if (upper.includes('AM') || upper.includes('PM')) {
      const isPM = upper.includes('PM');
      const cleanTime = upper.replace('AM', '').replace('PM', '').trim();
      const parts = cleanTime.split(':');
      horas = parseInt(parts[0], 10) || 0;
      minutos = parseInt(parts[1], 10) || 0;
      if (isPM && horas < 12) horas += 12;
      if (!isPM && horas === 12) horas = 0;
    } else {
      const parts = upper.split(':');
      horas = parseInt(parts[0], 10) || 0;
      minutos = parseInt(parts[1], 10) || 0;
    }
    return (horas * 60) + minutos;
  }

  evaluacionesMapeadas.sort((a, b) => {
    const fA = a.fecha && a.fecha !== '—' ? a.fecha : '9999-12-31';
    const fB = b.fecha && b.fecha !== '—' ? b.fecha : '9999-12-31';
    if (fA !== fB) return fA.localeCompare(fB);
    
    const minA = convertirHoraAMinutos(a.hora);
    const minB = convertirHoraAMinutos(b.hora);
    return minA - minB;
  });

  const listaFiltrada = filtroAuditorioAdminS6 === 'TODOS'
    ? evaluacionesMapeadas
    : evaluacionesMapeadas.filter(ev => ev.auditorio === filtroAuditorioAdminS6 || (filtroAuditorioAdminS6 === 'Auditorio B — Sala Beethoven' && ev.auditorio.includes('Auditorio B')));

  return `
    <div class="card">
      <div class="ficha-header">
        <div>
          <h2>⚖️ Subsistema 6 · Supervisión de Sesiones, Observaciones y Descalificación</h2>
          <p class="subtitle">HU-18 · RF-43 a RF-45 · Control de actas y buzón de observaciones</p>
        </div>
        <div style="display:flex; align-items:center; gap:10px;">
          <span class="badge ${bloqueado ? 'badge-rej' : 'badge-ok'}">
            ${bloqueado ? '🔒 Acta Cerrada' : '🟢 Sesión Abierta'}
          </span>
          <button type="button" class="btn ${bloqueado ? 'btn-success' : 'btn-danger'}" id="btnToggleSesionS6" style="padding:6px 12px; font-size:12px;">
            ${bloqueado ? '🟢 Abrir Sesión de Jurados' : '🔒 Cerrar Sesión de Jurados'}
          </button>
        </div>
      </div>

      <div style="background:#f8fafc; padding:14px 18px; border-radius:10px; border:1px solid var(--border); display:flex; gap:16px; align-items:center; flex-wrap:wrap; margin-bottom:18px;">
        <div>
          <label style="font-size:12px; font-weight:700; display:block; margin-bottom:4px;">🏛️ Filtrar por Auditorio:</label>
          <select id="s6FiltroAuditorio" style="padding:8px 12px; border-radius:8px; border:1px solid var(--border);">
            <option value="TODOS" ${filtroAuditorioAdminS6 === 'TODOS' ? 'selected' : ''}>Todos los Auditorios</option>
            <option value="Auditorio Principal" ${filtroAuditorioAdminS6 === 'Auditorio Principal' ? 'selected' : ''}>Auditorio Principal</option>
            <option value="Auditorio B — Sala Beethoven" ${filtroAuditorioAdminS6 === 'Auditorio B — Sala Beethoven' ? 'selected' : ''}>Auditorio B — Sala Beethoven</option>
            <option value="Auditorio C — Sala Mozart" ${filtroAuditorioAdminS6 === 'Auditorio C — Sala Mozart' ? 'selected' : ''}>Auditorio C — Sala Mozart</option>
          </select>
        </div>
      </div>

      <div id="s6FeedbackGlobal" style="margin-bottom:14px;"></div>

      ${listaFiltrada.length === 0 ? `
        <div style="text-align:center; padding:30px; color:var(--muted);">No hay presentaciones o cuartetos programados en este auditorio.</div>
      ` : listaFiltrada.map(ev => {
        const esDescalificado = ev.estadoPresentacion === 'Descalificado';
        const notaA = ev.notas.A;
        const notaB = ev.notas.B;
        const notaC = ev.notas.C;
        const todasCalificadas = !esDescalificado && notaA.inmutable && notaB.inmutable && notaC.inmutable;

        return `
          <div class="integrante-card" style="background:#fff; margin-bottom:16px; border-left:4px solid ${esDescalificado ? 'var(--danger)' : (todasCalificadas ? 'var(--success)' : 'var(--primary)')}; border-radius:8px; padding:16px; border:1px solid #e2e8f0;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px;">
              <div>
                <h4 style="font-size:16px; margin-bottom:4px;">${ev.nombreCuarteto} <span class="chip" style="background:#f1f5f9; padding:2px 8px; border-radius:4px; font-size:12px;">${ev.codigoCuarteto}</span></h4>
                <div style="font-size:13px; color:var(--muted);">
                  🏛️ <strong>${ev.auditorio}</strong> · 📅 ${ev.fecha} (${ev.hora})
                </div>
              </div>
              <span class="badge ${esDescalificado ? 'badge-rej' : (todasCalificadas ? 'badge-ok' : 'badge-obs')}">
                ${esDescalificado ? '🚫 Descalificado' : (todasCalificadas ? '✅ Evaluado' : '⏳ Pendiente')}
              </span>
            </div>

            ${esDescalificado ? `
              <div class="alert alert-danger" style="margin-top:12px; margin-bottom:0;">
                <div><strong>🚫 Descalificado (HU-18 · RF-43/44):</strong> Causa: <b>${ev.motivoDescalificacion || 'Sin especificar'}</b>. Excluido del ranking.</div>
              </div>
            ` : `
              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:12px; margin-top:14px;">
                ${['A', 'B', 'C'].map(letra => {
                  const n = ev.notas[letra];
                  return `
                    <div style="background:#f8fafc; padding:12px; border-radius:8px; border:1px solid ${n.inmutable ? '#86efac' : 'var(--primary)'};">
                      <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:700;">
                        <span>👨‍⚖️ Jurado ${letra} (${n.jurado})</span>
                        <span style="color:${n.inmutable ? 'var(--success)' : 'var(--warn)'};">${n.inmutable ? '🔒 Inmutable' : '✏️ Abierto'}</span>
                      </div>
                      ${n.inmutable ? `
                        <div style="font-size:22px; font-weight:800; color:var(--ink); margin-top:6px;">
                          ${Number(n.valor).toFixed(2)} <small style="font-size:11px; color:var(--muted);">/ 10.00</small>
                        </div>
                        <div style="font-size:11px; color:var(--muted);">Firmado: ${n.fecha || '—'}</div>
                      ` : `
                        <div style="font-size:13px; color:var(--muted); margin-top:6px;">Pendiente (reservado para el jurado)</div>
                      `}
                    </div>
                  `;
                }).join('')}
              </div>

              <div style="margin-top:12px; padding-top:10px; border-top:1px dashed var(--border); display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                <input type="text" id="motivoDesc_${ev.idCuarteto}" placeholder="Causa oficial de descalificación (ej: Inasistencia al turno)..." style="flex:1; min-width:240px; padding:6px 10px; border:1px solid var(--border); border-radius:6px; font-size:12px;" ${bloqueado ? 'disabled' : ''}>
                <button type="button" class="btn btn-danger btn-descalificar" data-id="${ev.idCuarteto}" data-nombre="${ev.nombreCuarteto}" ${bloqueado ? 'disabled' : ''}>
                  🚫 Descalificar Cuarteto (HU-18)
                </button>
              </div>
            `}
          </div>
        `;
      }).join('')}

      <!-- SECCIÓN APARTE ABAJO: LISTA GENERAL DE OBSERVACIONES DEL BUZÓN -->
      <div style="margin-top:32px; background:#fff; border:1px solid var(--border); border-radius:12px; padding:20px;">
        <h3 style="font-size:16px; color:var(--primary); margin-bottom:6px;">💬 Buzón de Observaciones y Dudas de Representantes</h3>
        <p style="font-size:13px; color:var(--muted); margin-bottom:16px;">Listado general de reportes e inquietudes enviadas por las agrupaciones.</p>

        ${listaBuzonGeneral.length === 0 ? `
          <div style="text-align:center; padding:24px; color:var(--muted); background:#f8fafc; border-radius:8px; font-size:13px;">
            No hay observaciones registradas en el buzón.
          </div>
        ` : `
          <div style="display:flex; flex-direction:column; gap:12px;">
            ${listaBuzonGeneral.map(obs => `
              <div style="background:#fffbeb; border:1px solid #fef3c7; padding:14px; border-radius:8px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; flex-wrap:wrap; gap:6px;">
                  <span style="font-size:13px; font-weight:700; color:#b45309; background:#fde68a; padding:2px 8px; border-radius:4px;">
                    Remitente / Cuarteto: ${obs.remitente || 'Desconocido'}
                  </span>
                  <span style="font-size:11px; color:#78350f;">
                    📅 ${new Date(obs.fecha).toLocaleString('es-PE')}
                  </span>
                </div>
                <div style="font-size:13px; color:#78350f; line-height:1.4;">
                  "${obs.texto}"
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    </div>
  `;
}

function bindS6() {
  const selAud = document.getElementById('s6FiltroAuditorio');
  if (selAud) {
    selAud.addEventListener('change', function () {
      filtroAuditorioAdminS6 = this.value;
      renderAdminTab();
    });
  }

  const btnToggleSesion = document.getElementById('btnToggleSesionS6');
  if (btnToggleSesion) {
    btnToggleSesion.addEventListener('click', async () => {
      const esAbrir = btnToggleSesion.textContent.includes('Abrir');
      const nuevoEstado = esAbrir ? 'En Curso' : 'Concluida';

      if (!confirm(`¿Confirma ${esAbrir ? 'reabrir la sesión de evaluación' : 'cerrar las actas y bloquear la calificación de los jurados'}?`)) return;

      const { error } = await supabase
        .from('configuracion_concurso')
        .update({ fase_eliminatoria_estado: nuevoEstado })
        .eq('id', 1);

      if (error) {
        const fb = document.getElementById('s6FeedbackGlobal');
        if (fb) fb.innerHTML = `<div class="alert alert-danger">Error al cambiar el estado de la sesión: ${error.message}</div>`;
        return;
      }

      notificar(esAbrir ? '🟢 Sesión de evaluación reabierta con éxito.' : '🔒 Sesión cerrada y actas bloqueadas.', 'ok');
      await renderAdminTab();
    });
  }

  document.querySelectorAll('.btn-descalificar').forEach(btn => {
    btn.addEventListener('click', async function () {
      const idCuarteto = this.dataset.id;
      const nombreCuarteto = this.dataset.nombre;
      const inpMotivo = document.getElementById(`motivoDesc_${idCuarteto}`);
      const motivo = inpMotivo ? inpMotivo.value.trim() : '';
      const fb = document.getElementById('s6FeedbackGlobal');

      if (!motivo) {
        fb.innerHTML = '<div class="alert alert-danger"><div><strong>[!] CA1 / RF-43:</strong> Ingrese la causa oficial (ej: "Inasistencia al turno").</div></div>';
        if (inpMotivo) inpMotivo.focus();
        return;
      }

      if (!confirm(`¿Confirmar DESCALIFICACIÓN de ${nombreCuarteto}? Esta acción es irreversible y liberará su turno en el cronograma (RNF-26).`)) return;

      const { error } = await supabase
        .from('cuarteto')
        .update({
          estado_presentacion: 'Descalificado',
          motivo_descalificacion: motivo,
          auditorio: null,
          sede: null,
          fecha_presentacion: null,
          hora_presentacion: null
        })
        .eq('id_cuarteto', idCuarteto);

      if (error) {
        fb.innerHTML = `<div class="alert alert-danger"><div>Error al descalificar en Supabase: ${error.message}</div></div>`;
        return;
      }

      notificar(`🚫 ${nombreCuarteto} descalificado (${motivo}). Turno liberado (HU-18).`, 'ok');
      await renderAdminTab();
    });
  });
}

/* ============================================================================
   S7 · RANKING, CLASIFICACIÓN, LEADERBOARD Y CIERRE (HU-19 a HU-22) - SUPABASE
   ============================================================================ */
async function renderS7() {
  const estadoConcurso = await obtenerEstadoConcursoBD();
  const bloqueado = estadoConcurso.edicion_archivada;

  const { data: cuartetosBD } = await supabase
    .from('cuarteto')
    .select('*')
    .eq('estado_inscripcion', 'Inscrito');

  let listaEvaluaciones = [];
  try {
    const { data: evsBD } = await supabase
      .from('evaluacion')
      .select('*');
    if (evsBD) listaEvaluaciones = evsBD;
  } catch (err) {
    console.warn('⚠️ No se pudo leer la tabla evaluacion:', err);
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
      id: c.id_cuarteto,
      codigo: c.codigo_cuarteto || (`CQ-2026-${c.id_cuarteto}`),
      nombre: c.nombre_cuarteto,
      auditorio: c.auditorio || 'Sin Asignar',
      notaA: notaA !== null ? notaA.toFixed(2) : '—',
      notaB: notaB !== null ? notaB.toFixed(2) : '—',
      notaC: notaC !== null ? notaC.toFixed(2) : '—',
      promedio: promedio,
      tieneTresNotas: tieneTresNotas,
      descalificado: esDescalificado,
      motivo: c.motivo_descalificacion || ''
    };
  });

  const leaderboardOficial = rankingProcesado
    .filter(q => !q.descalificado && q.tieneTresNotas)
    .sort((a, b) => b.promedio - a.promedio);

  const rankingGeneral = rankingProcesado
    .filter(q => !q.descalificado && q.auditorio)
    .sort((a, b) => b.promedio - a.promedio);

  const descalificados = rankingProcesado.filter(q => q.descalificado);

  return `
    <div class="card">
      <div class="ficha-header">
        <div>
          <h2>🏆 Subsistema 7 · Leaderboard, Ranking y Cierre</h2>
          <p class="subtitle">HU-19 a HU-22 · RF-46 a RF-54</p>
        </div>
        <div>
          <span class="badge ${estadoConcurso.fase_eliminatoria_estado === 'Concluida' ? 'badge-ok' : 'badge-obs'}">
            FASE: ${estadoConcurso.fase_eliminatoria_estado || 'EN CURSO'}
          </span>
          <span class="badge ${estadoConcurso.portal_publicado ? 'badge-ok' : 'badge-rej'}">
            ${estadoConcurso.portal_publicado ? '🌐 LEADERBOARD: PUBLICADO' : '🔒 LEADERBOARD: NO PUBLICADO'}
          </span>
        </div>
      </div>

      <div style="margin-top:16px; margin-bottom:14px;">
        <p style="font-size:13px; color:var(--muted);">
          Edición 2026: <strong>${bloqueado ? '🔒 Archivada y Concluida' : '🟢 En Curso'}</strong>
        </p>
      </div>

      <div id="s7FeedbackGlobal" style="margin-bottom:14px;"></div>

      <div style="background:#f8fafc; border:1px solid var(--border); border-radius:12px; padding:16px; margin-bottom:24px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
          <div>
            <h4 style="margin:0; font-size:16px; color:var(--primary);">🏆 Leaderboard Oficial (Cuartetos con 3 Notas Completas)</h4>
            <p style="font-size:12px; color:var(--muted); margin:2px 0 0 0;">Ordenado estrictamente de mayor a menor promedio.</p>
          </div>
          <button type="button" class="btn ${estadoConcurso.portal_publicado ? 'btn-danger' : 'btn-success'}" id="btnTogglePublicacion" style="padding:6px 14px; font-size:13px;">
            ${estadoConcurso.portal_publicado ? '🔒 Ocultar Leaderboard a Representantes' : '📢 Publicar Leaderboard a Representantes'}
          </button>
        </div>

        <table style="width:100%; border-collapse:collapse; text-align:left; font-size:13px; background:#fff; border-radius:8px; overflow:hidden;">
          <thead>
            <tr style="background:#f1f5f9; border-bottom:1px solid var(--border); color:var(--muted); font-weight:700;">
              <th style="padding:10px 14px;">Puesto</th>
              <th style="padding:10px 14px;">Cuarteto</th>
              <th style="padding:10px 14px;">Auditorio</th>
              <th style="padding:10px 14px; text-align:center;">Nota A</th>
              <th style="padding:10px 14px; text-align:center;">Nota B</th>
              <th style="padding:10px 14px; text-align:center;">Nota C</th>
              <th style="padding:10px 14px; text-align:center;">Promedio Final</th>
            </tr>
          </thead>
          <tbody>
            ${leaderboardOficial.length === 0 ? `
              <tr>
                <td colspan="7" style="text-align:center; padding:20px; color:var(--muted);">
                  Ningún cuarteto ha completado aún sus 3 notas inmutables por el jurado.
                </td>
              </tr>
            ` : leaderboardOficial.map((q, idx) => `
              <tr style="border-bottom:1px solid #f1f5f9; background:${idx === 0 ? '#fefce8' : '#fff'};">
                <td style="padding:10px 14px; font-weight:800; color:var(--primary);">#${idx + 1}</td>
                <td style="padding:10px 14px;"><strong>${q.nombre}</strong><br><small style="color:var(--muted);">${q.codigo}</small></td>
                <td style="padding:10px 14px; color:var(--muted);">${q.auditorio}</td>
                <td style="padding:10px 14px; text-align:center; font-family:monospace;">${q.notaA}</td>
                <td style="padding:10px 14px; text-align:center; font-family:monospace;">${q.notaB}</td>
                <td style="padding:10px 14px; text-align:center; font-family:monospace;">${q.notaC}</td>
                <td style="padding:10px 14px; text-align:center;">
                  <span style="background:#dcfce7; color:#15803d; padding:4px 10px; border-radius:12px; font-weight:700; font-size:14px;">
                    ${q.promedio.toFixed(2)}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <h4 style="margin-bottom:10px; font-size:15px;">📊 Cuadro General de Méritos (RF-46)</h4>
      <div style="background:#fff; border-radius:10px; border:1px solid var(--border); overflow:hidden; margin-bottom:20px;">
        <table style="width:100%; border-collapse:collapse; text-align:left; font-size:13px;">
          <thead>
            <tr style="background:#f8fafc; border-bottom:1px solid var(--border); color:var(--muted); font-weight:700;">
              <th style="padding:12px 16px; width:8%;">Pos.</th>
              <th style="padding:12px 16px; width:27%;">Cuarteto</th>
              <th style="padding:12px 16px; width:20%;">Auditorio</th>
              <th style="padding:12px 16px; width:10%; text-align:center;">Jurado A</th>
              <th style="padding:12px 16px; width:10%; text-align:center;">Jurado B</th>
              <th style="padding:12px 16px; width:10%; text-align:center;">Jurado C</th>
              <th style="padding:12px 16px; width:15%; text-align:center;">Promedio Parcial</th>
            </tr>
          </thead>
          <tbody>
            ${rankingGeneral.length === 0 ? `
              <tr>
                <td colspan="7" style="text-align:center; padding:24px; color:var(--muted);">
                  No hay cuartetos evaluados y programados en el ranking.
                </td>
              </tr>
            ` : rankingGeneral.map((q, idx) => `
              <tr style="border-bottom:1px solid #f1f5f9;">
                <td style="padding:12px 16px; font-weight:800; color:var(--primary);">#${idx + 1}</td>
                <td style="padding:12px 16px;">
                  <strong>${q.nombre}</strong><br><small style="color:var(--muted);">${q.codigo}</small>
                </td>
                <td style="padding:12px 16px; color:var(--muted);">${q.auditorio}</td>
                <td style="padding:12px 16px; text-align:center; font-family:monospace;">${q.notaA}</td>
                <td style="padding:12px 16px; text-align:center; font-family:monospace;">${q.notaB}</td>
                <td style="padding:12px 16px; text-align:center; font-family:monospace;">${q.notaC}</td>
                <td style="padding:12px 16px; text-align:center;">
                  <span style="background:#f1f5f9; color:var(--ink); padding:4px 10px; border-radius:12px; font-weight:700;">
                    ${q.promedio.toFixed(2)}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      ${descalificados.length > 0 ? `
        <h4 style="margin-bottom:10px; font-size:14px; color:var(--danger);">🚫 Cuartetos Excluidos por Descalificación (HU-18)</h4>
        <div style="background:#fff1f2; border:1px solid #fecdd3; border-radius:8px; padding:12px; margin-bottom:20px; font-size:13px;">
          ${descalificados.map(d => `
            <div style="margin-bottom:6px;">
              <strong>${d.nombre}</strong> (${d.codigo}) — Causa: <b>${d.motivo}</b> (Excluido del cuadro de méritos).
            </div>
          `).join('')}
        </div>
      ` : ''}

      <h4 style="margin-bottom:12px; font-size:15px;">⚙️ Acciones de Cierre Global (HU-22)</h4>
      <div style="display:flex; gap:12px; flex-wrap:wrap;">
        <button type="button" class="btn btn-danger" id="btnArchivarEdicion" style="padding:10px 16px;" ${bloqueado ? 'disabled' : ''}>
          🔒 Finalizar y Archivar Edición 2026 (HU-22)
        </button>
      </div>
    </div>
  `;
}

function bindS7() {
  const fb = document.getElementById('s7FeedbackGlobal');

  const btnTogglePub = document.getElementById('btnTogglePublicacion');
  if (btnTogglePub) {
    btnTogglePub.addEventListener('click', async () => {
      const estadoActual = btnTogglePub.textContent.includes('Ocultar');
      const nuevoEstado = !estadoActual;

      const { error } = await supabase
        .from('configuracion_concurso')
        .update({ portal_publicado: nuevoEstado })
        .eq('id', 1);

      if (error) {
        if (fb) fb.innerHTML = `<div class="alert alert-danger">Error al cambiar estado de publicación: ${error.message}</div>`;
        return;
      }

      notificar(nuevoEstado ? '📢 Leaderboard publicado con éxito para los representantes.' : '🔒 Leaderboard ocultado.', 'ok');
      await renderAdminTab();
    });
  }

  const btnArchivar = document.getElementById('btnArchivarEdicion');
  if (btnArchivar) {
    btnArchivar.addEventListener('click', async () => {
      if (!confirm('⚠️ ADVERTENCIA: Esta acción es irreversible. ¿Desea finalizar y archivar la edición 2026 del concurso? (HU-22)')) return;

      const { error } = await supabase
        .from('configuracion_concurso')
        .update({ edicion_archivada: true })
        .eq('id', 1);

      if (error) {
        if (fb) fb.innerHTML = `<div class="alert alert-danger">Error al archivar edición: ${error.message}</div>`;
        return;
      }

      notificar('🔒 Edición 2026 finalizada y archivada correctamente (HU-22).', 'ok');
      await renderAdminTab();
    });
  }
}