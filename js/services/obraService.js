// js/services/obraService.js
import { supabase } from '../../config/supabase.js';

/**
 * Convierte un string "mm:ss" o "m:ss" a segundos enteros (int4)
 */
function mmSsASegundos(tiempoStr) {
  if (!tiempoStr) return 0;
  const partes = tiempoStr.toString().split(':');
  if (partes.length === 2) {
    const min = parseInt(partes[0], 10) || 0;
    const seg = parseInt(partes[1], 10) || 0;
    return (min * 60) + seg;
  }
  return parseInt(tiempoStr, 10) || 0;
}

/**
 * Convierte segundos (int4) a string formato "mm:ss"
 */
export function segundosAMmSs(segundos) {
  if (!segundos || isNaN(segundos)) return '0:00';
  const min = Math.floor(segundos / 60);
  const seg = segundos % 60;
  return `${min}:${seg < 10 ? '0' : ''}${seg}`;
}

/**
 * Obtiene SOLO las obras obligatorias ACTIVAS (Para el formulario de inscripción de representantes)
 */
export async function obtenerObrasObligatoriasBD() {
  try {
    const { data, error } = await supabase
      .from('obra')
      .select('*')
      .eq('tipo_obra', 'obligatoria')
      .eq('estado', true) // Solo activas para los estudiantes/representantes
      .order('titulo', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error al consultar catálogo de obras obligatorias activas:', err.message);
    return [];
  }
}

/**
 * Obtiene TODAS las obras obligatorias (ACTIVAS E INACTIVAS) - Exclusivo para el Panel Admin
 */
export async function obtenerTodasLasObrasObligatoriasBD() {
  try {
    const { data, error } = await supabase
      .from('obra')
      .select('*')
      .eq('tipo_obra', 'obligatoria')
      .order('titulo', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error al consultar todas las obras obligatorias:', err.message);
    return [];
  }
}

/**
 * Registra una nueva obra obligatoria validando campos requeridos y duplicados (RF-01, RF-02, RF-04)
 */
export async function registrarObraObligatoriaBD(titulo, compositor, duracionInput) {
  const tituloClean = titulo ? titulo.trim() : '';
  const compositorClean = compositor ? compositor.trim() : '';

  if (!tituloClean) throw new Error('El campo Título es obligatorio.');
  if (!compositorClean) throw new Error('El campo Compositor es obligatorio.');

  const { data: existente } = await supabase
    .from('obra')
    .select('id_obra')
    .ilike('titulo', tituloClean)
    .maybeSingle();

  if (existente) {
    throw new Error(`La obra "${tituloClean}" ya se encuentra registrada en el catálogo.`);
  }

  const duracionSegundos = mmSsASegundos(duracionInput);

  const { data, error } = await supabase
    .from('obra')
    .insert([{
      titulo: tituloClean,
      compositor: compositorClean,
      duracion_estimada: duracionSegundos,
      tipo_obra: 'obligatoria',
      estado: true // Por defecto activa al registrarse
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Cambia el estado (true/false) de una obra obligatoria (Activar / Desactivar)
 */
export async function cambiarEstadoObraBD(idObra, nuevoEstadoBool) {
  const { data, error } = await supabase
    .from('obra')
    .update({ estado: nuevoEstadoBool })
    .eq('id_obra', idObra)
    .select()
    .single();

  if (error) throw error;
  return data;
}