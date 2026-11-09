// js/services/profesorService.js
import { supabase } from '../../config/supabase.js';

//Consulta en Supabase todos los usuarios con rol de Profesor o Jurado que estén activos (estado = true)
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
}