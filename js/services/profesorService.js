// js/services/profesorService.js
import { supabase } from '../../config/supabase.js';

/**
 * Consulta en Supabase los cuartetos asignados al profesor responsable en sesión.
 * @param {string} idProfesor - UUID del profesor (id_profesor_responsable)
 */
export async function obtenerCuartetosPorProfesorBD(idProfesor) {
  try {
    const { data, error } = await supabase
      .from('cuarteto')
      .select('*')
      .eq('id_profesor_responsable', idProfesor);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error al obtener cuartetos del profesor desde Supabase:', err);
    return [];
  }
}

/**
 * Actualiza el campo estado_inscripcion en la tabla 'cuarteto'.
 * @param {number|string} idCuarteto - ID único del cuarteto (id_cuarteto)
 * @param {'Inscrito' | 'Rechazado' | 'Observado'} nuevoEstado - Estado a asignar
 */
export async function cambiarEstadoInscripcionBD(idCuarteto, nuevoEstado) {
  try {
    const { data, error } = await supabase
      .from('cuarteto')
      .update({ estado_inscripcion: nuevoEstado })
      .eq('id_cuarteto', idCuarteto)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error al actualizar el estado del cuarteto en Supabase:', err);
    throw err;
  }
}

/**
 * Consulta en Supabase todos los usuarios con rol de Profesor o Jurado activos (estado = true)
 */
/*export async function obtenerDocentesHabilitadosBD() {
  try {
    const { data: usuarios, error } = await supabase
      .from('usuario')
      .select(`
        id_usuario,
        dni,
        nombres,
        apellidos,
        correo_institucional,
        estado,
        id_rol,
        rol (
          id_rol,
          nombre_rol
        )
      `)
      .eq('estado', true);

    if (error) throw error;

    return (usuarios || []).map(u => {
      const nombreRol = u.rol?.nombre_rol ? u.rol.nombre_rol.toLowerCase() : '';
      const esJurado = nombreRol.includes('juez') || nombreRol.includes('jurado');

      return {
        id: u.id_usuario,
        nombre: `${u.nombres} ${u.apellidos}`,
        dni: u.dni,
        correo: u.correo_institucional,
        rolNombre: u.rol?.nombre_rol || 'Docente',
        esJurado: esJurado
      };
    });
  } catch (err) {
    console.error('Error al obtener docentes desde Supabase:', err);
    return [];
  }
}*/
/**
* Consulta en Supabase todos los usuarios con rol de Profesor o Jurado activos (estado = true)
*/
export async function obtenerDocentesHabilitadosBD() {
  try {
    const { data: usuarios, error } = await supabase
      .from('usuario')
      .select(`
        id_usuario,
        dni,
        nombres,
        apellidos,
        correo_institucional,
        estado,
        id_rol,
        rol (
          id_rol,
          nombre_rol
        )
      `)
      .eq('estado', true)
      // 1. CANDADO DE SEGURIDAD: Solo traer filas que tengan id_rol 2 (profesor) o 7 (jurado)
      .in('id_rol', [2, 7]);

    if (error) throw error;

    return (usuarios || []).map(u => {
      const nombreRol = u.rol?.nombre_rol ? u.rol.nombre_rol.toLowerCase() : '';
      const esJurado = nombreRol.includes('juez') || nombreRol.includes('jurado');

      // 2. LIMPIEZA DE STRINGS "NULL"
      const nombreLimpio = (u.nombres && u.nombres !== 'null') ? u.nombres : '';
      const apellidoLimpio = (u.apellidos && u.apellidos !== 'null') ? u.apellidos : '';

      return {
        id: u.id_usuario,
        nombre: `${nombreLimpio} ${apellidoLimpio}`.trim() || 'Docente Habilitado',
        dni: u.dni,
        correo: u.correo_institucional,
        rolNombre: u.rol?.nombre_rol || 'Docente',
        esJurado: esJurado
      };
    });
  } catch (err) {
    console.error('Error al obtener docentes desde Supabase:', err);
    return [];
  }
}
