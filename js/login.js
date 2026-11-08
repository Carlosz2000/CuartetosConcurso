/* ============================================================
   LOGIN · COMPETIA — 4 Roles del Sistema (RNF-07)
   HU-14 · CA3: Rol Jurado → acceso exclusivo a calificación
   ============================================================ */

// ✅ Los 4 usuarios demo
const DEMO_USERS = {
    'harmonia.rep@cons.pe': {
        nombre: 'Lucía Fernández',
        rol: 'alumno',
        destino: 'representante.html',
        password: 'demo2026'
    },
    'bmorales@cons.pe': {
        nombre: 'Dra. Beatriz Morales',
        rol: 'profesor',
        destino: 'profesor.html',
        password: 'demo2026'
    },
    'admin@conservatorio.edu.pe': {
        nombre: 'Admin. Rosa Mendelvil',
        rol: 'administrador',
        destino: 'admin.html',
        password: 'demo2026'
    },
    'evaldivia@conservatorio.edu.pe': {
        nombre: 'Mtro. Eduardo Valdivia',
        rol: 'jurado',
        destino: 'jurado.html',
        password: 'demo2026'
    }
};

const tabLogin = document.getElementById('tabLogin');
const tabRegister = document.getElementById('tabRegister');
const formLogin = document.getElementById('formLogin');
const formRegister = document.getElementById('formRegister');
const demoBlock = document.getElementById('demoBlock');
const loginError = document.getElementById('loginError');
const registerError = document.getElementById('registerError');

function showError(el, message) {
    el.textContent = message;
    el.classList.add('is-visible');
}

function clearError(el) {
    el.textContent = '';
    el.classList.remove('is-visible');
}

function enterSession(user) {
    sessionStorage.setItem('competia_session', JSON.stringify({
        email: user.email,
        nombre: user.nombre,
        rol: user.rol
    }));
    window.location.href = user.destino;
}

tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('is-active');
    tabRegister.classList.remove('is-active');
    formLogin.classList.remove('hidden');
    formRegister.classList.add('hidden');
    demoBlock.classList.remove('hidden');
});

tabRegister.addEventListener('click', () => {
    tabRegister.classList.add('is-active');
    tabLogin.classList.remove('is-active');
    formRegister.classList.remove('hidden');
    formLogin.classList.add('hidden');
    demoBlock.classList.add('hidden');
});

document.querySelectorAll('.toggle-pass').forEach(btn => {
    btn.addEventListener('click', () => {
        const input = document.getElementById(btn.dataset.target);
        input.type = input.type === 'password' ? 'text' : 'password';
    });
});

formLogin.addEventListener('submit', (e) => {
    e.preventDefault();
    clearError(loginError);
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;

    const demo = DEMO_USERS[email];
    const registered = JSON.parse(localStorage.getItem('competia_users') || '[]')
        .find(u => u.email === email);

    if (demo && password === demo.password) {
        enterSession({ email, ...demo });
        return;
    }
    if (registered && registered.password === password) {
        enterSession({
            email,
            nombre: registered.nombre,
            rol: 'alumno',
            destino: 'index.html'
        });
        return;
    }
    showError(loginError, 'Correo o contraseña no válidos. Usa una cuenta registrada.');
});

formRegister.addEventListener('submit', (e) => {
    e.preventDefault();
    clearError(registerError);
    const nombre = document.getElementById('regNombre').value.trim();
    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const password = document.getElementById('regPassword').value;
    const users = JSON.parse(localStorage.getItem('competia_users') || '[]');

    if (DEMO_USERS[email] || users.some(u => u.email === email)) {
        showError(registerError, 'Ese correo ya está registrado.');
        return;
    }
    users.push({ nombre, email, password });
    localStorage.setItem('competia_users', JSON.stringify(users));
    enterSession({ email, nombre, rol: 'alumno', destino: 'index.html' });
});

document.querySelectorAll('.demo-card').forEach(card => {
    card.addEventListener('click', () => {
        const email = card.dataset.email;
        const demo = DEMO_USERS[email];
        if (!demo) return;
        document.getElementById('loginEmail').value = email;
        document.getElementById('loginPassword').value = demo.password;
        enterSession({ email, ...demo });
    });
});