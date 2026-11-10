
import { supabase } from '../../config/supabase.js';

export async function obtenerPerfilUsuario(authUserId) {

    // Buscar el perfil del usuario autenticado
    const { data: usuario, error: errorUsuario } = await supabase
        .from('usuario')
        .select('id_usuario, nombres, correo_institucional, id_rol, estado')
        .eq('auth_user_id', authUserId)
        .single();

    if (errorUsuario) {
        throw new Error('No se encontró el perfil del usuario: ' + errorUsuario.message);
    }

    // Comprobar si el usuario está activo
    if (!usuario.estado) {
        throw new Error('Tu cuenta se encuentra deshabilitada.');
    }

    // Consultar el nombre del rol
    const { data: rol, error: errorRol } = await supabase
        .from('rol')
        .select('nombre_rol')
        .eq('id_rol', usuario.id_rol)
        .single();

    if (errorRol) {
        throw new Error('No se pudo obtener el rol: ' + errorRol.message);
    }

    return {
        id: usuario.id_usuario,
        nombre: usuario.nombres,
        email: usuario.correo_institucional,
        rol: rol.nombre_rol.toLowerCase()
    };
}
