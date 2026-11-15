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
 * Guarda o actualiza la nota inmutable del jurado en la tabla 'evaluacion'.
 */
export async function guardarEvaluacionJuradoBD(evaluacionData) {
  const { error } = await supabase
    .from('evaluacion')
    .upsert([evaluacionData], { onConflict: 'id_cuarteto,etiqueta_jurado' });

  if (error) throw error;
  return true;
}