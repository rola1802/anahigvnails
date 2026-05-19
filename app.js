// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBp5iHST3h1TKR-BTP08kHHwNmL7er1nW4",
  authDomain: "anahigvnails.firebaseapp.com",
  projectId: "anahigvnails",
  storageBucket: "anahigvnails.firebasestorage.app",
  messagingSenderId: "12968042532",
  appId: "1:12968042532:web:f2a31cf3a23e69a757b8b1"
};

// Inicializar Firebase si las claves están configuradas
if (firebaseConfig.apiKey !== "TU_API_KEY") {
    firebase.initializeApp(firebaseConfig);
} else {
    console.warn("Firebase no ha sido configurado aún. Las citas se simularán de forma local.");
}

// CONTRASEÑA PERSONALIZABLE PARA TU PANEL DE ADMINISTRACIÓN
const ADMIN_PASSWORD = "AnahiNailsAdmin2026"; 

// Capturas de Elementos del DOM
const serviceSelect = document.getElementById('service');
const durationText = document.getElementById('durationText');
const timeSelect = document.getElementById('time');
const bookingForm = document.getElementById('bookingForm');
const confirmation = document.getElementById('confirmation');

const adminAuth = document.getElementById('admin-auth');
const adminPanel = document.getElementById('admin-panel');
const adminPasswordInput = document.getElementById('adminPassword');
const loginAdminBtn = document.getElementById('loginAdminBtn');
const logoutAdminBtn = document.getElementById('logoutAdminBtn');
const appointmentsTableBody = document.getElementById('appointmentsTableBody');

// Configuración global de los horarios del estudio
const horarios = [
    '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM',
    '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
    '6:00 PM', '7:00 PM'
];

function inicializarHorarios() {
    timeSelect.innerHTML = '<option value="">Selecciona horario</option>';
    horarios.forEach(h => {
        const option = document.createElement('option');
        option.value = h;
        option.textContent = h;
        timeSelect.appendChild(option);
    });
}
inicializarHorarios();

serviceSelect.addEventListener('change', () => {
    const selected = serviceSelect.options[serviceSelect.selectedIndex];
    const duration = selected.dataset.duration;
    durationText.textContent = duration ? duration + ' minutos' : '--';
});

// Guardar citas reales en Firebase Firestore
bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const service = serviceSelect.value;
    const date = document.getElementById('date').value;
    const time = timeSelect.value;

    if (firebaseConfig.apiKey === "TU_API_KEY") {
        // Ejecución simulada local en caso de no vincular Firebase todavía
        mostrarConfirmacionLocal(name, service, date, time);
        return;
    }

    try {
        const db = firebase.firestore();
        // Evitar empalmes idénticos detectando si ya existe cita a la misma hora y fecha
        const snapshot = await db.collection('citas')
            .where('date', '==', date)
            .where('time', '==', time)
            .get();

        if (!snapshot.empty) {
            alert("Este horario ya se encuentra ocupado para esa fecha. Por favor elige otro.");
            return;
        }

        await db.collection('citas').add({
            name: name,
            service: service,
            date: date,
            time: time,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        mostrarConfirmacionLocal(name, service, date, time);
        bookingForm.reset();
        durationText.textContent = '--';

    } catch (error) {
        console.error("Error al procesar la cita en Firebase: ", error);
        alert("Ocurrió un inconveniente al registrar la cita.");
    }
});

function mostrarConfirmacionLocal(name, service, date, time) {
    confirmation.style.display = 'block';
    confirmation.innerHTML = `
        ✅ <strong>¡Cita agendada con éxito!</strong><br>
        💅 Cliente: ${name}<br>
        ✨ Servicio: ${service}<br>
        📅 Horario: ${date} a las ${time}
    `;
    confirmation.scrollIntoView({ behavior: 'smooth' });
}

// Autenticación básica local del panel de administración
loginAdminBtn.addEventListener('click', () => {
    if (adminPasswordInput.value === ADMIN_PASSWORD) {
        adminAuth.style.display = 'none';
        adminPanel.style.display = 'block';
        adminPasswordInput.value = '';
        conectarPanelCitas();
    } else {
        alert("Contraseña inválida.");
    }
});

logoutAdminBtn.addEventListener('click', () => {
    adminPanel.style.display = 'none';
    adminAuth.style.display = 'block';
    appointmentsTableBody.innerHTML = '';
});

function conectarPanelCitas() {
    if (firebaseConfig.apiKey === "TU_API_KEY") {
        appointmentsTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#d4a95f;">Vincula tu proyecto de Firebase en app.js para ver citas en tiempo real.</td></tr>`;
        return;
    }

    const db = firebase.firestore();
    db.collection('citas').orderBy('date', 'asc').orderBy('time', 'asc')
        .onSnapshot((snapshot) => {
            appointmentsTableBody.innerHTML = '';
            if (snapshot.empty) {
                appointmentsTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No hay citas registradas en la base de datos.</td></tr>`;
                return;
            }

            snapshot.forEach((doc) => {
                const cita = doc.data();
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${cita.name}</strong></td>
                    <td>${cita.service}</td>
                    <td>${cita.date}</td>
                    <td>${cita.time}</td>
                    <td><button class="btn btn-danger" onclick="eliminarCitaReal('${doc.id}')">Eliminar</button></td>
                `;
                appointmentsTableBody.appendChild(tr);
            });
        });
}

window.eliminarCitaReal = async function(id) {
    if (confirm("¿Segura que deseas remover permanentemente esta cita?")) {
        try {
            const db = firebase.firestore();
            await db.collection('citas').doc(id).delete();
            alert("Cita removida correctamente.");
        } catch (error) {
            alert("No se pudo remover el registro.");
        }
    }
};
