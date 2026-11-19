import{n as e,t}from"./rolldown-runtime-B8xr6ykz.js";import{n,t as r}from"./supabase-CB1mEzEw.js";/* empty css               */import{t as i}from"./datos-sdRSxqeE.js";import{n as a,t as o}from"./session-yeiSACR6.js";function s(e){if(!e)return 0;let t=e.toString().split(`:`);if(t.length===2){let e=parseInt(t[0],10)||0,n=parseInt(t[1],10)||0;return e*60+n}return parseInt(e,10)||0}function c(e){if(!e||isNaN(e))return`0:00`;let t=Math.floor(e/60),n=e%60;return`${t}:${n<10?`0`:``}${n}`}async function l(){try{let{data:e,error:t}=await n.from(`obra`).select(`*`).eq(`tipo_obra`,`obligatoria`).order(`titulo`,{ascending:!0});if(t)throw t;return e||[]}catch(e){return console.error(`Error al consultar todas las obras obligatorias:`,e.message),[]}}async function u(e,t,r){let i=e?e.trim():``,a=t?t.trim():``;if(!i)throw Error(`El campo Título es obligatorio.`);if(!a)throw Error(`El campo Compositor es obligatorio.`);let{data:o}=await n.from(`obra`).select(`id_obra`).ilike(`titulo`,i).maybeSingle();if(o)throw Error(`La obra "${i}" ya se encuentra registrada en el catálogo.`);let c=s(r),{data:l,error:u}=await n.from(`obra`).insert([{titulo:i,compositor:a,duracion_estimada:c,tipo_obra:`obligatoria`,estado:!0}]).select().single();if(u)throw u;return l}async function d(e,t){let{data:r,error:i}=await n.from(`obra`).update({estado:t}).eq(`id_obra`,e).select().single();if(i)throw i;return r}var f=e((()=>{r()})),p=t((()=>{o(),f(),r();var e=null,t=`s1`,i=`TODOS`;function s(e,t=`ok`){typeof showToast==`function`?showToast(e,t):typeof window.showToast==`function`?window.showToast(e,t):console.log(`[Toast ${t}]: ${e}`)}document.addEventListener(`DOMContentLoaded`,async()=>{try{e=a(`administrador`)}catch(e){console.warn(`⚠️ Intento de acceso no autorizado detectado:`,e),window.location.replace(`login.html`);return}if(!e||e.rol!==`administrador`){window.location.replace(`login.html`);return}let n=document.getElementById(`adminCredencial`);n&&(n.textContent=`${e.nombre||e.nombres||`Admin`} · ${(e.rol||`administrador`).toUpperCase()}`),document.querySelectorAll(`[data-admin-tab]`).forEach(e=>{e.addEventListener(`click`,()=>{t=e.dataset.adminTab,t===`s4`?window.location.href=`cronograma.html`:(document.querySelectorAll(`[data-admin-tab]`).forEach(e=>e.classList.remove(`active`)),e.classList.add(`active`),p())})}),await p()});async function p(){let e=document.getElementById(`adminMainContent`);if(e)switch(t){case`s1`:e.innerHTML=await h(),g();break;case`s4`:window.location.href=`cronograma.html`;break;case`s5`:e.innerHTML=await _(),v();break;case`s6`:e.innerHTML=await y(),b();break;case`s7`:e.innerHTML=await x(),S()}}async function m(){try{let{data:e,error:t}=await n.from(`configuracion_concurso`).select(`*`).eq(`id`,1).maybeSingle();return t||!e?{fase_eliminatoria_estado:`En Curso`,edicion_archivada:!1,portal_publicado:!1}:e}catch{return{fase_eliminatoria_estado:`En Curso`,edicion_archivada:!1,portal_publicado:!1}}}async function h(){let e=(await m()).edicion_archivada,t=await l();return`
    <div class="card">
      <div class="ficha-header">
        <div>
          <h2>🎼 Subsistema 1 · Catálogo de Obras Obligatorias</h2>
          <p class="subtitle">HU-01 · HU-02 · Gestión, Edición y Activación de Obras</p>
        </div>
        <span class="badge badge-ok">${t.filter(e=>e.estado===!0).length} activas / ${t.length} totales</span>
      </div>

      <div class="grid-2" style="margin-top:16px; align-items:start;">
        <div class="integrante-card" style="background:#fff;">
          <h4 id="s1FormTitulo">➕ Registrar Obra Obligatoria</h4>
          <form id="formS1Obra">
            <input type="hidden" id="s1ObraId" value="">
            
            <div class="form-row">
              <label>Título de la Obra <span class="req">*</span></label>
              <input type="text" id="s1Titulo" placeholder="Ej: Cuarteto en Fa Mayor" ${e?`disabled`:``} required>
            </div>
            
            <div class="form-row">
              <label>Compositor <span class="req">*</span> (CA3)</label>
              <input type="text" id="s1Compositor" placeholder="Ej: Maurice Ravel" ${e?`disabled`:``} required>
            </div>
            
            <div class="form-row">
              <label>Duración Estimada (mm:ss)</label>
              <input type="text" id="s1Duracion" placeholder="Ej: 5:15" value="5:15" ${e?`disabled`:``}>
            </div>
            
            <div id="s1Feedback" style="margin-bottom:12px;"></div>
            
            <div style="display:flex; gap:8px;">
              <button type="submit" class="btn btn-primary" style="flex:1;" ${e?`disabled`:``}>
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
                ${t.length===0?`<tr><td colspan="4" style="text-align:center;">No hay obras obligatorias registradas.</td></tr>`:t.map(t=>{let n=t.duracion_estimada||t.duracion||0,r=t.estado===!0;return`
                      <tr style="background: ${r?`#fff`:`#f8fafc`}; opacity: ${r?`1`:`0.6`};">
                        <td>
                          <strong>${t.titulo}</strong><br>
                          <small style="color:var(--muted);">${t.compositor||`—`}</small>
                        </td>
                        <td><span class="badge badge-code">${c(n)} min</span></td>
                        <td>
                          <span class="badge ${r?`badge-ok`:`badge-rej`}">
                            ${r?`ACTIVA`:`INACTIVA`}
                          </span>
                        </td>
                        <td style="text-align:center; white-space:nowrap;">
                          <button type="button" class="btn btn-secondary btn-editar-obra" 
                            data-id="${t.id_obra||t.id}" 
                            data-titulo="${t.titulo}" 
                            data-compositor="${t.compositor||``}" 
                            data-duracion="${c(n)}" 
                            style="padding:3px 8px; font-size:11px;" ${e?`disabled`:``}>
                            ✏️ Editar
                          </button>
                          <button type="button" class="btn ${r?`btn-danger`:`btn-success`} btn-toggle-estado" 
                            data-id="${t.id_obra||t.id}" 
                            data-nuevo-estado="${!r}" 
                            style="padding:3px 8px; font-size:11px;" ${e?`disabled`:``}>
                            ${r?`🔴 Desactivar`:`🟢 Activar`}
                          </button>
                        </td>
                      </tr>
                    `}).join(``)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `}function g(){let e=document.getElementById(`formS1Obra`);if(!e)return;e.addEventListener(`submit`,async t=>{t.preventDefault();let r=document.getElementById(`s1ObraId`).value,i=document.getElementById(`s1Titulo`).value.trim(),a=document.getElementById(`s1Compositor`).value.trim(),o=document.getElementById(`s1Duracion`).value.trim(),c=document.getElementById(`s1Feedback`);try{if(r){let e=315;if(o.includes(`:`)){let t=o.split(`:`);e=(parseInt(t[0])||0)*60+(parseInt(t[1])||0)}else e=parseInt(o)||315;let{error:t}=await n.from(`obra`).update({titulo:i,compositor:a,duracion_estimada:e}).eq(`id_obra`,r);if(t)throw t;s(`✅ Obra "${i}" actualizada correctamente.`,`ok`)}else await u(i,a,o),s(`✅ Obra "${i}" agregada al catálogo.`,`ok`);e.reset(),document.getElementById(`s1ObraId`).value=``,document.getElementById(`s1FormTitulo`).textContent=`➕ Registrar Obra Obligatoria`,document.getElementById(`s1BtnCancelar`).style.display=`none`,await p()}catch(e){c.innerHTML=`<div class="alert alert-danger"><div>⚠️ ${e.message}</div></div>`}}),document.querySelectorAll(`.btn-editar-obra`).forEach(e=>{e.addEventListener(`click`,()=>{document.getElementById(`s1ObraId`).value=e.dataset.id,document.getElementById(`s1Titulo`).value=e.dataset.titulo,document.getElementById(`s1Compositor`).value=e.dataset.compositor,document.getElementById(`s1Duracion`).value=e.dataset.duracion,document.getElementById(`s1FormTitulo`).textContent=`✏️ Editar Obra Obligatoria`,document.getElementById(`s1BtnCancelar`).style.display=`inline-block`,window.scrollTo({top:0,behavior:`smooth`})})});let t=document.getElementById(`s1BtnCancelar`);t&&t.addEventListener(`click`,()=>{e.reset(),document.getElementById(`s1ObraId`).value=``,document.getElementById(`s1FormTitulo`).textContent=`➕ Registrar Obra Obligatoria`,t.style.display=`none`}),document.querySelectorAll(`.btn-toggle-estado`).forEach(e=>{e.addEventListener(`click`,async()=>{let t=e.dataset.id,n=e.dataset.nuevoEstado===`true`;try{await d(t,n),s(`✅ Obra marcada como ${n?`ACTIVA`:`INACTIVA`}`,`ok`),await p()}catch(e){s(`Error al cambiar estado: ${e.message}`,`error`)}})})}async function _(){let e=(await m()).edicion_archivada,{data:t,error:r}=await n.from(`usuario`).select(`*`).eq(`id_rol`,7);r&&console.error(`⚠️ Error al consultar jurados en Supabase:`,r.message);let i=t||[],a={};try{let{data:e}=await n.from(`configuracion_concurso`).select(`ternas_auditorios`).eq(`id`,1).maybeSingle();e&&e.ternas_auditorios&&(a=typeof e.ternas_auditorios==`string`?JSON.parse(e.ternas_auditorios):e.ternas_auditorios)}catch(e){console.warn(`No se pudieron leer las ternas de Supabase:`,e)}let o=document.getElementById(`s5Auditorio`)?.value||`Auditorio Principal`,s=a[o]||{a:``,b:``,c:``};return`
    <div class="card">
      <div class="ficha-header">
        <div>
          <h2>👨‍⚖️ Subsistema 5 · Gestión de Jurados y Control de Incompatibilidad</h2>
          <p class="subtitle">HU-14 · HU-15 · RF-35 a RF-38 (Sincronizado con Base de Datos)</p>
        </div>
        <span class="badge badge-ok">${i.length} Jurados Registrados</span>
      </div>

      <div class="grid-2" style="margin-top:20px; align-items:start; gap:20px;">
        <div class="integrante-card" style="background:#fff; padding:20px; border-radius:12px; border:1px solid #e2e8f0;">
          <h4>🔐 HU-14 · Crear Cuenta de Jurado con Contraseña</h4>
          <form id="formCrearJurado">
            <div class="form-row" style="margin-bottom:12px;">
              <label style="display:block; font-weight:600; margin-bottom:4px;">Nombre Completo <span class="req">*</span></label>
              <input type="text" id="s5Nombre" placeholder="Ej: Dra. Beatriz Morales" style="width:100%; padding:8px 12px; border-radius:6px; border:1px solid #cbd5e1;" ${e?`disabled`:``} required>
            </div>
            <div class="grid-2" style="gap:12px;">
              <div class="form-row" style="margin-bottom:12px;">
                <label style="display:block; font-weight:600; margin-bottom:4px;">DNI (8 dígitos) <span class="req">*</span></label>
                <input type="text" id="s5Dni" maxlength="8" placeholder="Ej: 45678912" style="width:100%; padding:8px 12px; border-radius:6px; border:1px solid #cbd5e1;" ${e?`disabled`:``} required>
              </div>
              <div class="form-row" style="margin-bottom:12px;">
                <label style="display:block; font-weight:600; margin-bottom:4px;">Especialidad Musical <span class="req">*</span></label>
                <input type="text" id="s5Especialidad" placeholder="Ej: Violín y Música de Cámara" style="width:100%; padding:8px 12px; border-radius:6px; border:1px solid #cbd5e1;" ${e?`disabled`:``} required>
              </div>
            </div>
            <div class="form-row" style="margin-bottom:12px;">
              <label style="display:block; font-weight:600; margin-bottom:4px;">Correo Institucional <span class="req">*</span></label>
              <input type="email" id="s5Correo" placeholder="Ej: bmorales@conservatorio.edu.pe" style="width:100%; padding:8px 12px; border-radius:6px; border:1px solid #cbd5e1;" ${e?`disabled`:``} required>
            </div>
            <div class="form-row" style="margin-bottom:16px;">
              <label style="display:block; font-weight:600; margin-bottom:4px;">Contraseña Provisional <span class="req">*</span></label>
              <input type="password" id="s5Password" placeholder="Mínimo 6 caracteres" style="width:100%; padding:8px 12px; border-radius:6px; border:1px solid #cbd5e1;" ${e?`disabled`:``} required minlength="6">
            </div>
            <div id="s5FeedbackJurado" style="margin-bottom:10px;"></div>
            <button type="submit" class="btn btn-primary" style="width:100%; padding:10px;" ${e?`disabled`:``}>
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
              <select id="s5Auditorio" style="width:100%; padding:8px 12px; border-radius:6px; border:1px solid #cbd5e1;" ${e?`disabled`:``}>
                <option value="Auditorio Principal" ${o===`Auditorio Principal`?`selected`:``}>Auditorio Principal</option>
                <option value="Auditorio B — Sala Beethoven" ${o===`Auditorio B — Sala Beethoven`?`selected`:``}>Auditorio B — Sala Beethoven</option>
                <option value="Auditorio C — Sala Mozart" ${o===`Auditorio C — Sala Mozart`?`selected`:``}>Auditorio C — Sala Mozart</option>
              </select>
            </div>
            <div class="form-row" style="margin-bottom:10px;">
              <label style="display:block; font-weight:600; margin-bottom:4px;">Jurado A <span class="req">*</span></label>
              <select id="s5JuradoA" style="width:100%; padding:8px 12px; border-radius:6px; border:1px solid #cbd5e1;" ${e?`disabled`:``}>
                <option value="">-- Seleccionar Jurado A --</option>
                ${i.map(e=>{let t=`${e.nombres||``} ${e.apellidos||``}`.trim()||e.nombre||e.correo_institucional,n=e.id_usuario||e.id;return`<option value="${n}" ${s.a===n||s[0]===n?`selected`:``}>${t}</option>`}).join(``)}
              </select>
            </div>
            <div class="form-row" style="margin-bottom:10px;">
              <label style="display:block; font-weight:600; margin-bottom:4px;">Jurado B <span class="req">*</span></label>
              <select id="s5JuradoB" style="width:100%; padding:8px 12px; border-radius:6px; border:1px solid #cbd5e1;" ${e?`disabled`:``}>
                <option value="">-- Seleccionar Jurado B --</option>
                ${i.map(e=>{let t=`${e.nombres||``} ${e.apellidos||``}`.trim()||e.nombre||e.correo_institucional,n=e.id_usuario||e.id;return`<option value="${n}" ${s.b===n||s[1]===n?`selected`:``}>${t}</option>`}).join(``)}
              </select>
            </div>
            <div class="form-row" style="margin-bottom:14px;">
              <label style="display:block; font-weight:600; margin-bottom:4px;">Jurado C <span class="req">*</span></label>
              <select id="s5JuradoC" style="width:100%; padding:8px 12px; border-radius:6px; border:1px solid #cbd5e1;" ${e?`disabled`:``}>
                <option value="">-- Seleccionar Jurado C --</option>
                ${i.map(e=>{let t=`${e.nombres||``} ${e.apellidos||``}`.trim()||e.nombre||e.correo_institucional,n=e.id_usuario||e.id;return`<option value="${n}" ${s.c===n||s[2]===n?`selected`:``}>${t}</option>`}).join(``)}
              </select>
            </div>
            <div id="s5FeedbackTerna" style="margin-bottom:10px;"></div>
            <div style="display:flex; gap:10px;">
              <button type="submit" class="btn btn-primary" style="flex:1; padding:9px;" ${e?`disabled`:``}>
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
            ${i.length===0?`
              <tr>
                <td colspan="5" style="text-align:center; padding:24px; color:#64748b;">
                  No hay jurados registrados en Supabase (id_rol = 7). Registre uno desde el formulario superior.
                </td>
              </tr>
            `:i.map(e=>{let t=`${e.nombres||``} ${e.apellidos||``}`.trim()||e.nombre||`Sin Nombre`,n=e.correo_institucional||e.correo||`—`;return`
                <tr style="border-bottom:1px solid #f1f5f9; transition:background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='#fff'">
                  <td style="padding:14px 18px; font-weight:600; color:#0f172a;">${t}</td>
                  <td style="padding:14px 18px;">
                    <code style="background:#f1f5f9; color:#334155; padding:3px 8px; border-radius:4px; font-family:monospace;">${e.dni||`—`}</code>
                  </td>
                  <td style="padding:14px 18px; color:#334155;">${n}</td>
                  <td style="padding:14px 18px; color:#475569;">${e.especialidad||`Música de Cámara`}</td>
                  <td style="padding:14px 18px; text-align:center;">
                    <span style="background:#dcfce7; color:#15803d; padding:4px 10px; border-radius:12px; font-size:11px; font-weight:700; display:inline-block;">
                      ${e.estado?`ACTIVO`:`INACTIVO`}
                    </span>
                  </td>
                </tr>
              `}).join(``)}
          </tbody>
        </table>
      </div>
    </div>
  `}function v(){let e=document.getElementById(`formCrearJurado`);e&&e.addEventListener(`submit`,async e=>{e.preventDefault();let t=document.getElementById(`s5Nombre`).value.trim(),r=document.getElementById(`s5Dni`).value.trim(),i=document.getElementById(`s5Especialidad`).value.trim(),a=document.getElementById(`s5Correo`).value.trim(),o=document.getElementById(`s5Password`).value,c=document.getElementById(`s5FeedbackJurado`);if(!t||!r||!i||!a||!o)c.innerHTML=`<div class="alert alert-danger"><div><strong>[!] RF-35:</strong> Complete todos los campos, incluyendo la contraseña.</div></div>`;else try{let{data:e,error:c}=await n.auth.signUp({email:a.toLowerCase(),password:o,options:{data:{nombres:t,rol:`jurado`}}});if(c)throw Error(`Error en Auth de Supabase: ${c.message}`);let l=e.user?e.user.id:null;if(!l)throw Error(`No se pudo obtener el ID del usuario autenticado.`);let{error:u}=await n.from(`usuario`).insert([{id_usuario:l,auth_user_id:l,nombres:t,apellidos:``,dni:r,especialidad:i,correo_institucional:a.toLowerCase(),id_rol:7,estado:!0}]);if(u)throw Error(`Error al registrar perfil en la tabla usuario: ${u.message}`);s(`✅ Cuenta de jurado creada exitosamente en Auth y BD para ${t}.`,`ok`),await p()}catch(e){c.innerHTML=`<div class="alert alert-danger"><div>⚠️ ${e.message}</div></div>`}});let t=document.getElementById(`s5Auditorio`);t&&t.addEventListener(`change`,async()=>{await p()});let r=document.getElementById(`formAsignarTerna`);r&&r.addEventListener(`submit`,async e=>{e.preventDefault();let t=document.getElementById(`s5Auditorio`).value,r=document.getElementById(`s5JuradoA`).value,i=document.getElementById(`s5JuradoB`).value,a=document.getElementById(`s5JuradoC`).value,o=document.getElementById(`s5FeedbackTerna`);if(!r||!i||!a||new Set([r,i,a]).size<3)o.innerHTML=`<div class="alert alert-danger"><div><strong>[!] RF-37:</strong> Debe seleccionar 3 jurados distintos.</div></div>`;else try{let{data:e}=await n.from(`configuracion_concurso`).select(`ternas_auditorios`).eq(`id`,1).maybeSingle(),c={};e&&e.ternas_auditorios&&(c=typeof e.ternas_auditorios==`string`?JSON.parse(e.ternas_auditorios):e.ternas_auditorios),c[t]={a:r,b:i,c:a};let{error:l}=await n.from(`configuracion_concurso`).update({ternas_auditorios:JSON.stringify(c)}).eq(`id`,1);if(l)throw l;localStorage.setItem(`concurso_ternas_auditorio`,JSON.stringify(c)),o.innerHTML=`<div class="alert alert-success"><div><strong>✅ Terna guardada en Base de Datos (Supabase):</strong> Asignada correctamente al <b>${t}</b>.</div></div>`,s(`✅ Terna de 3 jurados guardada en BD para ${t}`,`ok`)}catch(e){o.innerHTML=`<div class="alert alert-danger"><div>Error al guardar en Supabase: ${e.message}</div></div>`}})}async function y(){let e=await m(),t=e.edicion_archivada||e.fase_eliminatoria_estado===`Concluida`,{data:r}=await n.from(`cuarteto`).select(`*`).eq(`estado_inscripcion`,`Inscrito`),a=[];try{let{data:e}=await n.from(`evaluacion`).select(`*`);e&&(a=e)}catch(e){console.warn(`⚠️ No se pudo leer la tabla evaluacion:`,e)}let o=[];try{let{data:e}=await n.from(`buzon_observaciones`).select(`*`).order(`id`,{ascending:!1});e&&(o=e)}catch(e){console.warn(`⚠️ No se pudo leer el buzón de observaciones:`,e)}let s={};try{let{data:e}=await n.from(`usuario`).select(`id_usuario, nombres, apellidos`);e&&e.forEach(e=>{s[e.id_usuario]=`${e.nombres||``} ${e.apellidos||``}`.trim()})}catch{}let c=JSON.parse(localStorage.getItem(`concurso_ternas_auditorio`)||`{}`);try{let{data:e}=await n.from(`configuracion_concurso`).select(`ternas_auditorios`).eq(`id`,1).maybeSingle();if(e&&e.ternas_auditorios){let t=typeof e.ternas_auditorios==`string`?JSON.parse(e.ternas_auditorios):e.ternas_auditorios;c=Object.assign({},c,t)}}catch{}let l=(r||[]).map(e=>{let t=a.filter(t=>t.id_cuarteto===e.id_cuarteto||t.codigo_cuarteto===e.codigo_cuarteto),n=c[e.auditorio]||{a:``,b:``,c:``},r=s[n.a||n[0]],i=s[n.b||n[1]],o=s[n.c||n[2]],l=[r&&r!==`Carlos Mendoza`?r:r||`Matias Jurado`,i||`Jurado Segundo`,o||`Jerick Juez`],u=(e,n)=>{let r=t.find(t=>t.etiqueta_jurado===e),i=l[n]||`Jurado ${e}`;return r?{jurado:r.nombre_jurado||i,valor:r.nota,inmutable:!!r.inmutable,fecha:r.fecha_evaluacion||``}:{jurado:i,valor:null,inmutable:!1,fecha:``}};return{idCuarteto:e.id_cuarteto,codigoCuarteto:e.codigo_cuarteto||`CQ-2026-${e.id_cuarteto}`,nombreCuarteto:e.nombre_cuarteto,auditorio:e.auditorio||`Sin Asignar`,fecha:e.fecha_presentacion||`—`,hora:e.hora_presentacion||`—`,estadoPresentacion:e.estado_presentacion||`Pendiente`,motivoDescalificacion:e.motivo_descalificacion||``,notas:{A:u(`A`,0),B:u(`B`,1),C:u(`C`,2)}}});function u(e){if(!e||e===`—`)return 0;let t=e.toString().toUpperCase().trim(),n=0,r=0;if(t.includes(`AM`)||t.includes(`PM`)){let e=t.includes(`PM`),i=t.replace(`AM`,``).replace(`PM`,``).trim().split(`:`);n=parseInt(i[0],10)||0,r=parseInt(i[1],10)||0,e&&n<12&&(n+=12),!e&&n===12&&(n=0)}else{let e=t.split(`:`);n=parseInt(e[0],10)||0,r=parseInt(e[1],10)||0}return n*60+r}l.sort((e,t)=>{let n=e.fecha&&e.fecha!==`—`?e.fecha:`9999-12-31`,r=t.fecha&&t.fecha!==`—`?t.fecha:`9999-12-31`;return n===r?u(e.hora)-u(t.hora):n.localeCompare(r)});let d=i===`TODOS`?l:l.filter(e=>e.auditorio===i||i===`Auditorio B — Sala Beethoven`&&e.auditorio.includes(`Auditorio B`));return`
    <div class="card">
      <div class="ficha-header">
        <div>
          <h2>⚖️ Subsistema 6 · Supervisión de Sesiones, Observaciones y Descalificación</h2>
          <p class="subtitle">HU-18 · RF-43 a RF-45 · Control de actas y buzón de observaciones</p>
        </div>
        <div style="display:flex; align-items:center; gap:10px;">
          <span class="badge ${t?`badge-rej`:`badge-ok`}">
            ${t?`🔒 Acta Cerrada`:`🟢 Sesión Abierta`}
          </span>
          <button type="button" class="btn ${t?`btn-success`:`btn-danger`}" id="btnToggleSesionS6" style="padding:6px 12px; font-size:12px;">
            ${t?`🟢 Abrir Sesión de Jurados`:`🔒 Cerrar Sesión de Jurados`}
          </button>
        </div>
      </div>

      <div style="background:#f8fafc; padding:14px 18px; border-radius:10px; border:1px solid var(--border); display:flex; gap:16px; align-items:center; flex-wrap:wrap; margin-bottom:18px;">
        <div>
          <label style="font-size:12px; font-weight:700; display:block; margin-bottom:4px;">🏛️ Filtrar por Auditorio:</label>
          <select id="s6FiltroAuditorio" style="padding:8px 12px; border-radius:8px; border:1px solid var(--border);">
            <option value="TODOS" ${i===`TODOS`?`selected`:``}>Todos los Auditorios</option>
            <option value="Auditorio Principal" ${i===`Auditorio Principal`?`selected`:``}>Auditorio Principal</option>
            <option value="Auditorio B — Sala Beethoven" ${i===`Auditorio B — Sala Beethoven`?`selected`:``}>Auditorio B — Sala Beethoven</option>
            <option value="Auditorio C — Sala Mozart" ${i===`Auditorio C — Sala Mozart`?`selected`:``}>Auditorio C — Sala Mozart</option>
          </select>
        </div>
      </div>

      <div id="s6FeedbackGlobal" style="margin-bottom:14px;"></div>

      ${d.length===0?`
        <div style="text-align:center; padding:30px; color:var(--muted);">No hay presentaciones o cuartetos programados en este auditorio.</div>
      `:d.map(e=>{let n=e.estadoPresentacion===`Descalificado`,r=e.notas.A,i=e.notas.B,a=e.notas.C,o=!n&&r.inmutable&&i.inmutable&&a.inmutable;return`
          <div class="integrante-card" style="background:#fff; margin-bottom:16px; border-left:4px solid ${n?`var(--danger)`:o?`var(--success)`:`var(--primary)`}; border-radius:8px; padding:16px; border:1px solid #e2e8f0;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px;">
              <div>
                <h4 style="font-size:16px; margin-bottom:4px;">${e.nombreCuarteto} <span class="chip" style="background:#f1f5f9; padding:2px 8px; border-radius:4px; font-size:12px;">${e.codigoCuarteto}</span></h4>
                <div style="font-size:13px; color:var(--muted);">
                  🏛️ <strong>${e.auditorio}</strong> · 📅 ${e.fecha} (${e.hora})
                </div>
              </div>
              <span class="badge ${n?`badge-rej`:o?`badge-ok`:`badge-obs`}">
                ${n?`🚫 Descalificado`:o?`✅ Evaluado`:`⏳ Pendiente`}
              </span>
            </div>

            ${n?`
              <div class="alert alert-danger" style="margin-top:12px; margin-bottom:0;">
                <div><strong>🚫 Descalificado (HU-18 · RF-43/44):</strong> Causa: <b>${e.motivoDescalificacion||`Sin especificar`}</b>. Excluido del ranking.</div>
              </div>
            `:`
              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:12px; margin-top:14px;">
                ${[`A`,`B`,`C`].map(t=>{let n=e.notas[t];return`
                    <div style="background:#f8fafc; padding:12px; border-radius:8px; border:1px solid ${n.inmutable?`#86efac`:`var(--primary)`};">
                      <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:700;">
                        <span>👨‍⚖️ Jurado ${t} (${n.jurado})</span>
                        <span style="color:${n.inmutable?`var(--success)`:`var(--warn)`};">${n.inmutable?`🔒 Inmutable`:`✏️ Abierto`}</span>
                      </div>
                      ${n.inmutable?`
                        <div style="font-size:22px; font-weight:800; color:var(--ink); margin-top:6px;">
                          ${Number(n.valor).toFixed(2)} <small style="font-size:11px; color:var(--muted);">/ 10.00</small>
                        </div>
                        <div style="font-size:11px; color:var(--muted);">Firmado: ${n.fecha||`—`}</div>
                      `:`
                        <div style="font-size:13px; color:var(--muted); margin-top:6px;">Pendiente (reservado para el jurado)</div>
                      `}
                    </div>
                  `}).join(``)}
              </div>

              <div style="margin-top:12px; padding-top:10px; border-top:1px dashed var(--border); display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                <input type="text" id="motivoDesc_${e.idCuarteto}" placeholder="Causa oficial de descalificación (ej: Inasistencia al turno)..." style="flex:1; min-width:240px; padding:6px 10px; border:1px solid var(--border); border-radius:6px; font-size:12px;" ${t?`disabled`:``}>
                <button type="button" class="btn btn-danger btn-descalificar" data-id="${e.idCuarteto}" data-nombre="${e.nombreCuarteto}" ${t?`disabled`:``}>
                  🚫 Descalificar Cuarteto (HU-18)
                </button>
              </div>
            `}
          </div>
        `}).join(``)}

      <!-- SECCIÓN APARTE ABAJO: LISTA GENERAL DE OBSERVACIONES DEL BUZÓN -->
      <div style="margin-top:32px; background:#fff; border:1px solid var(--border); border-radius:12px; padding:20px;">
        <h3 style="font-size:16px; color:var(--primary); margin-bottom:6px;">💬 Buzón de Observaciones y Dudas de Representantes</h3>
        <p style="font-size:13px; color:var(--muted); margin-bottom:16px;">Listado general de reportes e inquietudes enviadas por las agrupaciones.</p>

        ${o.length===0?`
          <div style="text-align:center; padding:24px; color:var(--muted); background:#f8fafc; border-radius:8px; font-size:13px;">
            No hay observaciones registradas en el buzón.
          </div>
        `:`
          <div style="display:flex; flex-direction:column; gap:12px;">
            ${o.map(e=>`
              <div style="background:#fffbeb; border:1px solid #fef3c7; padding:14px; border-radius:8px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; flex-wrap:wrap; gap:6px;">
                  <span style="font-size:13px; font-weight:700; color:#b45309; background:#fde68a; padding:2px 8px; border-radius:4px;">
                    Remitente / Cuarteto: ${e.remitente||`Desconocido`}
                  </span>
                  <span style="font-size:11px; color:#78350f;">
                    📅 ${new Date(e.fecha).toLocaleString(`es-PE`)}
                  </span>
                </div>
                <div style="font-size:13px; color:#78350f; line-height:1.4;">
                  "${e.texto}"
                </div>
              </div>
            `).join(``)}
          </div>
        `}
      </div>
    </div>
  `}function b(){let e=document.getElementById(`s6FiltroAuditorio`);e&&e.addEventListener(`change`,function(){i=this.value,p()});let t=document.getElementById(`btnToggleSesionS6`);t&&t.addEventListener(`click`,async()=>{let e=t.textContent.includes(`Abrir`),r=e?`En Curso`:`Concluida`;if(!confirm(`¿Confirma ${e?`reabrir la sesión de evaluación`:`cerrar las actas y bloquear la calificación de los jurados`}?`))return;let{error:i}=await n.from(`configuracion_concurso`).update({fase_eliminatoria_estado:r}).eq(`id`,1);if(i){let e=document.getElementById(`s6FeedbackGlobal`);e&&(e.innerHTML=`<div class="alert alert-danger">Error al cambiar el estado de la sesión: ${i.message}</div>`)}else s(e?`🟢 Sesión de evaluación reabierta con éxito.`:`🔒 Sesión cerrada y actas bloqueadas.`,`ok`),await p()}),document.querySelectorAll(`.btn-descalificar`).forEach(e=>{e.addEventListener(`click`,async function(){let e=this.dataset.id,t=this.dataset.nombre,r=document.getElementById(`motivoDesc_${e}`),i=r?r.value.trim():``,a=document.getElementById(`s6FeedbackGlobal`);if(!i){a.innerHTML=`<div class="alert alert-danger"><div><strong>[!] CA1 / RF-43:</strong> Ingrese la causa oficial (ej: "Inasistencia al turno").</div></div>`,r&&r.focus();return}if(!confirm(`¿Confirmar DESCALIFICACIÓN de ${t}? Esta acción es irreversible y liberará su turno en el cronograma (RNF-26).`))return;let{error:o}=await n.from(`cuarteto`).update({estado_presentacion:`Descalificado`,motivo_descalificacion:i,auditorio:null,sede:null,fecha_presentacion:null,hora_presentacion:null}).eq(`id_cuarteto`,e);o?a.innerHTML=`<div class="alert alert-danger"><div>Error al descalificar en Supabase: ${o.message}</div></div>`:(s(`🚫 ${t} descalificado (${i}). Turno liberado (HU-18).`,`ok`),await p())})})}async function x(){let e=await m(),t=e.edicion_archivada,{data:r}=await n.from(`cuarteto`).select(`*`).eq(`estado_inscripcion`,`Inscrito`),i=[];try{let{data:e}=await n.from(`evaluacion`).select(`*`);e&&(i=e)}catch(e){console.warn(`⚠️ No se pudo leer la tabla evaluacion:`,e)}let a=(r||[]).map(e=>{let t=e.estado_presentacion===`Descalificado`,n=i.filter(t=>t.id_cuarteto===e.id_cuarteto||t.codigo_cuarteto===e.codigo_cuarteto),r=e=>{let t=n.find(t=>t.etiqueta_jurado===e&&t.inmutable);return t?Number(t.nota):null},a=r(`A`),o=r(`B`),s=r(`C`),c=[a,o,s].filter(e=>e!==null),l=c.length===3,u=l?Number((c.reduce((e,t)=>e+t,0)/3).toFixed(2)):0;return{id:e.id_cuarteto,codigo:e.codigo_cuarteto||`CQ-2026-${e.id_cuarteto}`,nombre:e.nombre_cuarteto,auditorio:e.auditorio||`Sin Asignar`,notaA:a===null?`—`:a.toFixed(2),notaB:o===null?`—`:o.toFixed(2),notaC:s===null?`—`:s.toFixed(2),promedio:u,tieneTresNotas:l,descalificado:t,motivo:e.motivo_descalificacion||``}}),o=a.filter(e=>!e.descalificado&&e.tieneTresNotas).sort((e,t)=>t.promedio-e.promedio),s=a.filter(e=>!e.descalificado&&e.auditorio).sort((e,t)=>t.promedio-e.promedio),c=a.filter(e=>e.descalificado);return`
    <div class="card">
      <div class="ficha-header">
        <div>
          <h2>🏆 Subsistema 7 · Leaderboard, Ranking y Cierre</h2>
          <p class="subtitle">HU-19 a HU-22 · RF-46 a RF-54</p>
        </div>
        <div>
          <span class="badge ${e.fase_eliminatoria_estado===`Concluida`?`badge-ok`:`badge-obs`}">
            FASE: ${e.fase_eliminatoria_estado||`EN CURSO`}
          </span>
          <span class="badge ${e.portal_publicado?`badge-ok`:`badge-rej`}">
            ${e.portal_publicado?`🌐 LEADERBOARD: PUBLICADO`:`🔒 LEADERBOARD: NO PUBLICADO`}
          </span>
        </div>
      </div>

      <div style="margin-top:16px; margin-bottom:14px;">
        <p style="font-size:13px; color:var(--muted);">
          Edición 2026: <strong>${t?`🔒 Archivada y Concluida`:`🟢 En Curso`}</strong>
        </p>
      </div>

      <div id="s7FeedbackGlobal" style="margin-bottom:14px;"></div>

      <div style="background:#f8fafc; border:1px solid var(--border); border-radius:12px; padding:16px; margin-bottom:24px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
          <div>
            <h4 style="margin:0; font-size:16px; color:var(--primary);">🏆 Leaderboard Oficial (Cuartetos con 3 Notas Completas)</h4>
            <p style="font-size:12px; color:var(--muted); margin:2px 0 0 0;">Ordenado estrictamente de mayor a menor promedio.</p>
          </div>
          <button type="button" class="btn ${e.portal_publicado?`btn-danger`:`btn-success`}" id="btnTogglePublicacion" style="padding:6px 14px; font-size:13px;">
            ${e.portal_publicado?`🔒 Ocultar Leaderboard a Representantes`:`📢 Publicar Leaderboard a Representantes`}
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
            ${o.length===0?`
              <tr>
                <td colspan="7" style="text-align:center; padding:20px; color:var(--muted);">
                  Ningún cuarteto ha completado aún sus 3 notas inmutables por el jurado.
                </td>
              </tr>
            `:o.map((e,t)=>`
              <tr style="border-bottom:1px solid #f1f5f9; background:${t===0?`#fefce8`:`#fff`};">
                <td style="padding:10px 14px; font-weight:800; color:var(--primary);">#${t+1}</td>
                <td style="padding:10px 14px;"><strong>${e.nombre}</strong><br><small style="color:var(--muted);">${e.codigo}</small></td>
                <td style="padding:10px 14px; color:var(--muted);">${e.auditorio}</td>
                <td style="padding:10px 14px; text-align:center; font-family:monospace;">${e.notaA}</td>
                <td style="padding:10px 14px; text-align:center; font-family:monospace;">${e.notaB}</td>
                <td style="padding:10px 14px; text-align:center; font-family:monospace;">${e.notaC}</td>
                <td style="padding:10px 14px; text-align:center;">
                  <span style="background:#dcfce7; color:#15803d; padding:4px 10px; border-radius:12px; font-weight:700; font-size:14px;">
                    ${e.promedio.toFixed(2)}
                  </span>
                </td>
              </tr>
            `).join(``)}
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
            ${s.length===0?`
              <tr>
                <td colspan="7" style="text-align:center; padding:24px; color:var(--muted);">
                  No hay cuartetos evaluados y programados en el ranking.
                </td>
              </tr>
            `:s.map((e,t)=>`
              <tr style="border-bottom:1px solid #f1f5f9;">
                <td style="padding:12px 16px; font-weight:800; color:var(--primary);">#${t+1}</td>
                <td style="padding:12px 16px;">
                  <strong>${e.nombre}</strong><br><small style="color:var(--muted);">${e.codigo}</small>
                </td>
                <td style="padding:12px 16px; color:var(--muted);">${e.auditorio}</td>
                <td style="padding:12px 16px; text-align:center; font-family:monospace;">${e.notaA}</td>
                <td style="padding:12px 16px; text-align:center; font-family:monospace;">${e.notaB}</td>
                <td style="padding:12px 16px; text-align:center; font-family:monospace;">${e.notaC}</td>
                <td style="padding:12px 16px; text-align:center;">
                  <span style="background:#f1f5f9; color:var(--ink); padding:4px 10px; border-radius:12px; font-weight:700;">
                    ${e.promedio.toFixed(2)}
                  </span>
                </td>
              </tr>
            `).join(``)}
          </tbody>
        </table>
      </div>

      ${c.length>0?`
        <h4 style="margin-bottom:10px; font-size:14px; color:var(--danger);">🚫 Cuartetos Excluidos por Descalificación (HU-18)</h4>
        <div style="background:#fff1f2; border:1px solid #fecdd3; border-radius:8px; padding:12px; margin-bottom:20px; font-size:13px;">
          ${c.map(e=>`
            <div style="margin-bottom:6px;">
              <strong>${e.nombre}</strong> (${e.codigo}) — Causa: <b>${e.motivo}</b> (Excluido del cuadro de méritos).
            </div>
          `).join(``)}
        </div>
      `:``}

      <h4 style="margin-bottom:12px; font-size:15px;">⚙️ Acciones de Cierre Global (HU-22)</h4>
      <div style="display:flex; gap:12px; flex-wrap:wrap;">
        <button type="button" class="btn btn-danger" id="btnArchivarEdicion" style="padding:10px 16px;" ${t?`disabled`:``}>
          🔒 Finalizar y Archivar Edición 2026 (HU-22)
        </button>
      </div>
    </div>
  `}function S(){let e=document.getElementById(`s7FeedbackGlobal`),t=document.getElementById(`btnTogglePublicacion`);t&&t.addEventListener(`click`,async()=>{let r=!t.textContent.includes(`Ocultar`),{error:i}=await n.from(`configuracion_concurso`).update({portal_publicado:r}).eq(`id`,1);i?e&&(e.innerHTML=`<div class="alert alert-danger">Error al cambiar estado de publicación: ${i.message}</div>`):(s(r?`📢 Leaderboard publicado con éxito para los representantes.`:`🔒 Leaderboard ocultado.`,`ok`),await p())});let r=document.getElementById(`btnArchivarEdicion`);r&&r.addEventListener(`click`,async()=>{if(!confirm(`⚠️ ADVERTENCIA: Esta acción es irreversible. ¿Desea finalizar y archivar la edición 2026 del concurso? (HU-22)`))return;let{error:t}=await n.from(`configuracion_concurso`).update({edicion_archivada:!0}).eq(`id`,1);t?e&&(e.innerHTML=`<div class="alert alert-danger">Error al archivar edición: ${t.message}</div>`):(s(`🔒 Edición 2026 finalizada y archivada correctamente (HU-22).`,`ok`),await p())})}}));i(),o(),p();