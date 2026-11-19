import{t as e}from"./rolldown-runtime-B8xr6ykz.js";import{n as t,t as n}from"./supabase-CB1mEzEw.js";/* empty css               *//* empty css                      *//* empty css                   */e((()=>{n();var e=`concurso_cuartetos_s4_programaciones`;function r(e,t=null){if(!e||typeof e!=`string`||e.trim()===``||e===`undefined`)return t;try{return JSON.parse(e)}catch(e){return console.warn(`⚠️ JSON corrupto o inválido:`,e),t}}var i=[{id:`aud-principal`,nombre:`Auditorio Principal`,sede:`Sede Central`,capacidad:400,terna:[`Dra. Beatriz Morales`,`Dr. Luis Paredes`,`Mg. Ana Torres`]},{id:`aud-b`,nombre:`Auditorio B — Sala Beethoven`,sede:`Sede Central`,capacidad:250,terna:[`Dr. Carlos Mendoza`,`Dra. María Salazar`,`Mtro. Eduardo Valdivia`]},{id:`aud-c`,nombre:`Auditorio C — Sala Mozart`,sede:`Sede Norte`,capacidad:200,terna:[`Dra. Patricia Sotomayor`,`Dr. Gonzalo Cárdenas`,`Mg. Valeria Benavides`]},{id:`aud-camara`,nombre:`Sala de Cámara`,sede:`Sede Central`,capacidad:120,terna:[`Dr. Andrés Holguín`,`Dra. Carmen Revilla`,`Mtro. Diego Seminario`]}],a=[`10:00 AM`,`10:30 AM`,`11:00 AM`,`11:30 AM`,`12:00 PM`,`02:00 PM`,`02:30 PM`,`03:00 PM`,`03:30 PM`,`04:00 PM`],o=[],s=[...i],c=[],l=null,u=null,d={};async function f(){try{let{data:e}=await t.from(`usuario`).select(`id_usuario, nombres, apellidos`);e&&e.forEach(e=>{d[e.id_usuario]=`${e.nombres||``} ${e.apellidos||``}`.trim()})}catch(e){console.warn(`No se pudo cargar el mapa de jurados:`,e)}}function p(e){if(!e)return`No asignada`;let t=typeof e==`string`?r(e,e):e;if(Array.isArray(t))return t.map(e=>d[e]||e).join(` · `);if(typeof t==`object`&&t){let e=t.a||t[0],n=t.b||t[1],r=t.c||t[2];return[d[e]||e||`Jurado A`,d[n]||n||`Jurado B`,d[r]||r||`Jurado C`].join(` · `)}return String(e)}async function m(){await f();let e=r(localStorage.getItem(`concurso_ternas_auditorio`),null);e&&s.forEach(t=>{e[t.nombre]&&(t.terna=e[t.nombre])});try{let{data:e}=await t.from(`configuracion_concurso`).select(`ternas_auditorios`).eq(`id`,1).maybeSingle();if(e&&e.ternas_auditorios){let t=typeof e.ternas_auditorios==`string`?JSON.parse(e.ternas_auditorios):e.ternas_auditorios;s.forEach(e=>{t[e.nombre]&&(e.terna=t[e.nombre])})}}catch{}try{let{data:e,error:n}=await t.from(`cuarteto`).select(`*`).not(`auditorio`,`is`,null).neq(`estado_presentacion`,`Descalificado`);!n&&e&&(o=e.map((e,t)=>{let n=s.find(t=>t.nombre===e.auditorio||t.id===e.auditorio),r=n?n.terna:[`Jurado A`,`Jurado B`,`Jurado C`];return{id:`prog-${e.id_cuarteto}`,cuartetoId:e.id_cuarteto,codigoCuarteto:e.codigo_cuarteto||`CQ-2026-${e.id_cuarteto}`,cuartetoNombre:e.nombre_cuarteto,fase:`Primera Eliminatoria`,fecha:e.fecha_presentacion||`2026-10-15`,hora:e.hora_presentacion||`10:00 AM`,sede:e.sede||`Sede Central`,auditorioId:n?n.id:`aud-b`,auditorioNombre:e.auditorio,orden:t+1,terna:r,estado:e.estado_presentacion||`Programado`,obras:`${e.obra_obligatoria||`Obra Obligatoria`} · ${e.obra_libre_titulo||`Obra Libre`}`,trazabilidad:`Sincronizado desde Supabase`}}))}catch(e){console.warn(`⚠️ Error al sincronizar programaciones:`,e)}}document.addEventListener(`DOMContentLoaded`,async()=>{await m(),await b(),x(),M()});function h(){localStorage.setItem(e,JSON.stringify(o))}function g(e,t,n){return o.find(r=>(r.auditorioId===e||r.auditorioNombre===e)&&r.fecha===t&&r.hora===n)||null}function _(e){return o.find(t=>t.codigoCuarteto===e||t.cuartetoId===e)||null}function v(e){return s.find(t=>t.id===e||t.nombre===e)}function y(e){return c.find(t=>t.codigo===e||t.id===e)}async function b(){let e=document.getElementById(`selectAuditorio`),n=document.getElementById(`selectCuarteto`);if(!e||!n)return;let r=e.value,i=n.value;try{let{data:e,error:n}=await t.from(`cuarteto`).select(`*`).eq(`estado_inscripcion`,`Inscrito`).neq(`estado_presentacion`,`Descalificado`);c=!n&&e?e.map(e=>({id:e.id_cuarteto,codigo:e.codigo_cuarteto||`CQ-2026-${e.id_cuarteto}`,nombre:e.nombre_cuarteto,profesor:`Docente Responsable`,auditorioAsignado:e.auditorio,horaAsignada:e.hora_presentacion,fechaAsignada:e.fecha_presentacion,obras:`${e.obra_obligatoria||`Obra Obligatoria`} · ${e.obra_libre_titulo||`Obra Libre`}`})):[]}catch(e){console.warn(`⚠️ No se pudo obtener la nómina desde Supabase:`,e),c=[]}if(e.innerHTML=``,s.forEach(t=>{let n=o.filter(e=>e.auditorioId===t.id||e.auditorioNombre===t.nombre).length,r=document.createElement(`option`);r.value=t.id,r.textContent=`${t.nombre} (${t.sede} · Cap. ${t.capacidad}) ${n>0?`— [${n} turno(s) asignado(s)]`:`— [Disponible]`}`,e.appendChild(r)}),r&&s.some(e=>e.id===r)?e.value=r:s.length>0&&(e.value=s[0].id),n.innerHTML=`<option value="">-- Seleccionar Cuarteto a Programar --</option>`,c.length===0){let e=document.createElement(`option`);e.value=``,e.disabled=!0,e.textContent=`No hay cuartetos disponibles`,n.appendChild(e)}else c.forEach(e=>{let t=document.createElement(`option`);t.value=e.codigo,t.textContent=e.auditorioAsignado&&e.horaAsignada?`${e.nombre} (${e.codigo}) — 🔒 Ya tiene auditorio: ${e.auditorioAsignado} (${e.horaAsignada})`:`${e.nombre} (${e.codigo}) — 🟢 Pendiente de Programación`,n.appendChild(t)});i&&(n.value=i),E(),D()}function x(){S(),C(),O(),j(),k()}function S(){let e=c.length,t=o.length,n=s.length,r=document.getElementById(`statTotalCuartetos`),i=document.getElementById(`statProgramados`),a=document.getElementById(`statTotalAuditorios`),l=document.getElementById(`statTurnosTotales`);r&&(r.textContent=e),i&&(i.textContent=`${t}/${e}`),a&&(a.textContent=n),l&&(l.textContent=t)}function C(){let e=document.getElementById(`auditoriosGrid`);e&&(e.innerHTML=``,s.forEach(t=>{let n=o.filter(e=>e.auditorioId===t.id||e.auditorioNombre===t.nombre),r=n.length>0,i=document.createElement(`div`);i.className=`auditorio-card ${r?`ocupado`:`disponible`}`,i.innerHTML=`
      <div>
        <div class="auditorio-header">
          <div>
            <div class="auditorio-titulo">${t.nombre}</div>
            <div class="auditorio-sede">${t.sede} · Capacidad: ${t.capacidad} personas</div>
          </div>
          <span class="status-badge ${r?`status-ocupado`:`status-disponible`}">
            ${r?`🔒 ${n.length} Turno(s)`:`🟢 Disponible`}
          </span>
        </div>

        <div class="auditorio-info">
          ${r?`
            <div style="font-size:12px; margin-bottom:8px;">
              <strong>Cuarteto(s) con auditorio asignado:</strong>
              ${n.map(e=>`
                <div class="cuarteto-ocupante" style="margin-top:4px;">
                  🎻 <strong>${e.cuartetoNombre}</strong> (${e.fecha} · ${e.hora})
                </div>
              `).join(``)}
            </div>
          `:`
            <div style="color:var(--success); font-weight:600; font-size:13px; margin: 8px 0;">
              ✨ Auditorio totalmente libre para nuevas programaciones
            </div>
          `}
          <div class="terna-jurados">
            👨‍⚖️ <strong>Terna Oficial (RF-33):</strong><br>
            ${p(t.terna)}
          </div>
        </div>
      </div>

      <div class="auditorio-actions">
        <button class="btn btn-primary" style="font-size:12px; padding:7px 12px; width:100%;" onclick="seleccionarAuditorioDesdeTarjeta('${t.id}')">
          👉 Ver y Escoger Horarios en este Auditorio
        </button>
      </div>
    `,e.appendChild(i)}))}function w(e){let t=document.getElementById(`selectAuditorio`);t&&(t.value=e,E(),O());let n=document.getElementById(`formProgramar`);n&&n.scrollIntoView({behavior:`smooth`})}function T(){confirm(`¿Cerrar sesión y volver al inicio?`)&&(sessionStorage.removeItem(`competia_session`),window.location.href=`landing.html`)}function E(){let e=document.getElementById(`selectAuditorio`),t=document.getElementById(`infoAuditorioSeleccionado`);if(!e||!t)return;let n=e.value,r=v(n);r&&(t.innerHTML=`
      <div style="font-size:13px; color:var(--ink); background:#f8fafc; padding:10px 14px; border-radius:8px; border:1px solid var(--border);">
        🏛️ <strong>${r.nombre}</strong> (${r.sede} · Capacidad: ${r.capacidad}) · 👨‍⚖️ <strong>Terna (RF-33):</strong> ${p(r.terna)}
      </div>
    `)}function D(){let e=document.getElementById(`selectCuarteto`),t=document.getElementById(`alertCuartetoEstado`),n=document.getElementById(`btnProgramar`);if(!e||!t||!n)return;let r=e.value;if(!r){t.style.display=`none`,n.disabled=!0;return}let i=_(r);i?(t.className=`alert alert-warn`,t.style.display=`block`,t.innerHTML=`
      <div>
        <strong>⚠️ Cuarteto con Auditorio Único ya Asignado</strong>
        El cuarteto <strong>${i.cuartetoNombre}</strong> ya tiene asignado el <strong>${i.auditorioNombre}</strong> el ${i.fecha} a las ${i.hora}.
        <br><small><strong>Regla de negocio:</strong> Un cuarteto NO puede estar en diferentes auditorios. Para cambiarlo, use <strong>"Reprogramar Turno"</strong> o libere el auditorio actual.</small>
      </div>
    `,n.disabled=!0):(t.style.display=`none`,n.disabled=l===null),k()}function O(){let e=document.getElementById(`selectAuditorio`),t=document.getElementById(`inputFecha`),n=document.getElementById(`slotsGrid`),r=document.getElementById(`slotsDisponiblesCount`);if(!e||!t||!n)return;let i=e.value,o=t.value;n.innerHTML=``;let s=0;l&&g(i,o,l)&&(l=null),a.forEach(e=>{let t=g(i,o,e),r=t!==null,a=l===e;r||s++;let c=document.createElement(`div`);c.className=`slot-card ${r?`ocupado`:`disponible`} ${a?`selected`:``}`,c.innerHTML=`
      <div>
        <div class="slot-header">
          <span class="slot-hora">${e}</span>
          <span class="slot-badge ${r?`badge-busy`:`badge-free`}">
            ${r?`🔒 Ocupado`:a?`✓ Elegido`:`🟢 Libre`}
          </span>
        </div>
        <div class="slot-detalle ${r?`ocupante-nombre`:``}">
          ${r?`
            Asignado a:<br>
            <strong>${t.cuartetoNombre}</strong>
            <br><small style="color:#94a3b8;">${t.codigoCuarteto}</small>
          `:a?`
            <strong style="color:var(--primary);">Turno seleccionado</strong><br>Haz clic en otro para cambiar
          `:`
            Horario disponible.<br>Haz clic para seleccionar este turno.
          `}
        </div>
      </div>
    `,r?c.title=`Reservado por ${t.cuartetoNombre}.`:c.onclick=()=>{l=e,O(),D()},n.appendChild(c)}),r&&(r.textContent=`${s} de ${a.length} horarios libres`),k()}function k(){let e=document.getElementById(`selectAuditorio`),t=document.getElementById(`inputFecha`),n=document.getElementById(`selectCuarteto`),r=document.getElementById(`resumenTurnoBox`),i=document.getElementById(`resumenTurnoInfo`),a=document.getElementById(`btnProgramar`);if(!e||!t||!n||!r||!i||!a)return;let o=e.value,s=t.value,c=n.value,u=v(o),d=y(c);l&&u&&d&&!_(c)?(r.style.display=`flex`,i.innerHTML=`
      <div>
        🎯 <strong>Turno Preparado para Guardar:</strong><br>
        Auditorio: <strong>${u.nombre}</strong> (${u.sede}) · Fecha: <strong>${s}</strong> · Hora: <strong>${l}</strong><br>
        Cuarteto: <strong>${d.nombre}</strong> (${d.codigo}) · Terna: ${p(u.terna)}
      </div>
    `,a.disabled=!1):(r.style.display=`none`,l||(a.disabled=!0))}function A(e){if(!e)return 0;let t=e.split(` `);if(t.length<2)return 0;let[n,r]=t,[i,a]=n.split(`:`).map(Number);return r===`PM`&&i<12&&(i+=12),r===`AM`&&i===12&&(i=0),i*60+a}function j(){let e=document.getElementById(`cronogramaTableBody`);e&&(e.innerHTML=``,o.length===0?e.innerHTML=`
      <tr>
        <td colspan="7" style="text-align:center; padding:30px; color:var(--muted);">
          No hay turnos programados aún. Asigne auditorios y horarios usando el formulario superior.
        </td>
      </tr>
    `:[...o].sort((e,t)=>{let n=e.fecha.localeCompare(t.fecha);return n===0?A(e.hora)-A(t.hora):n}).forEach(t=>{let n=document.createElement(`tr`);n.innerHTML=`
      <td><strong>${t.fecha}</strong></td>
      <td><span class="badge badge-code">${t.hora}</span></td>
      <td>
        <strong>${t.cuartetoNombre}</strong>
        <br><small style="color:var(--muted);">${t.codigoCuarteto}</small>
      </td>
      <td>
        <span class="table-badge-auditorio">🏛️ ${t.auditorioNombre}</span>
        <br><small style="color:var(--muted);">${t.sede} · Turno #${t.orden}</small>
      </td>
      <td><small>${p(t.terna)}</small></td>
      <td><span class="badge badge-ok">${t.estado}</span></td>
      <td>
        <div style="display:flex; gap:6px;">
          <button class="btn btn-secondary" style="font-size:12px; padding:4px 8px;" onclick="abrirModalCitacion('${t.id}')">📜 Presentación</button>
          <button class="btn btn-primary" style="font-size:12px; padding:4px 8px;" onclick="abrirModalReprogramar('${t.id}')">🔄 Reprogramar</button>
          <button class="btn btn-danger" style="font-size:12px; padding:4px 8px;" onclick="confirmarLiberar('${t.id}')">❌</button>
        </div>
      </td>
    `,e.appendChild(n)}))}function M(){let e=document.getElementById(`selectAuditorio`);e&&e.addEventListener(`change`,()=>{E(),O()});let t=document.getElementById(`inputFecha`);t&&t.addEventListener(`change`,()=>{O()});let n=document.getElementById(`selectCuarteto`);n&&n.addEventListener(`change`,()=>{D()});let r=document.getElementById(`formProgramar`);r&&r.addEventListener(`submit`,e=>{e.preventDefault(),N()});let i=document.getElementById(`btnSimularConflicto`);i&&i.addEventListener(`click`,()=>{z()}),window.addEventListener(`keydown`,e=>{e.key===`Escape`&&K()})}async function N(){let e=document.getElementById(`selectCuarteto`),n=document.getElementById(`selectAuditorio`),r=document.getElementById(`inputFecha`),i=document.getElementById(`selectFase`),a=e?e.value:``,s=n?n.value:``,c=r?r.value:``,u=l,d=i?i.value:`Primera Eliminatoria`;if(!a||!s||!c||!u){alert(`⚠️ Complete todos los campos requeridos y seleccione un horario libre de la grilla.`);return}let f=y(a),p=v(s),m=_(a);if(m){U(`Cuarteto ya asignado`,`El cuarteto <strong>${f.nombre}</strong> ya tiene asignado el <strong>${m.auditorioNombre}</strong> el ${m.fecha} a las ${m.hora}.`);return}let S=g(s,c,u);if(S){V(p.nombre,c,u,S.cuartetoNombre,S.codigoCuarteto);return}let{error:C}=await t.from(`cuarteto`).update({sede:p.sede,auditorio:p.nombre,fecha_presentacion:c,hora_presentacion:u,estado_presentacion:`Programado`}).eq(`codigo_cuarteto`,f.codigo);if(C){alert(`❌ Error al guardar en Supabase: ${C.message}`);return}let w={id:`prog-${Date.now()}`,cuartetoId:f.id,codigoCuarteto:f.codigo,cuartetoNombre:f.nombre,fase:d,fecha:c,hora:u,sede:p.sede,auditorioId:p.id,auditorioNombre:p.nombre,orden:o.length+1,terna:p.terna,estado:`Programado`,obras:f.obras,trazabilidad:`Programado por admin@cons.pe · ${new Date().toLocaleString(`es-PE`)}`};o.push(w),l=null,h(),await b(),x(),typeof registrarCorreoSimulado==`function`&&registrarCorreoSimulado(`representante@cons.pe, docente@cons.pe`,`Citación Oficial Concurso: ${f.nombre}`,`Se ha programado su turno para el ${c} a las ${u} hrs en el ${p.nombre}.`,`RF-31 / RF-34`),B(w)}async function P(e){let n=o.find(t=>t.id===e);if(n&&confirm(`¿Liberar el turno en ${n.auditorioNombre} (${n.fecha} · ${n.hora}) asignado a ${n.cuartetoNombre}?`)){if(n.codigoCuarteto){let{error:e}=await t.from(`cuarteto`).update({sede:null,auditorio:null,fecha_presentacion:null,hora_presentacion:null,estado_presentacion:`Pendiente`}).eq(`codigo_cuarteto`,n.codigoCuarteto);e&&console.warn(`Advertencia al liberar en Supabase:`,e.message)}o=o.filter(t=>t.id!==e),h(),await b(),x(),W(`El turno en ${n.auditorioNombre} (${n.hora}) ha sido liberado.`)}}function F(e){let t=o.find(t=>t.id===e);if(!t)return;let n=document.getElementById(`modalCitacion`);if(!n)return;let r=(e,t)=>{let n=document.getElementById(e);n&&(n.textContent=t)};r(`citacionCuartetoNombre`,t.cuartetoNombre),r(`citacionCodigo`,t.codigoCuarteto),r(`citacionFecha`,t.fecha),r(`citacionHora`,t.hora),r(`citacionSede`,t.sede),r(`citacionAuditorio`,`${t.auditorioNombre} (ÚNICO)`),r(`citacionOrden`,`#${t.orden}`),r(`citacionObras`,t.obras),r(`citacionJurados`,p(t.terna)),n.style.display=`flex`}function I(e){let t=o.find(t=>t.id===e);if(!t)return;u=e;let n=document.getElementById(`modalReprogramar`);if(!n)return;let r=document.getElementById(`reprogCuarteto`),i=document.getElementById(`reprogTurnoActual`),a=document.getElementById(`reprogNuevaFecha`),c=document.getElementById(`reprogMotivo`);r&&(r.textContent=`${t.cuartetoNombre} (${t.codigoCuarteto})`),i&&(i.textContent=`${t.fecha} · ${t.hora} · ${t.auditorioNombre}`),a&&(a.value=t.fecha),c&&(c.value=``);let l=document.getElementById(`reprogNuevoAuditorio`);l&&(l.innerHTML=``,s.forEach(e=>{let n=document.createElement(`option`);n.value=e.id,n.textContent=`${e.nombre} (${e.sede})`,(e.id===t.auditorioId||e.nombre===t.auditorioNombre)&&(n.selected=!0),l.appendChild(n)}),l.onchange=L),a&&(a.onchange=L),L(),n.style.display=`flex`}function L(){let e=o.find(e=>e.id===u),t=document.getElementById(`reprogNuevoAuditorio`),n=document.getElementById(`reprogNuevaFecha`),r=document.getElementById(`reprogNuevaHora`);if(!t||!n||!r)return;let i=t.value,s=n.value;r.innerHTML=``,a.forEach(t=>{let n=g(i,s,t),a=document.createElement(`option`);a.value=t,e&&(e.auditorioId===i||e.auditorioNombre===i)&&e.fecha===s&&e.hora===t?(a.textContent=`📍 ${t} (Horario actual del cuarteto)`,a.selected=!0):n?(a.disabled=!0,a.textContent=`🔒 ${t} — Ocupado por ${n.cuartetoNombre}`):a.textContent=`🟢 ${t} — Disponible`,r.appendChild(a)})}async function R(){if(!u)return;let e=o.find(e=>e.id===u);if(!e)return;let n=document.getElementById(`reprogNuevaFecha`),r=document.getElementById(`reprogNuevaHora`),i=document.getElementById(`reprogNuevoAuditorio`),a=document.getElementById(`reprogMotivo`),s=n?n.value:e.fecha,c=r?r.value:e.hora,l=i?i.value:e.auditorioId,d=a?a.value.trim():``;if(!d){alert(`⚠️ El motivo de reprogramación es obligatorio.`);return}let f=g(l,s,c);if(f&&f.id!==e.id){alert(`⚠️ El horario ${c} en ese auditorio ya está ocupado por ${f.cuartetoNombre}`);return}let p=v(l),{error:m}=await t.from(`cuarteto`).update({sede:p.sede,auditorio:p.nombre,fecha_presentacion:s,hora_presentacion:c,estado_presentacion:`Programado`}).eq(`codigo_cuarteto`,e.codigoCuarteto);if(m){alert(`❌ Error al reprogramar en Supabase: ${m.message}`);return}let _=e.auditorioNombre,y=e.hora;e.fecha=s,e.hora=c,e.auditorioId=p.id,e.auditorioNombre=p.nombre,e.sede=p.sede,e.terna=p.terna,e.trazabilidad=`Reprogramado el ${new Date().toLocaleString(`es-PE`)} · Motivo: ${d}`,h(),K(),await b(),x(),H(e.cuartetoNombre,`${_} (${y})`,`${p.nombre} (${c})`,s,c,d)}function z(){let e=document.getElementById(`selectAuditorio`),t=document.getElementById(`inputFecha`),n=e?e.value:`aud-principal`,r=t?t.value:`2026-10-15`,i=v(n),a=o.find(e=>(e.auditorioId===n||e.auditorioNombre===i.nombre)&&e.fecha===r)||o[0];a&&V(a.auditorioNombre,a.fecha,a.hora,a.cuartetoNombre,a.codigoCuarteto)}function B(e){let t=document.getElementById(`modalTurnoProgramado`),n=document.getElementById(`tpDetalle`);t&&n&&(n.innerHTML=`
    <div style="font-size:14px; line-height:1.7;">
      <strong>Cuarteto:</strong> ${e.cuartetoNombre} (${e.codigoCuarteto})<br>
      <strong>Auditorio Asignado:</strong> <strong>${e.auditorioNombre} (ÚNICO)</strong><br>
      <strong>Fecha y Hora:</strong> ${e.fecha} · <strong>${e.hora}</strong><br>
      <strong>Sede:</strong> ${e.sede} · <strong>Turno:</strong> #${e.orden}<br>
      <strong>Terna de Jurados (RF-33):</strong> ${p(e.terna)}
    </div>
  `,t.style.display=`flex`)}function V(e,t,n,r,i){let a=document.getElementById(`modalConflicto`),o=document.getElementById(`conflictoDetalle`);a&&o&&(o.innerHTML=`
    El horario <strong>${n}</strong> en el <strong>${e}</strong> (fecha: ${t}) ya se encuentra asignado y bloqueado para:
    <div style="margin-top:10px; padding:10px; background:#fee2e2; border-radius:6px; font-weight:700; color:#991b1b;">
      🎻 ${r} (${i})
    </div>
  `,a.style.display=`flex`)}function H(e,t,n,r,i,a){let o=document.getElementById(`modalReprogramadoExitoso`),s=document.getElementById(`reprogExitoDetalle`);o&&s&&(s.innerHTML=`
    <div style="font-size:14px; line-height:1.6;">
      <strong>Cuarteto:</strong> ${e}<br>
      <strong>Turno Anterior:</strong> <span style="text-decoration:line-through; color:var(--muted);">${t}</span> (Liberado)<br>
      <strong>Nuevo Turno:</strong> <strong style="color:var(--primary);">${n}</strong> (Guardado y Bloqueado)<br>
      <strong>Fecha:</strong> ${r}<br>
      <strong>Motivo registrado (RNF-17):</strong> ${a}
    </div>
  `,o.style.display=`flex`)}function U(e,t){alert(`⚠️ ${e}\n\n${t.replace(/<[^>]*>/g,``)}`)}function W(e){let t=document.createElement(`div`);t.className=`alert alert-success`,t.style.position=`fixed`,t.style.top=`20px`,t.style.right=`20px`,t.style.zIndex=`9999`,t.style.boxShadow=`0 10px 25px rgba(0,0,0,0.15)`,t.innerHTML=`<strong>[OK]</strong> ${e}`,document.body.appendChild(t),setTimeout(()=>t.remove(),3500)}function G(e){let t=document.getElementById(e);t&&(t.style.display=`none`)}function K(){document.querySelectorAll(`.modal-backdrop`).forEach(e=>e.style.display=`none`)}async function q(){let e=document.getElementById(`modalCatalogoJurados`);e&&(await Y(),e.style.display=`flex`)}function J(){let e=document.getElementById(`modalCatalogoJurados`);e&&(e.style.display=`none`)}async function Y(){let e=document.getElementById(`tablaJuradosBody`);if(e){e.innerHTML=`<tr><td colspan="6" style="text-align:center; padding:20px; color:var(--muted);">Cargando jurados desde Supabase...</td></tr>`;try{let{data:n,error:r}=await t.from(`usuario`).select(`*`).eq(`id_rol`,7);if(r)throw r;let i=n||[];if(i.length===0){e.innerHTML=`
        <tr>
          <td colspan="6" style="text-align:center; padding:24px; color:var(--muted);">
            No hay jurados registrados en Supabase. Registre cuentas de jurado desde el Subsistema 5 (Panel Administrador).
          </td>
        </tr>
      `;return}e.innerHTML=i.map((e,t)=>{let n=`${e.nombres||``} ${e.apellidos||``}`.trim()||e.nombre||`Sin Nombre`,r=e.correo_institucional||e.correo||`—`,i=e.especialidad||`Música de Cámara`,a=e.dni||`—`,o=e.institucion||`Conservatorio Nacional`;return`
        <tr>
          <td><strong>#${t+1}</strong></td>
          <td><strong>${n}</strong><br><small style="color:var(--muted);">${r}</small></td>
          <td>${i}</td>
          <td><span class="badge badge-code">${a}</span></td>
          <td>${o}</td>
          <td><span class="table-badge-auditorio" style="font-size:11px;">🏛️ Habilitado (Supabase)</span></td>
        </tr>
      `}).join(``)}catch(t){console.error(`Error al obtener jurados de Supabase:`,t),e.innerHTML=`
      <tr>
        <td colspan="6" style="text-align:center; color:var(--danger); padding:20px;">
          Error al cargar la nómina de jurados: ${t.message}
        </td>
      </tr>
    `}}}window.seleccionarAuditorioDesdeTarjeta=w,window.cerrarSesion=T,window.abrirModalCitacion=F,window.abrirModalReprogramar=I,window.confirmarLiberar=P,window.ejecutarReprogramacion=R,window.cerrarModal=G,window.abrirModalCatalogoJurados=q,window.cerrarModalCatalogoJurados=J}))();