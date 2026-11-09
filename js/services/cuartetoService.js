// js/services/cuartetoService.js
import { supabase } from '../../config/supabase.js';

/**
 * Obtiene el último cuarteto registrado y sus integrantes desde Supabase
 */
export async function obtenerUltimoCuartetoConDetalles() {
  try {
    // 1. Obtener el último cuarteto creado
    const { data: cuartetos, error: errCuarteto } = await supabase
      .from('cuarteto')
      .select('*')
      .order('id_cuarteto', { ascending: false })
      .limit(1);

    if (errCuarteto || !cuartetos || cuartetos.length === 0) {
      throw new Error('No se encontró ningún cuarteto registrado en la base de datos.');
    }

    const cuarteto = cuartetos[0];

    // 2. Obtener los integrantes asociados a este cuarteto
    const { data: integrantes, error: errIntegrantes } = await supabase
      .from('integrante')
      .select('*')
      .eq('id_cuarteto', cuarteto.id_cuarteto);

    if (errIntegrantes) {
      console.warn('No se encontraron integrantes para este cuarteto:', errIntegrantes);
    }

    // 3. Obtener datos del profesor responsable si existe
    let profesor = null;
    if (cuarteto.id_profesor_responsable) {
      const { data: profData } = await supabase
        .from('usuario')
        .select('*')
        .eq('id_usuario', cuarteto.id_profesor_responsable)
        .single();
      profesor = profData;
    }

    return {
      success: true,
      cuarteto: {
        id: cuarteto.id_cuarteto,
        codigo: cuarteto.codigo_cuarteto,
        nombre: cuarteto.nombre_cuarteto,
        estado: cuarteto.estado_inscripcion || 'En Borrador',
        repertorio: {
          obligatoria: { titulo: cuarteto.obra_obligatoria },
          libre: { titulo: cuarteto.obra_libre_titulo, duracion: cuarteto.obra_libre_duracion }
        },
        integrantes: integrantes || [],
        profesor: profesor
      }
    };
  } catch (error) {
    console.error('Error en cuartetoService:', error);
    return { success: false, message: error.message };
  }
}