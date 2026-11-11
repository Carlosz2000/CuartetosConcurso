import { supabase } from '../../config/supabase.js';

/* ============================================================
   HU-01: Registro del Catálogo de Obras Obligatorias
   Tabla: 'obra' (titulo, compositor, duracion_estimada, tipo_obra, estado)
   ============================================================ */
export async function registrarObraObligatoriaBD(titulo, compositor, duracionEstimada) {
  // RF-02: Validar campos obligatorios
  if (!titulo || !titulo.trim() || !compositor || !compositor.trim()) {
    throw new Error('El campo Compositor y Título son obligatorios.');
  }

  // RF-04: Validar que no exista un título duplicado en obras obligatorias
  const { data: existente } = await supabase
    .from('obra')
    .select('id_obra')
    .ilike('titulo', titulo.trim())
    .eq('tipo_obra', 'obligatoria')
    .maybeSingle();

  if (existente) {
    throw new Error('Ya existe una obra obligatoria registrada con este título.');
  }

  // Insertar respetando los tipos de datos de Supabase (duracion_estimada es int4)
  const { data, error } = await supabase
    .from('obra')
    .insert([{
      titulo: titulo.trim(),
      compositor: compositor.trim(),
      duracion_estimada: duracionEstimada ? parseInt(duracionEstimada) : null,
      tipo_obra: 'obligatoria',
      estado: true
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Obtiene todas las obras registradas de tipo 'obligatoria' activas
 */
export async function obtenerObrasObligatoriasBD() {
  const { data, error } = await supabase
    .from('obra')
    .select('*')
    .eq('tipo_obra', 'obligatoria')
    .eq('estado', true)
    .order('titulo', { ascending: true }); // RNF-01: Orden alfabético

  if (error) throw error;
  return data || [];
}

/* ============================================================
   HU-11 y HU-13: Programación y Reprogramación de Citaciones
   Tabla: 'presentacion' (id_inscripcion, id_fase, id_auditorio, fecha_presentacion, hora_inicio, orden_presentacion, estado_presentacion)
   ============================================================ */
export async function programarOActualizarPresentacionBD({
  idInscripcion,
  idFase,
  idAuditorio,
  fechaPresentacion,
  horaInicio,
  ordenPresentacion = 1,
  idPresentacion = null
}) {
  // RF-30 / RF-33: Validar que no existan traslapes de horario en un mismo auditorio
  let query = supabase
    .from('presentacion')
    .select('id_presentacion')
    .eq('id_auditorio', idAuditorio)
    .eq('fecha_presentacion', fechaPresentacion)
    .eq('hora_inicio', horaInicio);

  if (idPresentacion) {
    query = query.neq('id_presentacion', idPresentacion);
  }

  const { data: cruces } = await query;

  if (cruces && cruces.length > 0) {
    throw new Error('Existe un conflicto de horario y auditorio con otro cuarteto.');
  }

  let errorBD;
  if (idPresentacion) {
    // Actualización (Reprogramación HU-13)
    const { error } = await supabase
      .from('presentacion')
      .update({
        id_fase: idFase,
        id_auditorio: idAuditorio,
        fecha_presentacion: fechaPresentacion,
        hora_inicio: horaInicio,
        orden_presentacion: ordenPresentacion
      })
      .eq('id_presentacion', idPresentacion);
    errorBD = error;
  } else {
    // Nueva programación (HU-11)
    const { error } = await supabase
      .from('presentacion')
      .insert([{
        id_inscripcion: idInscripcion,
        id_fase: idFase,
        id_auditorio: idAuditorio,
        fecha_presentacion: fechaPresentacion,
        hora_inicio: horaInicio,
        orden_presentacion: ordenPresentacion,
        estado_presentacion: 'Programado'
      }]);
    errorBD = error;
  }

  if (errorBD) throw errorBD;

  // RF-31 / RF-34: Simulación de notificación automática por correo
  console.log(`[Notificación Automática] Citación registrada/actualizada para la inscripción #${idInscripcion}`);
  return true;
}

/* ============================================================
   HU-15: Asignación Incompatible de Jurados por Auditorio / Presentación
   Tabla: 'presentacion_jurado' (id_cuarteto, id_usuario_juez, id_presentacion, estado_calificacion)
   ============================================================ */
export async function asignarJuradosAPresentacionBD(idPresentacion, idCuarteto, idsJuradosArray) {
  // RF-37: Exigir exactamente 3 jurados
  if (!idsJuradosArray || idsJuradosArray.length !== 3) {
    throw new Error('El sistema exige la asignación de exactamente 3 docentes jurados.');
  }

  // Obtener el id_profesor_responsable del cuarteto a evaluar
  const { data: datosCuarteto } = await supabase
    .from('cuarteto')
    .select('id_profesor_responsable')
    .eq('id_cuarteto', idCuarteto)
    .single();

  const idProfesor = datosCuarteto?.id_profesor_responsable;

  // RF-38: Validar que ningún jurado sea el Profesor Responsable del cuarteto
  for (const idJurado of idsJuradosArray) {
    if (idProfesor && idJurado === idProfesor) {
      throw new Error('El docente presenta incompatibilidad por ser el Profesor Responsable de este cuarteto.');
    }
  }

  // Eliminar asignaciones previas para esa presentación si existen
  await supabase
    .from('presentacion_jurado')
    .delete()
    .eq('id_presentacion', idPresentacion);

  // Registrar las 3 evaluaciones individuales pendientes
  const registros = idsJuradosArray.map(idJuez => ({
    id_presentacion: idPresentacion,
    id_cuarteto: idCuarteto,
    id_usuario_juez: idJuez,
    estado_calificacion: 'Pendiente'
  }));

  const { error } = await supabase
    .from('presentacion_jurado')
    .insert(registros);

  if (error) throw error;
  return true;
}