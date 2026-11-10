
import { supabase } from '../config/supabase.js';
import { obtenerPerfilUsuario } from './services/usuarioService.js';

// Elementos del HTML
const tabLogin = document.getElementById('tabLogin');
const tabRegister = document.getElementById('tabRegister');

const formLogin = document.getElementById('formLogin');
const formRegister = document.getElementById('formRegister');

const loginError = document.getElementById('loginError');
const registerError = document.getElementById('registerError');

// Mostrar errores
function showError(element, message) {
    element.textContent = message;
    element.classList.add('is-visible');
}

function clearError(element) {
    element.textContent = '';
    element.classList.remove('is-visible');
}

// Cambiar entre formularios
tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('is-active');
    tabRegister.classList.remove('is-active');

    formLogin.classList.remove('hidden');
    formRegister.classList.add('hidden');

    clearError(loginError);
    clearError(registerError);
});

tabRegister.addEventListener('click', () => {
    tabRegister.classList.add('is-active');
    tabLogin.classList.remove('is-active');

    formRegister.classList.remove('hidden');
    formLogin.classList.add('hidden');

    clearError(loginError);
    clearError(registerError);
});

// Mostrar u ocultar contraseña
document.querySelectorAll('.toggle-pass').forEach(btn => {
    btn.addEventListener('click', () => {
        const input = document.getElementById(btn.dataset.target);

        input.type = input.type === 'password' ? 'text' : 'password';
    });
});

// Destinos según el rol
const destinos = {
    alumno: 'index.html',
    profesor: 'profesor.html',
    administrador: 'admin.html',
    jurado: 'jurado.html'
};

// Obtener perfil y redireccionar
async function redirigirSegunRol(authUserId) {

    const perfil = await obtenerPerfilUsuario(authUserId);

    const destino = destinos[perfil.rol];

    if (!destino) {
        throw new Error('No existe una página configurada para tu rol.');
    }

    // Guardar información básica para la interfaz
    sessionStorage.setItem('competia_session', JSON.stringify({
        id: perfil.id,
        nombre: perfil.nombre,
        email: perfil.email,
        rol: perfil.rol
    }));

    // Redireccionar
    window.location.href = destino;
}

// INICIAR SESIÓN CON SUPABASE
formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError(loginError);

    const email = document.getElementById('loginEmail')
        .value.trim().toLowerCase();

    const password = document.getElementById('loginPassword').value;

    const boton = formLogin.querySelector('button[type="submit"]');
    boton.disabled = true;
    boton.textContent = 'Ingresando...';

    try {
        // 1. Autenticar al usuario
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            throw error;
        }

        // 2. Obtener el perfil y redireccionar
        await redirigirSegunRol(data.user.id);

    } catch (error) {
        console.error('Error al iniciar sesión:', error);

        // Si falla la consulta del perfil, cerrar la sesión iniciada
        await supabase.auth.signOut();

        showError(
            loginError,
            error.message || 'No se pudo iniciar sesión.'
        );

        boton.disabled = false;
        boton.textContent = 'Ingresar';
    }
});

// REGISTRAR USUARIO CON SUPABASE
formRegister.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError(registerError);

    const nombre = document.getElementById('regNombre')
        .value.trim();

    const email = document.getElementById('regEmail')
        .value.trim().toLowerCase();

    const password = document.getElementById('regPassword').value;

    const boton = formRegister.querySelector('button[type="submit"]');
    boton.disabled = true;
    boton.textContent = 'Registrando...';

    try {
        // 1. Crear cuenta en Supabase Auth
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    nombre: nombre
                }
            }
        });

        if (error) {
            throw error;
        }

        // 2. Si Supabase devuelve una sesión, obtener el perfil
        if (data.session && data.user) {
            await redirigirSegunRol(data.user.id);
        } else {
            showError(
                registerError,
                'Cuenta creada. Revisa tu correo para confirmar el registro y luego inicia sesión.'
            );

            boton.disabled = false;
            boton.textContent = 'Registrarse';
        }

    } catch (error) {
        console.error('Error al registrar usuario:', error);

        showError(
            registerError,
            error.message || 'No se pudo registrar la cuenta.'
        );

        boton.disabled = false;
        boton.textContent = 'Registrarse';
    }
});
