// js/services/repertorioService.js
import { supabase } from '../../config/supabase.js';

//Obtiene del catálogo las obras marcadas como obligatorias y activas en Supabase
export async function obtenerObrasObligatoriasBD() {
  try {
    const { data, error } = await supabase
      .from('obra')
      .select('*')
      .eq('tipo_obra', 'obligatoria')
      .eq('estado', true);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error al obtener obras obligatorias:', err);
    return [];
  }
}

/**
 * Guarda el registro completo de la inscripción en Supabase
 */
export async function guardarInscripcionCompletaBD(datosFicha) {
  try {
    let idCuarteto = datosFicha.id;

    // 🛡️ EDICIÓN SEGURA CON TRAZABILIDAD COMPLETA
    if (idCuarteto) {
      // 1. Actualizar datos principales del cuarteto
      const { error: errUpdateCuarteto } = await supabase
        .from('cuarteto')
        .update({
          nombre_cuarteto: datosFicha.nombre,
          obra_obligatoria: datosFicha.repertorio.obligatoria.titulo,
          obra_libre_titulo: datosFicha.repertorio.libre.titulo,
          obra_libre_duracion: datosFicha.repertorio.libre.duracionTexto,
          id_profesor_responsable: datosFicha.profesor?.id_usuario || null
        })
        .eq('id_cuarteto', idCuarteto);

      if (errUpdateCuarteto) throw errUpdateCuarteto;

      // 2. Actualizar o insertar integrantes (manteniendo sus IDs y relaciones intactas)
      const { data: integrantesActuales, error: errFetchInt } = await supabase
        .from('integrante')
        .select('id_integrante')
        .eq('id_cuarteto', idCuarteto)
        .order('id_integrante', { ascending: true });

      if (errFetchInt) throw errFetchInt;

      for (let i = 0; i < datosFicha.integrantes.length; i++) {
        const it = datosFicha.integrantes[i];
        if (integrantesActuales && integrantesActuales[i]) {
          await supabase
            .from('integrante')
            .update({
              dni: it.dni,
              nombre_completo: it.nombre,
              correo_institucional: it.correo,
              edad: parseInt(it.edad) || null,
              instrumento: it.instrumento
            })
            .eq('id_integrante', integrantesActuales[i].id_integrante);
        } else {
          await supabase
            .from('integrante')
            .insert([{
              id_cuarteto: idCuarteto,
              dni: it.dni,
              nombre_completo: it.nombre,
              correo_institucional: it.correo,
              edad: parseInt(it.edad) || null,
              instrumento: it.instrumento
            }]);
        }
      }

      // 3. Trazabilidad: Actualizar la obra libre vinculada en la tabla 'obra' y 'inscripcion_cuarteto'
      const { data: inscripcionActual } = await supabase
        .from('inscripcion_cuarteto')
        .select('id_inscripcion, id_obra_libre')
        .eq('id_cuarteto', idCuarteto)
        .single();

      if (inscripcionActual) {
        // Actualizar los datos de la obra libre existente usando id_obra_libre
        if (inscripcionActual.id_obra_libre) { // <--- Cambiar id_obra por id_obra_libre
          await supabase
            .from('obra')
            .update({
              titulo: datosFicha.repertorio.libre.titulo,
              compositor: datosFicha.repertorio.libre.compositor,
              duracion_estimada: datosFicha.repertorio.libre.duracionSegundos
            })
            .eq('id_obra', inscripcionActual.id_obra_libre); // <--- Cambiar id_obra por id_obra_libre aquí también
        }

        // Actualizar también la inscripción del cuarteto (por si cambió la obra obligatoria o estado)
        await supabase
          .from('inscripcion_cuarteto')
          .update({
            id_obra_obligatoria: datosFicha.repertorio.obligatoria.id_obra || null // <--- Corregido aquí
          })
          .eq('id_inscripcion', inscripcionActual.id_inscripcion);
      }

      return { success: true, idCuarteto, codigo: datosFicha.codigo };
    }
    // --- AQUÍ ABAJO CONTINÚA TU CÓDIGO ORIGINAL PARA NUEVAS INSCRIPCIONES ---

    // (Todo lo de insertar obra libre, cuarteto nuevo, etc.)
    // 1. Insertar la obra libre en la tabla 'obra'
    const { data: obraLibreData, error: errObra } = await supabase
      .from('obra')
      .insert([
        {
          titulo: datosFicha.repertorio.libre.titulo,
          compositor: datosFicha.repertorio.libre.compositor,
          duracion_estimada: datosFicha.repertorio.libre.duracionSegundos,
          tipo_obra: 'libre',
          estado: true
        }
      ])
      .select('id_obra')
      .single();

    if (errObra) throw errObra;
    const idObraLibre = obraLibreData.id_obra;

    // 2. Insertar el cuarteto en la tabla 'cuarteto'
    const { data: cuartetoData, error: errCuarteto } = await supabase
      .from('cuarteto')
      .insert([
        {
          codigo_cuarteto: datosFicha.codigo,
          nombre_cuarteto: datosFicha.nombre,
          obra_obligatoria: datosFicha.repertorio.obligatoria.titulo,
          obra_libre_titulo: datosFicha.repertorio.libre.titulo,
          obra_libre_duracion: datosFicha.repertorio.libre.duracionTexto,
          id_profesor_responsable: datosFicha.profesor?.id_usuario || null,
          estado_inscripcion: 'En Borrador'
        }
      ])
      .select('id_cuarteto')
      .single();

    if (errCuarteto) throw errCuarteto;
    idCuarteto = cuartetoData.id_cuarteto;

    // 3. Insertar los 4 integrantes en la tabla 'integrante'
    const integrantesAInsertar = datosFicha.integrantes.map(it => ({
      id_cuarteto: idCuarteto,
      dni: it.dni,
      nombre_completo: it.nombre,
      correo_institucional: it.correo,
      edad: parseInt(it.edad),
      instrumento: it.instrumento,
      estado: 'activo'
    }));

    const { data: integrantesData, error: errIntegrantes } = await supabase
      .from('integrante')
      .insert(integrantesAInsertar)
      .select('*');

    if (errIntegrantes) throw errIntegrantes;

    // 4. Registrar la vinculación principal en 'inscripcion_cuarteto' (Concurso 2026 id_edicion = 1)
    const { data: inscripcionData, error: errInscripcion } = await supabase
      .from('inscripcion_cuarteto')
      .insert([
        {
          id_cuarteto: idCuarteto,
          id_edicion: 1,
          id_obra_obligatoria: datosFicha.repertorio.obligatoria.id_obra,
          id_obra_libre: idObraLibre,
          estado_inscripcion: 'pendiente'
        }
      ])
      .select('id_inscripcion')
      .single();

    if (errInscripcion) throw errInscripcion;
    const idInscripcion = inscripcionData.id_inscripcion;

    // 5. Vincular cada integrante en 'inscripcion_integrante'
    if (integrantesData && integrantesData.length > 0) {
      const inscripcionesIntegrantes = integrantesData.map(it => ({
        id_inscripcion: idInscripcion,
        id_integrante: it.id_integrante,
        instrumento: it.instrumento
      }));

      await supabase.from('inscripcion_integrante').insert(inscripcionesIntegrantes);
    }

    return { success: true, idCuarteto, codigo: datosFicha.codigo };
  } catch (err) {
    console.error('Error guardando inscripción completa en Supabase:', err);
    return { success: false, message: err.message };
  }
}