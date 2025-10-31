// ======================================================
// 1. CONFIGURACIÓN DE FIREBASE
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
// ======================================================
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
// ¡NUEVO! Dos referencias
const dbRefEstudiantes = database.ref('/estudiantes');
const dbRefMapa = database.ref('/mapa_uid_a_id');
const dbRefHistorial = database.ref('/historial_canjes');

// ======================================================
// 3. LISTA DE PREMIOS (Sin cambios)
// ======================================================
const PREMIOS = [
    { id: "premio1", nombre: "Puntos extra en tarea (+1)", costo: 10 },
    { id: "premio2", nombre: "Más tiempo de entrega (+1 día)", costo: 25 },
    { id: "premio3", nombre: "Descuento 10% Tienda Escolar", costo: 50 },
    { id: "premio4", nombre: "Jugo gratis en la tienda", costo: 15 },
];

// ======================================================
// 4. REFERENCIAS A ELEMENTOS HTML (Actualizado)
// ======================================================
const idEstudianteInput = document.getElementById('idEstudianteInput'); // ¡NUEVO!
const uidInput = document.getElementById('uidInput');
const nombreInput = document.getElementById('nombreInput');
const gradoInput = document.getElementById('gradoInput');
const registrarBtn = document.getElementById('registrarBtn');
const listaTarjetas = document.getElementById('listaTarjetas');

const idCanjeInput = document.getElementById('idCanjeInput'); // ¡Actualizado!
const premioSelect = document.getElementById('premioSelect');
const redimirBtn = document.getElementById('redimirBtn');

// ======================================================
// 5. CARGAR PREMIOS EN EL DROPDOWN (Sin cambios)
// ======================================================
function cargarPremios() {
    PREMIOS.forEach(premio => {
        const option = document.createElement('option');
        option.value = premio.id;
        option.textContent = `${premio.nombre} (${premio.costo} puntos)`;
        premioSelect.appendChild(option);
    });
}
cargarPremios();

// ======================================================
// 6. FUNCIÓN PARA REGISTRAR (¡LÓGICA ACTUALIZADA!)
// ======================================================
registrarBtn.onclick = () => {
    const idEstudiante = idEstudianteInput.value.trim();
    const uid = uidInput.value.toUpperCase().trim();
    const nombre = nombreInput.value.trim();
    const grado = gradoInput.value.trim();

    if (idEstudiante && uid && nombre && grado) {
        const datosUsuario = {
            nombre: nombre,
            grado: grado,
            puntaje: 0,
            uid_tarjeta: uid // Guardamos el UID aquí
        };

        // 1. Escribir en la lista principal de estudiantes
        dbRefEstudiantes.child(idEstudiante).set(datosUsuario)
            .then(() => {
                
                // 2. Escribir en el mapa de búsqueda (para el ESP32)
                return dbRefMapa.child(uid).set(idEstudiante);
            })
            .then(() => {
                alert('¡Estudiante registrado con éxito!');
                // Limpiar campos
                idEstudianteInput.value = '';
                uidInput.value = '';
                nombreInput.value = '';
                gradoInput.value = '';
            })
            .catch((error) => {
                console.error('Error al registrar: ', error);
                alert('Error al registrar. Revisa que el ID o UID no esté duplicado.');
            });
    } else {
        alert('Por favor, completa todos los campos.');
    }
};

