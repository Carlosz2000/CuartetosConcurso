import{t as e}from"./rolldown-runtime-B8xr6ykz.js";import{n as t,t as n}from"./supabase-CB1mEzEw.js";/* empty css               *//* empty css                      */import{t as r}from"./app-Cou5NU7L.js";import{n as i,t as a}from"./session-yeiSACR6.js";var o=e((()=>{a(),n();var e=null,r={ficha:{id:null,codigo:null,nombre:``,estado:`pendiente`,motivo:``,observacionProfesor:``,repertorio:{obligatoria:null,libre:null},integrantes:[],profesor:null,confirmacionValor:!1,fechaConfirmacionValor:null,auditorio:null,sede:null,fechaPresentacion:null,horaPresentacion:null,estadoPresentacion:`Pendiente`,motivoDescalificacion:``}},o=e=>document.getElementById(e);document.addEventListener(`DOMContentLoaded`,async function(){try{e=i(`representante`)}catch(e){console.warn(`⚠️ Intento de acceso no autorizado detectado en portal del representante:`,e),window.location.replace(`login.html`);return}!e||e.rol!==`representante`?window.location.replace(`login.html`):(document.querySelectorAll(`.tab-btn`).forEach(e=>{e.addEventListener(`click`,function(){u(this.dataset.tab)})}),await s(),g())});async function s(){try{let n=e||JSON.parse(sessionStorage.getItem(`competia_session`)||`{}`),i=n.id_usuario||n.id,a=n.correo||n.email||n.correo_institucional;if(!i&&!a){alert(`⚠️ No se encontró una sesión activa válida. Por favor, inicia sesión.`),window.location.replace(`login.html`);return}let o=null,s=null;if(i){let e=await t.from(`cuarteto`).select(`*`).eq(`id_representante`,i);o=e.data,s=e.error}if((!o||o.length===0)&&a){let e=await t.from(`cuarteto`).select(`*`).eq(`correo_contacto`,a);o=e.data,s=e.error}if(s||!o||o.length===0){r.ficha.nombre=`Sin Cuarteto Registrado`,r.ficha.estado=`Sin Ficha`,l(),c(`Sin Ficha`);return}let u=o[0];r.ficha.id=u.id_cuarteto,r.ficha.codigo=u.codigo_cuarteto||`CQ-2026-${u.id_cuarteto}`,r.ficha.nombre=u.nombre_cuarteto,r.ficha.estado=u.estado_inscripcion?u.estado_inscripcion.toLowerCase():`en borrador`,r.ficha.observacionProfesor=u.observacion_profesor||``,r.ficha.repertorio={obligatoria:u.obra_obligatoria||`No especificada`,libre:u.obra_libre_titulo||`No especificada`},r.ficha.auditorio=u.auditorio,r.ficha.sede=u.sede||`Sede Central`,r.ficha.fechaPresentacion=u.fecha_presentacion,r.ficha.horaPresentacion=u.hora_presentacion,r.ficha.estadoPresentacion=u.estado_presentacion||`Pendiente`,r.ficha.motivoDescalificacion=u.motivo_descalificacion||``;let{data:d}=await t.from(`integrante`).select(`*`).eq(`id_cuarteto`,u.id_cuarteto);if(d&&(r.ficha.integrantes=d.map(e=>({nombre:e.nombre_completo,edad:e.edad,dni:e.dni,correo:e.correo_institucional,instrumento:e.instrumento}))),u.id_profesor_responsable){let{data:e}=await t.from(`usuario`).select(`*`).eq(`id_usuario`,u.id_profesor_responsable).single();if(e){let t=`${e.nombres||``} ${e.apellidos||``}`.trim();r.ficha.profesor={nombre:t||`Docente Supervisor`,dni:e.dni,correo:e.correo_institucional}}}}catch(e){console.error(`Error al conectar con Supabase en el Portal del Representante:`,e)}let n=r.ficha.codigo||`—`,i=r.ficha.nombre,a=o(`headerCodigo`);a&&(a.textContent=`Cuarteto: ${i} (${n})`),c(r.ficha.estado),u(`ficha`)}function c(e){let t=o(`linkInscripcion`);if(!t)return;let n=(e||``).toLowerCase();n===`inscrito`||n===`validado`?(t.setAttribute(`href`,`#`),t.style.opacity=`0.4`,t.style.pointerEvents=`none`,t.title=`Ya te encuentras inscrito en el concurso.`):(t.setAttribute(`href`,`index.html`),t.style.opacity=`1`,t.style.pointerEvents=`auto`,t.title=`Registrar o corregir inscripción`)}function l(){let e=o(`repContent`);e&&(e.innerHTML=`
      <div class="card" style="text-align:center; padding:40px;">
        <h3>📋 Aún no has registrado ningún cuarteto</h3>
        <p style="color:var(--muted); margin-top:10px;">Como representante, puedes iniciar el proceso de inscripción para dar de alta tu agrupación en el concurso.</p>
      </div>
    `)}async function u(e){document.querySelectorAll(`.tab-btn`).forEach(t=>{t.classList.toggle(`active`,t.dataset.tab===e)});let t=o(`repContent`);if(t){switch(e){case`ficha`:t.innerHTML=d();break;case`citacion`:t.innerHTML=f();break;case`leaderboard`:t.innerHTML=await p();break;case`retiro`:t.innerHTML=m()}h(e)}}function d(){let e=r.ficha,t=e.estado.toLowerCase(),n=`📝`,i=`borrador`,a=!1;return t===`inscrito`||t===`validado`?(n=`✅`,i=`validado`):t===`rechazado`?(n=`❌`,i=`rechazado`):t===`observado`?(n=`⚠️`,i=`observado`,a=!0):(n=`📝`,i=`borrador`,a=!0),`
    <div class="estado-banner ${i}">
      <div class="estado-icon">${n}</div>
      <div class="estado-info">
        <h3>Estado: ${e.estado.toUpperCase()}</h3>
        <p>${a?`Puedes modificar los datos de tu ficha antes de la validación administrativa.`:`Ficha en modo lectura (RNF-13).`}</p>
      </div>
    </div>

    <!-- 💬 Comentario o motivo oficial enviado por el profesor supervisor -->
    ${e.observacionProfesor?`
      <div class="card" style="border-left: 4px solid var(--primary); background: #f8fafc; margin-bottom: 20px;">
        <h4 style="font-size: 14px; color: var(--primary); margin-bottom: 6px;">💬 Comentarios del Docente Supervisor:</h4>
        <p style="font-size: 13px; color: var(--ink); margin: 0; line-height: 1.5;">${e.observacionProfesor}</p>
      </div>
    `:``}

    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <h2>Detalles de la Ficha y Confirmación de Valor (HU-03)</h2>
        ${a?`<button class="btn btn-secondary" id="btnEditarFicha">✏️ Editar Ficha</button>`:``}
      </div>

      <div class="alert alert-info" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <div>
          <strong>💳 Valor Oficial de Inscripción: S/ 120.00</strong><br>
          <small>${e.confirmacionValor?`✅ Confirmado el `+e.fechaConfirmacionValor:`⏳ Pendiente de confirmación de lectura por el estudiante`}</small>
        </div>
        ${e.confirmacionValor?`<span class="badge badge-ok">✓ Revisión Confirmada</span>`:`<button class="btn btn-primary" id="btnConfirmarValor">✓ Confirmar Estado y Valor</button>`}
      </div>

      <div class="ficha-grid">
        <div class="ficha-item"><div class="label">Código</div><div class="value">${e.codigo}</div></div>
        <div class="ficha-item"><div class="label">Cuarteto</div><div class="value">${e.nombre}</div></div>
        <div class="ficha-item"><div class="label">Integrantes Registrados</div><div class="value">${e.integrantes.length} músicos</div></div>
        <div class="ficha-item"><div class="label">Profesor Supervisor</div><div class="value">${e.profesor?.nombre||`No asignado`}</div></div>
        <div class="ficha-item"><div class="label">Obra Obligatoria</div><div class="value">${e.repertorio.obligatoria||`—`}</div></div>
        <div class="ficha-item"><div class="label">Obra Libre</div><div class="value">${e.repertorio.libre||`—`}</div></div>
      </div>
    </div>
  `}function f(){let e=r.ficha,t=e.auditorio&&e.fechaPresentacion&&e.horaPresentacion,n=e.estadoPresentacion===`Descalificado`;return`
    <div class="card" style="border-left:5px solid ${n?`var(--danger)`:t?`var(--success)`:`var(--warn)`};">
      <div class="ficha-header" style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px;">
        <div>
          <h2>📜 Citación Oficial de Presentación</h2>
          <p class="subtitle">Detalles del turno asignado por la administración (S4 / S6)</p>
        </div>
        <span class="badge ${n?`badge-rej`:t?`badge-ok`:`badge-obs`}">
          ${n?`🚫 Descalificado`:t?`✅ Turno Programado`:`⏳ Pendiente de Programación`}
        </span>
      </div>

      ${n?`
        <div class="alert alert-danger" style="margin-top:16px;">
          <div><strong>🚫 Agrupación Excluida:</strong> Su cuarteto ha sido descalificado. Causa oficial: <b>${e.motivoDescalificacion||`Incumplimiento de normativa`}</b>.</div>
        </div>
      `:t?`
        <div style="background:#f8fafc; padding:16px; border-radius:10px; border:1px solid var(--border); margin-top:16px; display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:14px;">
          <div>
            <span style="font-size:12px; color:var(--muted); display:block; font-weight:700;">🏛️ AUDITORIO ASIGNADO (ÚNICO):</span>
            <strong style="font-size:15px; color:var(--primary);">${e.auditorio}</strong>
            <div style="font-size:12px; color:var(--muted);">${e.sede}</div>
          </div>
          <div>
            <span style="font-size:12px; color:var(--muted); display:block; font-weight:700;">📅 FECHA DE PRESENTACIÓN:</span>
            <strong style="font-size:15px;">${e.fechaPresentacion}</strong>
          </div>
          <div>
            <span style="font-size:12px; color:var(--muted); display:block; font-weight:700;">⏰ HORA EXACTA DEL TURNO:</span>
            <strong style="font-size:16px; color:#15803d; background:#dcfce7; padding:2px 8px; border-radius:6px; display:inline-block;">${e.horaPresentacion} hrs</strong>
          </div>
        </div>

        <div style="margin-top:14px; background:#fff; padding:14px; border:1px solid var(--border); border-radius:8px;">
          <h4 style="font-size:14px; margin-bottom:6px;">🎼 Repertorio Registrado:</h4>
          <div style="font-size:13px; color:var(--ink);">
            • <strong>Obra Obligatoria:</strong> ${e.repertorio.obligatoria}<br>
            • <strong>Obra Libre:</strong> ${e.repertorio.libre}
          </div>
        </div>

        <div style="margin-top:20px; display:flex; gap:10px;">
          <button type="button" class="btn btn-primary" onclick="window.print()">
            🖨️ Imprimir Citación Oficial (RF-34)
          </button>
        </div>
      `:`
        <div class="alert alert-warn" style="margin-top:16px;">
          <div><strong>⏳ En proceso de agendamiento:</strong> Su cuarteto se encuentra registrado e inscrito, pero la administración aún no ha fijado el auditorio y el horario en el cronograma oficial. Vuelva a consultar más tarde.</div>
        </div>
      `}
    </div>
  `}async function p(){try{let{data:e}=await t.from(`configuracion_concurso`).select(`portal_publicado`).eq(`id`,1).maybeSingle();if(!e?.portal_publicado)return`
        <div class="card" style="text-align:center; padding:40px;">
          <h3>🔒 Leaderboard No Disponible</h3>
          <p style="color:var(--muted); margin-top:10px;">La administración aún no ha publicado el cuadro oficial de resultados de la fase eliminatoria.</p>
        </div>
      `;let{data:n}=await t.from(`cuarteto`).select(`*`).eq(`estado_inscripcion`,`Inscrito`),r=[];try{let{data:e}=await t.from(`evaluacion`).select(`*`);e&&(r=e)}catch(e){console.warn(`Error leyendo evaluaciones:`,e)}let i=(n||[]).map(e=>{let t=e.estado_presentacion===`Descalificado`,n=r.filter(t=>t.id_cuarteto===e.id_cuarteto||t.codigo_cuarteto===e.codigo_cuarteto),i=e=>{let t=n.find(t=>t.etiqueta_jurado===e&&t.inmutable);return t?Number(t.nota):null},a=[i(`A`),i(`B`),i(`C`)].filter(e=>e!==null),o=a.length===3,s=o?Number((a.reduce((e,t)=>e+t,0)/3).toFixed(2)):0;return{codigo:e.codigo_cuarteto||`CQ-2026-${e.id_cuarteto}`,nombre:e.nombre_cuarteto,auditorio:e.auditorio||`Sin Asignar`,promedio:s,tieneTresNotas:o,descalificado:t}}).filter(e=>!e.descalificado&&e.tieneTresNotas).sort((e,t)=>t.promedio-e.promedio);return`
      <div class="card">
        <div class="ficha-header">
          <div>
            <h2>🏆 Leaderboard Oficial del Concurso</h2>
            <p class="subtitle">Cuartetos evaluados con sus tres calificaciones inmutables, ordenados de mayor a menor promedio.</p>
          </div>
          <span class="badge badge-ok">🌐 Publicado Oficialmente</span>
        </div>

        <div style="margin-top:16px;">
          <table style="width:100%; border-collapse:collapse; text-align:left; font-size:13px; background:#fff; border-radius:8px; overflow:hidden;">
            <thead>
              <tr style="background:#f8fafc; border-bottom:2px solid var(--border); color:var(--muted); font-weight:700;">
                <th style="padding:12px 16px;">Puesto</th>
                <th style="padding:12px 16px;">Cuarteto</th>
                <th style="padding:12px 16px;">Auditorio</th>
                <th style="padding:12px 16px; text-align:center;">Promedio Final</th>
              </tr>
            </thead>
            <tbody>
              ${i.length===0?`
                <tr>
                  <td colspan="4" style="text-align:center; padding:24px; color:var(--muted);">
                    No hay cuartetos con tres notas completas registrados en el leaderboard actual.
                  </td>
                </tr>
              `:i.map((e,t)=>`
                <tr style="border-bottom:1px solid #f1f5f9; background:${t===0?`#fefce8`:`#fff`};">
                  <td style="padding:12px 16px; font-weight:800; color:var(--primary);">#${t+1}</td>
                  <td style="padding:12px 16px;"><strong>${e.nombre}</strong><br><small style="color:var(--muted);">${e.codigo}</small></td>
                  <td style="padding:12px 16px; color:var(--muted);">${e.auditorio}</td>
                  <td style="padding:12px 16px; text-align:center;">
                    <span style="background:#dcfce7; color:#15803d; padding:4px 12px; border-radius:12px; font-weight:700; font-size:15px;">
                      ${e.promedio.toFixed(2)}
                    </span>
                  </td>
                </tr>
              `).join(``)}
            </tbody>
          </table>
        </div>
      </div>
    `}catch(e){return console.error(`Error al renderizar leaderboard público:`,e),`<div class="card"><div class="alert alert-danger">Error al cargar el leaderboard.</div></div>`}}function m(){let e=r.ficha,t=(e.estado||``).toLowerCase(),n=t===`inscrito`||t===`validado`;return`
    <div class="card">
      <h2>Retiro Voluntario</h2>
      <p class="subtitle">Gestión de exclusión del concurso</p>

      ${n?`
        <div class="alert alert-warn" style="margin-bottom: 16px;">
          <div><strong>🔒 Acción no disponible:</strong> Su inscripción ya se encuentra formalizada (estado: <b>${e.estado.toUpperCase()}</b>). Por motivos de organización y cronograma, ya no es posible solicitar el retiro voluntario directamente desde el portal.</div>
        </div>
      `:``}

      <div class="form-row">
        <label>Motivo del retiro</label>
        <textarea id="motivoRetiro" rows="3" placeholder="Escribe el motivo..." ${n?`disabled`:``}></textarea>
      </div>

      <button class="btn btn-danger" id="btnSolicitarRetiro" ${n?`disabled style="opacity:0.5; cursor:not-allowed;"`:``}>
        Solicitar Retiro
      </button>
    </div>
  `}function h(e){if(e===`ficha`){let e=o(`btnConfirmarValor`);e&&e.addEventListener(`click`,async()=>{try{let e=r.ficha.id,n=new Date().toLocaleString(`es-PE`),{error:i}=await t.from(`cuarteto`).update({confirmacion_valor:!0,fecha_confirmacion:new Date().toISOString()}).eq(`id_cuarteto`,e);i&&console.warn(`Aviso al actualizar en BD:`,i.message),r.ficha.confirmacionValor=!0,r.ficha.fechaConfirmacionValor=n,alert(`✅ Confirmación de estado y valor registrada con éxito.`),u(`ficha`)}catch(e){console.error(`Error al confirmar valor:`,e)}});let n=o(`btnEditarFicha`);n&&n.addEventListener(`click`,()=>{let e=r.ficha.id;confirm(`¿Deseas modificar los datos de tu ficha de inscripción?`)&&(window.location.href=`index.html?edit_id=${e}`)})}}function g(){let e=o(`modalObservacionSistema`),n=document.querySelectorAll(`.modal-box input[type="text"], .modal-box input:not([type]), input`),i=null;n.forEach(e=>{let t=e.closest(`.form-row`)||e.parentElement;t&&(t.textContent.includes(`Cuarteto`)||t.textContent.includes(`Remitente`))&&(i=e)}),i||=document.querySelector(`.modal-box input`),i&&(i.removeAttribute(`readonly`),i.removeAttribute(`disabled`),i.style.backgroundColor=`#ffffff`,i.style.cursor=`text`,i.style.pointerEvents=`auto`,i.placeholder=`Ej: Cuarteto Fuga - Juan Pérez`),document.querySelectorAll(`[data-action="observaciones"], #btnAbrirModalFeedback`).forEach(t=>{t.addEventListener(`click`,()=>{e&&(e.style.display=`flex`,i&&i.focus())})}),o(`btnCerrarModalFeedback`)?.addEventListener(`click`,()=>{e&&(e.style.display=`none`)}),o(`btnCancelarFeedback`)?.addEventListener(`click`,()=>{e&&(e.style.display=`none`)});let a=document.querySelector(`#btnEnviarFeedback, .btn-primary[type="submit"], .modal-box .btn-primary`);if(a){let n=a.cloneNode(!0);a.parentNode.replaceChild(n,a),n.addEventListener(`click`,async n=>{n.preventDefault();let a=document.querySelector(`textarea, #detalleObservacion, [name*="detalle"]`),o=a?a.value.trim():``,s=i?i.value.trim():``,c=r.ficha.id;if(!s)alert(`Por favor, escribe el nombre del cuarteto o remitente.`),i&&i.focus();else if(!o)alert(`Por favor, escribe el detalle de la observación antes de enviar.`),a&&a.focus();else if(!c)alert(`No se encontró un cuarteto asociado a esta sesión.`);else try{let{error:n}=await t.from(`buzon_observaciones`).insert([{id_cuarteto:c,remitente:s,texto:o}]);if(n)throw n;alert(`✅ ¡Observación enviada con éxito a la nube! La administración la revisará desde el panel S6.`),a&&(a.value=``),i&&(i.value=``),e&&(e.style.display=`none`)}catch(e){console.error(`Error al enviar observación:`,e),alert(`Hubo un error al enviar la observación: `+e.message)}})}}}));r(),o();