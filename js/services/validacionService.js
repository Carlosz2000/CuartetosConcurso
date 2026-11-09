// js/services/validacionService.js
import { supabase } from '../../config/supabase.js';

export async function validarNombreCuartetoUnico(nombre) {
  try {
    const { data, error } = await supabase
      .from('cuarteto')
      .select('id_cuarteto')
      .ilike('nombre_cuarteto', nombre.trim());

    if (error) throw error;
    return data.length === 0;
  } catch (err) {
    console.error('Error al validar nombre único:', err);
    return false;
  }
}

export async function validarDniIntegranteUnico(dni, idCuartetoActual = null) {
  try {
    // Si no enviaron el ID, lo obtenemos directamente de la URL (edit_id)
    if (!idCuartetoActual) {
      const urlParams = new URLSearchParams(window.location.search);
      idCuartetoActual = urlParams.get('edit_id') || null;
    }

    const idLimpio = idCuartetoActual ? String(idCuartetoActual).trim() : '';
    const esModoEdicion = idLimpio !== '' && idLimpio !== 'null' && idLimpio !== 'undefined';

    const { data, error } = await supabase
      .from('integrante')
      .select('id_integrante, id_cuarteto')
      .eq('dni', dni.trim());

    if (error) throw error;
    if (!data || data.length === 0) return false; // DNI libre

    if (esModoEdicion) {
      // Si edita, solo retorna true si pertenece a OTRO cuarteto
      return data.some(it => String(it.id_cuarteto) !== idLimpio);
    }

    // Registro nuevo: DNI duplicado encontrado -> bloquear
    return true;
  } catch (err) {
    console.error('Error al validar DNI único:', err);
    return false;
  }
}

export async function validarCorreoIntegranteUnico(correo, idCuartetoActual = null) {
  try {
    if (!idCuartetoActual) {
      const urlParams = new URLSearchParams(window.location.search);
      idCuartetoActual = urlParams.get('edit_id') || null;
    }

    const idLimpio = idCuartetoActual ? String(idCuartetoActual).trim() : '';
    const esModoEdicion = idLimpio !== '' && idLimpio !== 'null' && idLimpio !== 'undefined';

    const { data, error } = await supabase
      .from('integrante')
      .select('id_integrante, id_cuarteto')
      .ilike('correo_institucional', correo.trim());

    if (error) throw error;
    if (!data || data.length === 0) return false; // Correo libre

    if (esModoEdicion) {
      // Si edita, solo retorna true si pertenece a OTRO cuarteto
      return data.some(it => String(it.id_cuarteto) !== idLimpio);
    }

    // Registro nuevo: Correo duplicado encontrado -> bloquear
    return true;
  } catch (err) {
    console.error('Error al validar correo único:', err);
    return false;
  }
}