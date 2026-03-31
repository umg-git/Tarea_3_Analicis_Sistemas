
// Estructura de datos
let usuarios = JSON.parse(localStorage.getItem('usuarios')) || {};
let textosCifrados = JSON.parse(localStorage.getItem('textosCifrados')) || {};
let historial = JSON.parse(localStorage.getItem('historial')) || [];

// Función simple de cifrado/descifrado (Base64 simple)
function cifrar(texto) {
    return btoa(unescape(encodeURIComponent(texto)));
}

function descifrar(textoCifrado) {
    try {
        return decodeURIComponent(escape(atob(textoCifrado)));
    } catch (e) {
        return null;
    }
}

// Generar token único
function generarToken() {
    return Date.now().toString() + Math.floor(Math.random() * 1000).toString();
}

// Actualizar select de usuarios
function actualizarSelectUsuarios() {
    const select = document.getElementById('userSelect');
    const usuarioActual = localStorage.getItem('usuarioActual');

    select.innerHTML = '<option value="">-- Seleccionar usuario --</option>';

    for (let id in usuarios) {
        select.innerHTML += `<option value="${id}" ${usuarioActual === id ? 'selected' : ''}>${usuarios[id].nombre}</option>`;
    }

    if (usuarioActual && usuarios[usuarioActual]) {
        document.getElementById('userInfo').innerHTML = ` Usuario actual: <strong>${usuarios[usuarioActual].nombre}</strong>`;
        mostrarHistorial(usuarioActual);
    } else {
        document.getElementById('userInfo').innerHTML = '';
        document.getElementById('historyBody').innerHTML = '<tr><td colspan="4" style="text-align: center;">Selecciona un usuario para ver su historial</td></tr>';
    }
}

// Crear nuevo usuario
function crearUsuario() {
    const nombre = prompt('Ingresa tu nombre de usuario:');
    if (nombre && nombre.trim()) {
        const id = 'user_' + Date.now();
        usuarios[id] = {
            nombre: nombre.trim(),
            fechaCreacion: new Date().toLocaleString()
        };
        localStorage.setItem('usuarios', JSON.stringify(usuarios));
        localStorage.setItem('usuarioActual', id);
        actualizarSelectUsuarios();
        alert(`Usuario "${nombre}" creado exitosamente!`);
    }
}

// Cambiar usuario
document.getElementById('userSelect').addEventListener('change', function (e) {
    if (e.target.value) {
        localStorage.setItem('usuarioActual', e.target.value);
        actualizarSelectUsuarios();
    } else {
        localStorage.removeItem('usuarioActual');
        actualizarSelectUsuarios();
    }
});

// Cifrar y almacenar texto
function cifrarYAlmacenar() {
    const usuarioActual = localStorage.getItem('usuarioActual');
    if (!usuarioActual) {
        alert('Por favor, selecciona o crea un usuario primero');
        return;
    }

    const textoOriginal = document.getElementById('plainText').value;
    if (!textoOriginal.trim()) {
        alert('Por favor, ingresa un texto para cifrar');
        return;
    }

    const token = generarToken();
    const textoCifrado = cifrar(textoOriginal);

    // Almacenar texto cifrado
    textosCifrados[token] = {
        textoCifrado: textoCifrado,
        usuarioId: usuarioActual,
        fechaCreacion: new Date().toLocaleString(),
        textoOriginal: textoOriginal
    };

    // Registrar en historial
    historial.push({
        token: token,
        usuarioId: usuarioActual,
        textoOriginal: textoOriginal,
        fechaHora: new Date().toLocaleString(),
    });

    localStorage.setItem('textosCifrados', JSON.stringify(textosCifrados));
    localStorage.setItem('historial', JSON.stringify(historial));

    // Mostrar token
    document.getElementById('tokenResult').style.display = 'block';
    document.getElementById('tokenResult').innerHTML = `<strong> Token generado:</strong><br>${token}<br><br>
                                                                <strong>Texto original:</strong> ${textoOriginal}<br>
                                                                <strong>Texto cifrado:</strong> ${textoCifrado}`;

    document.getElementById('plainText').value = '';
    mostrarHistorial(usuarioActual);
}

