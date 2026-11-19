import{t as e}from"./rolldown-runtime-B8xr6ykz.js";import{n as t,t as n}from"./supabase-CB1mEzEw.js";/* empty css               */import{t as r}from"./datos-sdRSxqeE.js";import{n as i,t as a}from"./session-yeiSACR6.js";import{n as o,t as s}from"./profesorService-CxdWDmi1.js";var c=e((()=>{})),l=e((()=>{a(),s(),n();var e=null,r=`mis`,c=[],l={};document.addEventListener(`DOMContentLoaded`,async()=>{try{e=i(`profesor`)}catch(e){console.warn(`⚠️ Intento de acceso no autorizado detectado en panel de profesor:`,e),window.location.replace(`login.html`);return}if(!e||e.rol!==`profesor`){window.location.replace(`login.html`);return}let t=document.getElementById(`profesorCredencial`);if(t){let n=e.nombre||e.nombres||`Docente Supervisor`,r=e.email||e.correo_institucional||e.correo||``;t.textContent=n+(r?` · `+r:``)}document.querySelectorAll(`[data-prof-tab]`).forEach(e=>{e.addEventListener(`click`,async()=>{r=e.dataset.profTab,document.querySelectorAll(`[data-prof-tab]`).forEach(e=>e.classList.remove(`active`)),e.classList.add(`active`),await d()})}),await u(),await d()});async function u(){let n=e.id_usuario||e.id;c=n?await o(n):[],l={};for(let e of c)try{let{data:n,error:r}=await t.from(`integrante`).select(`*`).eq(`id_cuarteto`,e.id_cuarteto);!r&&n?l[e.id_cuarteto]=n:l[e.id_cuarteto]=[]}catch(t){console.warn(`No se pudieron cargar integrantes:`,t),l[e.id_cuarteto]=[]}}async function d(){document.getElementById(`profesorMainContent`)&&(r===`mis`?f():r===`validar`&&p())}function f(){let e=document.getElementById(`profesorMainContent`);e&&(e.innerHTML=`
    <div class="card">
      <div class="ficha-header">
        <div>
          <h2>Mis Cuartetos Vinculados</h2>
          <p class="subtitle">Supervisión Académica y Revisión de Integrantes</p>
        </div>
        <span class="badge badge-ok">Rol: Docente Supervisor</span>
      </div>
      ${c.length===0?`<div class="alert alert-warn" style="margin-top:16px;"><div>No tienes cuartetos vinculados bajo tu supervisión.</div></div>`:c.map(e=>{let t=e.estado_inscripcion||`En Borrador`,n=t===`Inscrito`||t===`Validado`,r=t===`Rechazado`,i=l[e.id_cuarteto]||[];return`
            <div class="integrante-card" style="background:#fff; margin-top:16px; border-left:4px solid ${n?`#16a34a`:r?`#dc2626`:`#b45309`}; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px;">
                <div>
                  <h4 style="margin:0; font-size:16px;">🎻 ${e.nombre_cuarteto||`Sin Nombre`} <span class="chip" style="font-size:12px;">#${e.id_cuarteto}</span></h4>
                  <p style="font-size:13px; color:#64748b; margin-top:4px;">
                    Estado de Inscripción: <strong>${t}</strong>
                  </p>
                </div>
                <span class="badge ${n?`badge-ok`:r?`badge-danger`:`badge-draft`}">${t}</span>
              </div>

              <div style="font-size:13px; color:#64748b; margin-top:10px; background:#f8fafc; padding:10px; border-radius:6px;">
                🎼 <strong>Obra Obligatoria:</strong> ${e.obra_obligatoria||`No asignada`}<br>
                🎻 <strong>Obra Libre:</strong> ${e.obra_libre_titulo||`No asignada`} (${e.obra_libre_duracion||`0:00`})
              </div>

              <h5 style="margin:14px 0 6px 0; font-size:13px; color:#0f172a;">👥 Músicos Integrantes (${i.length}):</h5>
              <div class="table-container" style="margin-bottom:10px;">
                <table class="table" style="font-size:12px; width:100%; border-collapse:collapse;">
                  <thead>
                    <tr style="background:#f1f5f9; text-align:left;">
                      <th style="padding:6px 8px;">Nombre Completo</th>
                      <th style="padding:6px 8px;">Instrumento</th>
                      <th style="padding:6px 8px;">DNI</th>
                      <th style="padding:6px 8px;">Edad</th>
                      <th style="padding:6px 8px;">Correo Institucional</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${i.length===0?`<tr><td colspan="5" style="padding:8px; text-align:center; color:#64748b;">No hay integrantes registrados.</td></tr>`:i.map(e=>`
                        <tr style="border-bottom:1px solid #f1f5f9;">
                          <td style="padding:6px 8px;"><strong>${e.nombre_completo}</strong></td>
                          <td style="padding:6px 8px;"><span class="badge badge-code" style="font-size:11px;">${e.instrumento||`—`}</span></td>
                          <td style="padding:6px 8px;">${e.dni||`—`}</td>
                          <td style="padding:6px 8px;">${e.edad?e.edad+` años`:`—`}</td>
                          <td style="padding:6px 8px;">${e.correo_institucional||`—`}</td>
                        </tr>
                      `).join(``)}
                  </tbody>
                </table>
              </div>

              ${e.observacion_profesor?`
                <div style="margin-top:10px; padding:10px; background:#f8fafc; border-left:3px solid #2563eb; font-size:13px; border-radius:4px;">
                  <strong>💬 Observación registrada:</strong> ${e.observacion_profesor}
                </div>
              `:``}
            </div>
          `}).join(``)}
    </div>
  `)}function p(){let e=document.getElementById(`profesorMainContent`);e&&(e.innerHTML=`
    <div class="card">
      <div class="ficha-header">
        <div>
          <h2>Validación de Expedientes e Integrantes</h2>
          <p class="subtitle">Revisa los datos de los músicos, repertorio y aprueba o rechaza la inscripción con un motivo oficial.</p>
        </div>
        <span class="badge badge-ok">${c.length} cuartetos bajo tu supervisión</span>
      </div>
      ${c.length===0?`<div class="alert alert-warn" style="margin-top:16px;"><div>No tienes cuartetos para validar en este momento.</div></div>`:c.map(e=>{let t=e.estado_inscripcion||`En Borrador`,n=t===`Inscrito`||t===`Validado`,r=t===`Rechazado`,i=l[e.id_cuarteto]||[];return`
            <div class="integrante-card" style="background:#fff; margin-top:16px; border-left:4px solid ${n?`#16a34a`:r?`#dc2626`:`#2563eb`}; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px;">
                <div>
                  <h4 style="margin-bottom:4px; font-size:16px;">🎻 ${e.nombre_cuarteto||`Sin Nombre`} <span class="chip" style="font-size:12px;">#${e.id_cuarteto}</span></h4>
                  <div style="font-size:13px; color:#64748b;">
                    🎼 <strong>Obligatoria:</strong> ${e.obra_obligatoria||`Sin asignar`} | <strong>Libre:</strong> ${e.obra_libre_titulo||`Sin asignar`}
                  </div>
                </div>
                <span class="badge ${n?`badge-ok`:r?`badge-danger`:`badge-draft`}">${t}</span>
              </div>

              <h5 style="margin:14px 0 6px 0; font-size:13px; color:#0f172a;">👥 Integrantes Declarados (${i.length}):</h5>
              <div class="table-container" style="margin-bottom:12px;">
                <table class="table" style="font-size:12px; width:100%; border-collapse:collapse;">
                  <thead>
                    <tr style="background:#f1f5f9; text-align:left;">
                      <th style="padding:6px 8px;">Nombre Completo</th>
                      <th style="padding:6px 8px;">Instrumento</th>
                      <th style="padding:6px 8px;">DNI</th>
                      <th style="padding:6px 8px;">Edad</th>
                      <th style="padding:6px 8px;">Correo Institucional</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${i.length===0?`<tr><td colspan="5" style="padding:8px; text-align:center; color:#64748b;">No hay integrantes registrados.</td></tr>`:i.map(e=>`
                        <tr style="border-bottom:1px solid #f1f5f9;">
                          <td style="padding:6px 8px;"><strong>${e.nombre_completo}</strong></td>
                          <td style="padding:6px 8px;"><span class="badge badge-code" style="font-size:11px;">${e.instrumento||`—`}</span></td>
                          <td style="padding:6px 8px;">${e.dni||`—`}</td>
                          <td style="padding:6px 8px;">${e.edad?e.edad+` años`:`—`}</td>
                          <td style="padding:6px 8px;">${e.correo_institucional||`—`}</td>
                        </tr>
                      `).join(``)}
                  </tbody>
                </table>
              </div>

              ${e.observacion_profesor?`
                <div style="margin-top:10px; padding:10px; background:#f8fafc; border-left:3px solid #2563eb; font-size:13px; border-radius:4px;">
                  <strong>💬 Observación del Docente registrada:</strong> ${e.observacion_profesor}
                </div>
              `:``}
              
              <div style="margin-top:14px; display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                <button type="button" class="btn btn-success btn-iniciar-val" data-id="${e.id_cuarteto}" data-est="Inscrito" style="background:#16a34a; color:#fff; padding:6px 12px; border:none; border-radius:4px; font-size:13px; cursor:pointer;">
                  ✓ Aprobar e Inscribir
                </button>
                <button type="button" class="btn btn-warning btn-iniciar-val" data-id="${e.id_cuarteto}" data-est="Observado" style="background:#ca8a04; color:#fff; padding:6px 12px; border:none; border-radius:4px; font-size:13px; cursor:pointer;">
                  ⚠️ Marcar como Observado
                </button>
                <button type="button" class="btn btn-danger btn-iniciar-val" data-id="${e.id_cuarteto}" data-est="Rechazado" style="background:#dc2626; color:#fff; padding:6px 12px; border:none; border-radius:4px; font-size:13px; cursor:pointer;">
                  ✕ Rechazar
                </button>
              </div>

              <div id="val-form-${e.id_cuarteto}" style="display:none; margin-top:12px; background:#fdfdfd; padding:12px; border:1px solid #e2e8f0; border-radius:6px;">
                <label style="font-size:12px; font-weight:700; display:block; margin-bottom:6px;">✍️ Escribe el motivo u observación para el expediente (<span id="val-label-tipo-${e.id_cuarteto}">validación</span>):</label>
                <textarea id="val-txt-${e.id_cuarteto}" rows="2" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:4px; font-size:13px;" placeholder="Ej. Integrantes y repertorio conformes...">${e.observacion_profesor||``}</textarea>
                <div style="margin-top:8px; display:flex; gap:8px;">
                  <button type="button" class="btn btn-primary btn-enviar-val" data-id="${e.id_cuarteto}" style="padding:6px 12px; font-size:12px; background:#2563eb; color:#fff; border:none; border-radius:4px; cursor:pointer;">Enviar y Actualizar Estado</button>
                  <button type="button" class="btn btn-secondary btn-cancelar-val" data-id="${e.id_cuarteto}" style="padding:6px 12px; font-size:12px; background:#64748b; color:#fff; border:none; border-radius:4px; cursor:pointer;">Cancelar</button>
                </div>
              </div>

            </div>
          `}).join(``)}
    </div>
  `,document.querySelectorAll(`.btn-iniciar-val`).forEach(e=>{e.addEventListener(`click`,function(){let e=this.dataset.id,t=this.dataset.est;document.querySelectorAll(`[id^="val-form-"]`).forEach(e=>e.style.display=`none`);let n=document.getElementById(`val-form-${e}`),r=document.getElementById(`val-label-tipo-${e}`),i=n.querySelector(`.btn-enviar-val`);i.dataset.est=t,r.textContent=t===`Inscrito`?`aprobación`:t===`Observado`?`observación`:`rechazo`,n.style.display=`block`})}),document.querySelectorAll(`.btn-cancelar-val`).forEach(e=>{e.addEventListener(`click`,function(){let e=this.dataset.id;document.getElementById(`val-form-${e}`).style.display=`none`})}),document.querySelectorAll(`.btn-enviar-val`).forEach(e=>{e.addEventListener(`click`,async function(){let e=this.dataset.id,n=this.dataset.est,r=document.getElementById(`val-txt-${e}`),i=r?r.value.trim():``;if((n===`Rechazado`||n===`Observado`)&&!i)alert(`⚠️ Por favor, escribe un motivo u observación obligatoria para este estado.`);else try{let{error:r}=await t.from(`cuarteto`).update({estado_inscripcion:n,observacion_profesor:i}).eq(`id_cuarteto`,e);if(r)throw r;alert(`✅ Cuarteto actualizado exitosamente a estado: `+n),await u(),await d()}catch(e){console.error(`Error al actualizar en BD:`,e),alert(`Ocurrió un error al intentar guardar la validación en la base de datos.`)}})}))}}));r(),a(),c(),l();