// js/services/juradoService.js
import { supabase } from '../../config/supabase.js';

/**
 * Obtiene los datos del jurado autenticado por su correo.
 */
export async function obtenerDatosJuradoBD(correo) {
  const { data: usuario, error } = await supabase
    .from('usuario')
    .select('*')
    .ilike('correo_institucional', correo)
    .maybeSingle();

  if (error || !usuario) return null;

  return {
    ...usuario,
    auditorio: usuario.auditorio || 'Auditorio Principal',
    etiqueta: usuario.etiqueta_jurado || usuario.etiqueta || 'C' // 'A', 'B' o 'C'
  };
}

/**
 * Obtiene el estado general del concurso (edición 2026).
 */
export async function obtenerEstadoConcursoBD() {
  const { data, error } = await supabase
    .from('configuracion_concurso')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn('Aviso al obtener configuración:', error.message);
  }

  return data || {
    fase_eliminatoria_estado: 'En Curso',
    edicion_archivada: false
  };
}

/**
 * Obtiene los cuartetos inscritos del auditorio asignado al jurado, 
 * incluyendo sus evaluaciones registradas en la tabla 'evaluacion'.
 */
export async function obtenerCuartetosPorAuditorioBD(auditorioJurado) {
  // 1. Obtener los cuartetos del auditorio
  const { data: cuartetos, error: errCuartetos } = await supabase
    .from('cuarteto')
    .select('*')
    .eq('estado_inscripcion', 'Inscrito')
    .eq('auditorio', auditorioJurado)
    .order('hora_presentacion', { ascending: true });

  if (errCuartetos || !cuartetos) return [];

  // 2. Para cada cuarteto, obtener sus evaluaciones de la tabla 'evaluacion'
  const cuartetosConEvaluaciones = await Promise.all(cuartetos.map(async (c) => {
    const { data: evs } = await supabase
      .from('evaluacion')
      .select('*')
      .eq('id_cuarteto', c.id_cuarteto);

    return {
      ...c,
      evaluacion: evs || []
    };
  }));

  return cuartetosConEvaluaciones;
}

/**
 * Guarda o actualiza la nota inmutable del jurado en la tabla 'evaluacion' 
 * verificando previamente la existencia del registro para evitar conflictos de índices en Supabase.
 */
export async function guardarEvaluacionJuradoBD(evaluacionData) {
  try {
    // 1. Verificar si ya existe un registro previo para este cuarteto y etiqueta de jurado
    const { data: existente, error: errSelect } = await supabase
      .from('evaluacion')
      .select('id_evaluacion')
      .eq('id_cuarteto', evaluacionData.id_cuarteto)
      .eq('etiqueta_jurado', evaluacionData.etiqueta_jurado)
      .maybeSingle();

    if (errSelect) {
      console.warn('Aviso al consultar evaluación previa:', errSelect.message);
    }

    let resultado;
    if (existente && existente.id_evaluacion) {
      // 2. Si ya existe, actualizamos
      resultado = await supabase
        .from('evaluacion')
        .update({
          nombre_jurado: evaluacionData.nombre_jurado,
          nota: evaluacionData.nota,
          inmutable: evaluacionData.inmutable,
          fecha_evaluacion: evaluacionData.fecha_evaluacion
        })
        .eq('id_evaluacion', existente.id_evaluacion);
    } else {
      // 3. Si no existe, insertamos nuevo registro
      resultado = await supabase
        .from('evaluacion')
        .insert([evaluacionData]);
    }

    if (resultado.error) {
      throw resultado.error;
    }
    return true;
  } catch (error) {
    console.error('Error al guardar evaluación en Supabase:', error.message);
    throw error;
  }
}