import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validación en consola para confirmar si están cargando las variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ ERROR DE SUPABASE: Las variables de entorno no se leyeron correctamente. Revisa el archivo .env');
} else {
  console.log('✅ Credenciales de Supabase cargadas correctamente');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)