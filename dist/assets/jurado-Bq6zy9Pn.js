import{n as e,t}from"./rolldown-runtime-B8xr6ykz.js";import{n,t as r}from"./supabase-CB1mEzEw.js";/* empty css               *//* empty css                   */import{t as i}from"./datos-sdRSxqeE.js";import{n as a,t as o}from"./session-yeiSACR6.js";async function s(e){let{data:t,error:r}=await n.from(`usuario`).select(`*`).ilike(`correo_institucional`,e).maybeSingle();return r||!t?null:{...t,auditorio:t.auditorio||`Auditorio Principal`,etiqueta:t.etiqueta_jurado||t.etiqueta||`C`}}async function c(){let{data:e,error:t}=await n.from(`configuracion_concurso`).select(`*`).limit(1).maybeSingle();return t&&console.warn(`Aviso al obtener configuración:`,t.message),e||{fase_eliminatoria_estado:`En Curso`,edicion_archivada:!1}}async function l(e){let{data:t,error:r}=await n.from(`cuarteto`).select(`*`).eq(`estado_inscripcion`,`Inscrito`).eq(`auditorio`,e).order(`hora_presentacion`,{ascending:!0});return r||!t?[]:await Promise.all(t.map(async e=>{let{data:t}=await n.from(`evaluacion`).select(`*`).eq(`id_cuarteto`,e.id_cuarteto);return{...e,evaluacion:t||[]}}))}async function u(e){try{let{data:t,error:r}=await n.from(`evaluacion`).select(`id_evaluacion`).eq(`id_cuarteto`,e.id_cuarteto).eq(`etiqueta_jurado`,e.etiqueta_jurado).maybeSingle();r&&console.warn(`Aviso al consultar evaluación previa:`,r.message);let i;if(i=t&&t.id_evaluacion?await n.from(`evaluacion`).update({nombre_jurado:e.nombre_jurado,nota:e.nota,inmutable:e.inmutable,fecha_evaluacion:e.fecha_evaluacion}).eq(`id_evaluacion`,t.id_evaluacion):await n.from(`evaluacion`).insert([e]),i.error)throw i.error;return!0}catch(e){throw console.error(`Error al guardar evaluación en Supabase:`,e.message),e}}var d=e((()=>{r()})),f=t((()=>{o(),d(),r();var e=null,t=null,i=null;document.addEventListener(`DOMContentLoaded`,async()=>{try{e=a(`jurado`)}catch(e){console.warn(`⚠️ Intento de acceso no autorizado detectado en panel de jurado:`,e),window.location.replace(`login.html`);return}if(!e||e.rol!==`jurado`){window.location.replace(`login.html`);return}t=await s(e.email),t&&!i&&(i=t.auditorio||`Auditorio Principal`),i&&i!==`TODOS`||(i=`Auditorio Principal`);let n=document.getElementById(`juradoCredencial`);n&&t&&(n.textContent=`${t.nombres} ${t.apellidos||``} · ${t.auditorio||`Sin Auditorio`}`),await p()});async function f(e,t){if(!e||!t)return null;let r=e.id_usuario||e.id;try{let{data:e}=await n.from(`configuracion_concurso`).select(`ternas_auditorios`).eq(`id`,1).maybeSingle();if(e&&e.ternas_auditorios){let n=(typeof e.ternas_auditorios==`string`?JSON.parse(e.ternas_auditorios):e.ternas_auditorios)[t];if(n){if(n.a===r||n[0]===r)return`A`;if(n.b===r||n[1]===r)return`B`;if(n.c===r||n[2]===r)return`C`}}}catch(e){console.warn(`⚠️ Error al leer la terna desde Supabase:`,e)}try{let e=JSON.parse(localStorage.getItem(`concurso_ternas_auditorio`)||`{}`)[t];if(e){if(e.a===r||e[0]===r)return`A`;if(e.b===r||e[1]===r)return`B`;if(e.c===r||e[2]===r)return`C`}}catch{}return null}async function p(){let e=document.getElementById(`juradoMainContent`);if(!e)return;if(!t){e.innerHTML=`
      <div class="card">
        <div class="alert alert-danger">
          <div><strong>Sin cuenta de jurado vinculada.</strong> Contacte a administración (HU-14).</div>
        </div>
      </div>`;return}i&&i!==`TODOS`||(i=t.auditorio||`Auditorio Principal`);let r=await c(),a=r.edicion_archivada||r.fase_eliminatoria_estado===`Concluida`,o=await l(i),s={};try{let{data:e}=await n.from(`usuario`).select(`id_usuario, nombres, apellidos`);e&&e.forEach(e=>{s[e.id_usuario]=`${e.nombres||``} ${e.apellidos||``}`.trim()})}catch{}let u=JSON.parse(localStorage.getItem(`concurso_ternas_auditorio`)||`{}`);try{let{data:e}=await n.from(`configuracion_concurso`).select(`ternas_auditorios`).eq(`id`,1).maybeSingle();if(e&&e.ternas_auditorios){let t=typeof e.ternas_auditorios==`string`?JSON.parse(e.ternas_auditorios):e.ternas_auditorios;Object.assign(u,t)}}catch{}let d=`${t.nombres||``} ${t.apellidos||``}`.trim()||`Matias Jurado`;e.innerHTML=`
    <div class="card">
      <div class="ficha-header">
        <div>
          <h2>⚖️ Mi Sesión de Evaluación · ${i}</h2>
          <p class="subtitle">HU-16 · RF-39/40 · Orden cronológico de presentación</p>
        </div>
        <span class="badge ${a?`badge-rej`:`badge-ok`}">
          ${a?`🔒 Acta Cerrada (RNF-24)`:`🟢 Sesión Abierta`}
        </span>
      </div>

      <div style="background:#f8fafc; padding:14px 18px; border-radius:10px; border:1px solid var(--border); display:flex; gap:16px; align-items:center; flex-wrap:wrap; margin:16px 0;">
        <div>
          <label style="font-size:12px; font-weight:700; display:block; margin-bottom:4px;">🏛️ Ver Auditorio:</label>
          <select id="juradoFiltroAuditorio" style="padding:8px 12px; border-radius:8px; border:1px solid var(--border);">
            <option value="Auditorio Principal" ${i===`Auditorio Principal`?`selected`:``}>Auditorio Principal</option>
            <option value="Auditorio B — Sala Beethoven" ${i===`Auditorio B — Sala Beethoven`?`selected`:``}>Auditorio B — Sala Beethoven</option>
            <option value="Auditorio C — Sala Mozart" ${i===`Auditorio C — Sala Mozart`?`selected`:``}>Auditorio C — Sala Mozart</option>
          </select>
        </div>
      </div>

      <div id="juradoFeedback" style="margin-top:10px;"></div>

      ${o.length===0?`
        <div class="alert alert-warn" style="margin-top:14px;">
          <div>No hay cuartetos programados en el <b>${i}</b>.</div>
        </div>
      `:``}

      ${(await Promise.all(o.map(async(e,n)=>{let r=e.auditorio||i,o=await f(t,r),c=u[r]||{a:``,b:``,c:``},l=[o===`A`?d:s[c.a||c[0]]||`Jurado A`,o===`B`?d:s[c.b||c[1]]||`Jurado B`,o===`C`?d:s[c.c||c[2]]||`Jurado C`],p=e.evaluacion||[],m=e.estado_presentacion===`Descalificado`,h=(e,t)=>{let n=p.find(t=>t.etiqueta_jurado===e),r=l[t]||`Jurado ${e}`;return n?{jurado:n.nombre_jurado||r,valor:n.nota,inmutable:!!n.inmutable}:{jurado:r,valor:null,inmutable:!1}},g={A:h(`A`,0),B:h(`B`,1),C:h(`C`,2)},_=o?g[o]:{inmutable:!1},v=e.obra_obligatoria||`Sin asignar`,y=e.obra_libre_titulo||`Sin asignar`;return`
          <div class="integrante-card" style="background:#fff; margin-top:14px; border-left:4px solid ${m?`var(--danger)`:_.inmutable?`var(--success)`:`var(--primary)`};">
            <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:10px;">
              <div>
                <h4>#${n+1}° · ${e.nombre_cuarteto} <span class="chip">${e.codigo_cuarteto||`CRT-${e.id_cuarteto}`}</span></h4>
                <div style="font-size:13px; color:var(--muted);">
                  🏛️ <strong>${r}</strong> · 📅 ${e.fecha_presentacion||`2026-11-20`} · ${e.hora_presentacion||`10:00`} · 🎼 ${v} | ${y}
                </div>
              </div>
              <span class="badge ${m?`badge-rej`:_.inmutable?`badge-ok`:`badge-obs`}">
                ${m?`🚫 Descalificado`:_.inmutable?`🔒 Mi nota firmada`:o?`⏳ Pendiente de mi nota`:`👀 Solo lectura (No en terna)`}
              </span>
            </div>

            ${m?`
              <div class="alert alert-danger" style="margin-top:10px; margin-bottom:0;">
                <div>Cuarteto descalificado por administración (${e.motivo_descalificacion||`Inasistencia`}). Casillas anuladas (RF-44).</div>
              </div>
            `:`
              <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:12px; margin-top:12px;">
                ${[`A`,`B`,`C`].map((t,n)=>{let r=g[t],i=t===o;return`
                    <div style="background:#f8fafc; padding:12px; border-radius:8px; border:1px solid ${i?`var(--primary)`:`var(--border)`};">
                      <div style="font-size:12px; font-weight:700;">Jurado ${t} ${i?`(TÚ)`:``} · ${r.jurado}</div>
                      ${r.inmutable?`
                        <div style="font-size:22px; font-weight:800; margin-top:4px;">
                          ${Number(r.valor).toFixed(2)} <small style="font-size:11px; color:var(--muted);">/ 10.00 🔒</small>
                        </div>
                      `:i?`
                        <div style="display:flex; gap:6px; margin-top:8px; align-items:center;">
                          <input type="number" step="0.1" min="0" max="10" id="notaJurado_${e.id_cuarteto}" placeholder="0.0 - 10.0"
                                 style="width:95px; padding:6px 8px; border:1.5px solid var(--primary); border-radius:6px; font-weight:700;" ${a?`disabled`:``}>
                          <button type="button" class="btn btn-primary btn-firmar-nota" data-id="${e.id_cuarteto}" data-letra="${o}" data-nombre="${e.nombre_cuarteto}" style="padding:6px 10px; font-size:12px;" ${a?`disabled`:``}>
                            ✓ Firmar
                          </button>
                        </div>
                      `:`
                        <div style="font-size:13px; color:var(--muted); margin-top:6px;">Pendiente (reservado)</div>
                      `}
                    </div>
                  `}).join(``)}
              </div>
            `}
          </div>
        `}))).join(``)}
    </div>
  `,m()}function m(){let e=document.getElementById(`juradoFiltroAuditorio`);e&&e.addEventListener(`change`,function(){i=this.value,p()}),document.querySelectorAll(`.btn-firmar-nota`).forEach(e=>{e.addEventListener(`click`,async function(){let e=this.dataset.id,n=this.dataset.letra,r=this.dataset.nombre,i=document.getElementById(`notaJurado_${e}`),a=document.getElementById(`juradoFeedback`),o=i?i.value.trim():``,s=parseFloat(o);if(o===``||isNaN(s)||s<0||s>10){a.innerHTML=`<div class="alert alert-danger"><div><strong>[!] Puntaje fuera de escala (RF-41):</strong> El puntaje debe estar entre 0.0 y 10.0.</div></div>`;return}if(!confirm(`¿Confirmar nota ${s.toFixed(2)} como Jurado ${n} para "${r}"? Esta acción es INMUTABLE (RF-42).`))return;let c=Math.round(s*100)/100,l=new Date().toISOString(),d=`${t.nombres} ${t.apellidos||``}`.trim();try{await u({id_cuarteto:e,codigo_cuarteto:e,etiqueta_jurado:n,nombre_jurado:d,nota:c,inmutable:!0,fecha_evaluacion:l}),alert(`🔒 Nota ${c.toFixed(2)} firmada como Jurado ${n} para ${r}. Registro inmutable (RF-42).`),await p()}catch(e){a.innerHTML=`<div class="alert alert-danger"><div>Error al guardar la calificación en Supabase: ${e.message}</div></div>`}})})}}));i(),o(),f();