// Descifrar por token
function descifrarPorToken() {
    const usuarioActual = localStorage.getItem('usuarioActual');
    if (!usuarioActual) {
        alert('Por favor, selecciona o crea un usuario primero');
        return;
    }

    const token = document.getElementById('tokenInput').value;
    if (!token) {
        alert('Por favor, ingresa un token');
        return;
    }

    const textoAlmacenado = textosCifrados[token];

    if (!textoAlmacenado) {
        document.getElementById('decryptResult').innerHTML = '<div class="error"> Token no encontrado</div>';

        // Registrar intento fallido en historial
        historial.push({
            token: token,
            usuarioId: usuarioActual,
            textoOriginal: 'Token no encontrado',
            fechaHora: new Date().toLocaleString(),
        });
        localStorage.setItem('historial', JSON.stringify(historial));
        mostrarHistorial(usuarioActual);
        return;
    }

    // Verificar que el texto pertenezca al usuario actual
    if (textoAlmacenado.usuarioId !== usuarioActual) {
        document.getElementById('decryptResult').innerHTML = '<div class="error"> No tienes permiso para ver este texto. Este token pertenece a otro usuario.</div>';

        // Registrar intento no autorizado
        historial.push({
            token: token,
            usuarioId: usuarioActual,
            textoOriginal: 'Token de otro usuario',
            fechaHora: new Date().toLocaleString(),
        });
        localStorage.setItem('historial', JSON.stringify(historial));
        mostrarHistorial(usuarioActual);
        return;
    }

    const textoDescifrado = descifrar(textoAlmacenado.textoCifrado);

    // Mostrar resultado
    document.getElementById('decryptResult').innerHTML = `
                <div class="success">
                    <strong> Quién lo ingresó:</strong> ${usuarios[textoAlmacenado.usuarioId]?.nombre || 'Usuario desconocido'}<br>
                    <strong> Texto original:</strong> ${textoDescifrado}<br>
                    <strong> Fecha de creación:</strong> ${textoAlmacenado.fechaCreacion}<br>
                    <strong> Token utilizado:</strong> ${token}
                </div>
            `;

    // Registrar intento exitoso en historial
    historial.push({
        token: token,
        usuarioId: usuarioActual,
        textoOriginal: textoDescifrado,
        fechaHora: new Date().toLocaleString(),
    });
    localStorage.setItem('historial', JSON.stringify(historial));

    document.getElementById('tokenInput').value = '';
    mostrarHistorial(usuarioActual);
}

// Mostrar historial del usuario actual
function mostrarHistorial(usuarioId) {
    const historialUsuario = historial.filter(item => item.usuarioId === usuarioId);
    const tbody = document.getElementById('historyBody');

    if (historialUsuario.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No hay intentos registrados para este usuario</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    historialUsuario.forEach(item => {
        const row = tbody.insertRow();
        row.insertCell(0).innerHTML = `<small>${item.token.substring(0, 20)} </small>`;
        row.insertCell(1).innerHTML = item.textoOriginal.length > 60 ? item.textoOriginal.substring(0, 60) + ' ' : item.textoOriginal;
        row.insertCell(2).innerHTML = item.fechaHora;
    });
}

// Inicializar aplicación
function inicializar() {
    actualizarSelectUsuarios();

    // Si no hay usuarios, crear uno por defecto
    if (Object.keys(usuarios).length === 0) {
        const idDefault = 'user_default';
        usuarios[idDefault] = {
            nombre: 'Usuario Demo',
            fechaCreacion: new Date().toLocaleString()
        };
        localStorage.setItem('usuarios', JSON.stringify(usuarios));
        localStorage.setItem('usuarioActual', idDefault);
        actualizarSelectUsuarios();
    }
}

inicializar();