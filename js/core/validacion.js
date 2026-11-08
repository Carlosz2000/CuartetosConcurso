function renderS3() {
  const bloqueado = s7Estado.edicionArchivada;
  return `
    <div class="card">
      <div class="ficha-header">
        <div>
          <h2>✅ Subsistema 3 · Validación de Expedientes y Filtro por Historial</h2>
          <p class="subtitle">HU-07 · HU-08 · HU-09 · HU-10 · RF-20 a RF-28</p>
        </div>
        <button class="btn btn-primary" id="btnFiltroHistorico" ${bloqueado ? 'disabled' : ''}>
          ⚡ Ejecutar Filtro Automático por Historial (HU-08)
        </button>
      </div>

      <div class="alert alert-info" style="margin-top:12px;">
        <div>
          <strong>🔎 Regla HU-08 · RF-23/24:</strong>
          El sistema cruza los 4 DNI de cada cuarteto validado contra la tabla <code>HISTORIAL_PARTICIPANTE</code>.
          Si <strong>0 integrantes</strong> tienen participación pasada → <strong>Primera Eliminatoria</strong>.
          Si <strong>al menos 1 integrante</strong> registra antecedentes → <strong>Segunda Eliminatoria</strong>.
        </div>
      </div>

      <div style="margin-top:18px;">
        ${s3Cuartetos.map((c, idx) => `
          <div class="integrante-card" style="background:#fff; margin-bottom:16px; border-left:4px solid ${c.estadoFicha === 'Validado' ? 'var(--success)' : (c.estadoFicha === 'Observado' ? 'var(--warn)' : (c.estadoFicha === 'Rechazado' ? 'var(--danger)' : 'var(--primary)'))};">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px;">
              <div>
                <h4 style="margin-bottom:4px; font-size:16px;">🎻 ${c.nombre} <span class="chip">${c.codigo}</span></h4>
                <div style="font-size:13px; color:var(--muted);">
                  👨‍🏫 <strong>Profesor:</strong> ${c.profesor} ·
                  🎼 <strong>Repertorio:</strong> ${c.obraObligatoria} + ${c.obraLibre}
                </div>
              </div>
              <div style="display:flex; gap:8px; align-items:center;">
                <span class="badge ${c.estadoFicha === 'Validado' ? 'badge-ok' : (c.estadoFicha === 'Observado' ? 'badge-obs' : (c.estadoFicha === 'Rechazado' ? 'badge-rej' : 'badge-draft'))}">
                  ${c.estadoFicha}
                </span>
                <span class="table-badge-auditorio">🎯 ${c.faseAsignada}</span>
              </div>
            </div>

            <div style="margin-top:10px; font-size:12px; background:#f8fafc; padding:10px 12px; border-radius:8px; border:1px solid var(--border);">
              <strong>Plantilla de 4 Integrantes:</strong>
              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(210px, 1fr)); gap:8px; margin-top:6px;">
                ${c.integrantes.map(it => {
                  const tieneAnt = s3HistorialDni.some(h => h.dni === it.dni);
                  return `<div>• <strong>${it.instrumento}:</strong> ${it.nombre} · DNI: <code>${it.dni}</code> ${tieneAnt ? '<span class="badge badge-obs" style="font-size:10px;">Antecedente</span>' : ''}</div>`;
                }).join('')}
              </div>
              <div style="margin-top:6px; color:var(--primary); font-weight:600;">📋 Historial: ${c.antecedentesDetectados}</div>
              ${c.motivoObservacion ? `<div style="margin-top:6px; color:var(--danger); font-weight:600;">⚠️ Motivo: ${c.motivoObservacion}</div>` : ''}
            </div>

            <div style="margin-top:12px; display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
              <input type="text" id="motivoVal_${idx}" placeholder="Motivo obligatorio para Observar/Rechazar..." style="flex:1; min-width:260px; padding:8px 12px; border:1px solid var(--border); border-radius:8px; font-size:13px;" value="${c.motivoObservacion || ''}" ${bloqueado ? 'disabled' : ''}>
              <button type="button" class="btn btn-success btn-val-accion" data-idx="${idx}" data-est="Validado" ${bloqueado ? 'disabled' : ''}>✓ Validar</button>
              <button type="button" class="btn btn-secondary btn-val-accion" data-idx="${idx}" data-est="Observado" style="background:var(--warn-soft); color:#78350f;" ${bloqueado ? 'disabled' : ''}>⚠️ Observar</button>
              <button type="button" class="btn btn-danger btn-val-accion" data-idx="${idx}" data-est="Rechazado" ${bloqueado ? 'disabled' : ''}>✕ Rechazar</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function bindS3() {
  const btnFiltro = document.getElementById('btnFiltroHistorico');
  if (btnFiltro) {
    btnFiltro.addEventListener('click', () => {
      s3Cuartetos.forEach(c => {
        if (c.estadoFicha === 'Validado') {
          const matches = c.integrantes.filter(it => s3HistorialDni.some(h => h.dni === it.dni));
          if (matches.length > 0) {
            c.faseAsignada = 'Segunda Eliminatoria';
            c.antecedentesDetectados = `Clasificado directo a 2ª: DNI ${matches.map(m => m.dni).join(', ')} con antecedentes (RF-24)`;
          } else {
            c.faseAsignada = 'Primera Eliminatoria';
            c.antecedentesDetectados = 'Clasificado en 1ª: 0 integrantes con antecedentes (RF-24)';
          }
        }
      });
      guardarTodoSubsistemas();
      showToast('⚡ Filtro histórico ejecutado: cuartetos clasificados en 1ª o 2ª Eliminatoria.', 'ok');
      renderAdminTab();
    });
  }

  document.querySelectorAll('.btn-val-accion').forEach(btn => {
    btn.addEventListener('click', function () {
      const idx = +this.dataset.idx;
      const nuevoEstado = this.dataset.est;
      const c = s3Cuartetos[idx];
      const motivoInput = document.getElementById(`motivoVal_${idx}`);
      const motivo = motivoInput ? motivoInput.value.trim() : '';

      if ((nuevoEstado === 'Observado' || nuevoEstado === 'Rechazado') && !motivo) {
        showToast('⚠️ CA3 / RF-22: Motivo obligatorio para Observar o Rechazar.', 'error');
        if (motivoInput) motivoInput.focus();
        return;
      }

      c.estadoFicha = nuevoEstado;
      c.motivoObservacion = nuevoEstado === 'Validado' ? '' : motivo;
      guardarTodoSubsistemas();

      // Sincronizar con ficha del representante si coincide
      try {
        const fRaw = localStorage.getItem('concurso_cuartetos_ficha');
        if (fRaw) {
          const f = JSON.parse(fRaw);
          if (f.codigo === c.codigo || idx === 0) {
            f.estado = nuevoEstado.toLowerCase();
            f.motivo = c.motivoObservacion;
            localStorage.setItem('concurso_cuartetos_ficha', JSON.stringify(f));
          }
        }
      } catch (e) {}

      registrarCorreoSimulado(
        c.correoRepresentante,
        `Actualización de Expediente ${c.codigo}: ${nuevoEstado}`,
        nuevoEstado === 'Validado'
          ? `Tu cuarteto ${c.nombre} ha sido VALIDADO oficialmente.`
          : `Estado: ${nuevoEstado}. Motivo: ${motivo}`,
        'RF-22'
      );

      showToast(`✅ Expediente "${c.nombre}" → "${nuevoEstado}" (HU-07).`, 'ok');
      renderAdminTab();
    });
  });
}