// ======================================================
// 7. FUNCIÓN PARA LEER Y MOSTRAR (¡LÓGICA ACTUALIZADA!)
// ======================================================
dbRefEstudiantes.on('value', (snapshot) => {
    listaTarjetas.innerHTML = ''; 
    
    if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
            const idEstudiante = childSnapshot.key; // ¡NUEVO! Esta es la llave
            const datos = childSnapshot.val();
            
            const puntaje = datos.puntaje || 0; 
            const grado = datos.grado || "N/A";
            const uid = datos.uid_tarjeta || "N/A"; // ¡NUEVO!

            // Crear el HTML para cada tarjeta
            const tarjetaDiv = document.createElement('div');
            tarjetaDiv.classList.add('tarjeta-item');
            
            tarjetaDiv.innerHTML = `
                <div class="tarjeta-info">
                    <strong>${datos.nombre}</strong>
                    <span>${grado}</span>
                </div>
                <div class="tarjeta-id-est"><strong>ID:</strong> ${idEstudiante}</div>
                <div class="tarjeta-id-uid"><strong>UID:</strong> ${uid}</div>
                <div class="tarjeta-puntaje">
                    <strong>${puntaje}</strong>
                    <span>puntos</span>
                </div>
                <button class="eliminarBtn" data-id-estudiante="${idEstudiante}" data-uid-tarjeta="${uid}">Eliminar</button>
            `;
            
            listaTarjetas.appendChild(tarjetaDiv);
        });
    } else {
        listaTarjetas.innerHTML = '<p>No hay estudiantes registrados.</p>';
    }

    // ======================================================
    // 8. FUNCIÓN PARA ELIMINAR (¡LÓGICA ACTUALIZADA!)
    // ======================================================
    document.querySelectorAll('.eliminarBtn').forEach(button => {
        button.onclick = (e) => {
            const idEst = e.target.getAttribute('data-id-estudiante');
            const uidTarjeta = e.target.getAttribute('data-uid-tarjeta');
            
            if (confirm(`¿Seguro que quieres eliminar al estudiante ${idEst}?`)) {
                
                // 1. Borrar de la lista de estudiantes
                dbRefEstudiantes.child(idEst).remove()
                    .then(() => {
                        // 2. Borrar del mapa de búsqueda
                        if (uidTarjeta !== "N/A") {
                            return dbRefMapa.child(uidTarjeta).remove();
                        }
                    })
                    .then(() => {
                        alert('Estudiante eliminado.');
                    })
                    .catch((error) => console.error('Error al eliminar: ', error));
            }
        };
    });
});

// ======================================================
// 9. FUNCIÓN PARA REDIMIR PUNTOS (¡LÓGICA ACTUALIZADA!)
// ======================================================
redimirBtn.onclick = () => {
    const idEstudiante = idCanjeInput.value.trim(); // ¡NUEVO! Buscamos por ID
    const premioId = premioSelect.value;
    
    if (!idEstudiante) {
        alert("Por favor, ingresa el ID del estudiante.");
        return;
    }

    const premio = PREMIOS.find(p => p.id === premioId);
    if (!premio) {
        alert("Error, premio no válido.");
        return;
    }
    
    const costoPremio = premio.costo;
    const refUsuario = dbRefEstudiantes.child(idEstudiante); // ¡NUEVO! Ruta por ID

    refUsuario.once('value', (snapshot) => {
        if (!snapshot.exists()) {
            alert("Error: No se encontró un estudiante con ese ID.");
            return;
        }

        const datosUsuario = snapshot.val();
        const puntajeActual = datosUsuario.puntaje || 0;

        if (puntajeActual < costoPremio) {
            alert(`¡Puntos insuficientes! Se necesitan ${costoPremio} y el usuario tiene ${puntajeActual}.`);
            return;
        }

        const nuevoPuntaje = puntajeActual - costoPremio;
        
        refUsuario.update({ puntaje: nuevoPuntaje })
            .then(() => {
                alert(`¡Canje exitoso! \nUsuario: ${datosUsuario.nombre}\nPremio: ${premio.nombre}\nNuevo puntaje: ${nuevoPuntaje}`);
                idCanjeInput.value = ''; // Limpiar campo
                
                const logCanje = {
                    id_estudiante: idEstudiante, // ¡Actualizado!
                    nombre: datosUsuario.nombre,
                    premio: premio.nombre,
                    costo: costoPremio,
                    fecha: new Date().toISOString()
                };
                dbRefHistorial.push(logCanje);
            })
            .catch((error) => console.error("Error al actualizar puntos: ", error));
    });
};