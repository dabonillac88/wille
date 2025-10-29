// ======================================================
// 1. CONFIGURACIÓN DE FIREBASE
// Pega aquí tu objeto de configuración del Paso 1
// ======================================================
const firebaseConfig = {
     apiKey: "AIzaSyBXhrUPvrQu-wq0H6994asVWNo4p9npy2E",
  authDomain: "will-e-d8548.firebaseapp.com",
  databaseURL: "https://will-e-d8548-default-rtdb.firebaseio.com",
  projectId: "will-e-d8548",
  storageBucket: "will-e-d8548.firebasestorage.app",
  messagingSenderId: "826538884677",
  appId: "1:826538884677:web:55220d58adc594e355ad2c"
};

// ======================================================
// 2. INICIALIZAR APP Y BASE DE DATOS
// (¡Este código NO usa 'import'!)
// ======================================================
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const dbRef = database.ref('/tarjetas_autorizadas'); // Referencia al nodo que usa el ESP32

// ======================================================
// 3. REFERENCIAS A ELEMENTOS HTML
// ======================================================
const uidInput = document.getElementById('uidInput');
const nombreInput = document.getElementById('nombreInput');
const registrarBtn = document.getElementById('registrarBtn');
const listaTarjetas = document.getElementById('listaTarjetas');

// ======================================================
// 4. FUNCIÓN PARA REGISTRAR (ESCRIBIR DATOS)
// ======================================================
registrarBtn.onclick = () => {
    // Obtener valores (y convertir UID a mayúsculas como hace el ESP32)
    const uid = uidInput.value.toUpperCase();
    const nombre = nombreInput.value;

    if (uid && nombre) {
        // Objeto de datos que se guardará
        const datosUsuario = {
            nombre: nombre,
            registrado_el: new Date().toISOString() // Guardar fecha de registro
        };

        // Escribimos en Firebase usando el UID como clave
        dbRef.child(uid).set(datosUsuario)
            .then(() => {
                alert('¡Tarjeta registrada con éxito!');
                // Limpiar los campos
                uidInput.value = '';
                nombreInput.value = '';
            })
            .catch((error) => {
                console.error('Error al registrar: ', error);
                alert('Error al registrar la tarjeta.');
            });
    } else {
        alert('Por favor, completa ambos campos.');
    }
};

// ======================================================
// 5. FUNCIÓN PARA LEER Y MOSTRAR (EN TIEMPO REAL)
// ======================================================
dbRef.on('value', (snapshot) => {
    listaTarjetas.innerHTML = ''; // Limpiar la lista antes de recargar
    
    if (snapshot.exists()) {
        // Recorrer todos los hijos del nodo 'tarjetas_autorizadas'
        snapshot.forEach((childSnapshot) => {
            const uid = childSnapshot.key; // El UID (A1B2C3D4)
            const datos = childSnapshot.val(); // El objeto {nombre: "Juan"}

            // Crear el HTML para cada tarjeta
            const tarjetaDiv = document.createElement('div');
            tarjetaDiv.classList.add('tarjeta-item');
            
            tarjetaDiv.innerHTML = `
                <span><strong>UID:</strong> ${uid}</span>
                <span><strong>Nombre:</strong> ${datos.nombre}</span>
                <button class="eliminarBtn" data-uid="${uid}">Eliminar</button>
            `;
            
            listaTarjetas.appendChild(tarjetaDiv);
        });
    } else {
        listaTarjetas.innerHTML = '<p>No hay tarjetas registradas.</p>';
    }

    // ======================================================
    // 6. FUNCIÓN PARA ELIMINAR (AÑADIR EVENTO A BOTONES)
    // ======================================================
    document.querySelectorAll('.eliminarBtn').forEach(button => {
        button.onclick = (e) => {
            const uidParaEliminar = e.target.getAttribute('data-uid');
            if (confirm(`¿Seguro que quieres eliminar la tarjeta ${uidParaEliminar}?`)) {
                
                // Eliminar el hijo (la tarjeta) de Firebase
                dbRef.child(uidParaEliminar).remove()
                    .then(() => {
                        alert('Tarjeta eliminada.');
                    })
                    .catch((error) => {
                        console.error('Error al eliminar: ', error);
                    });
            }
        };
    });
});