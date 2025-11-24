import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, update, get } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyCZYL4A1Zz7Lq66Y6kjXZ4-eDUBz8asLcM",
    authDomain: "clinipet-huellitas.firebaseapp.com",
    databaseURL: "https://clinipet-huellitas-default-rtdb.firebaseio.com",
    projectId: "clinipet-huellitas",
    storageBucket: "clinipet-huellitas.appspot.com",
    messagingSenderId: "176529254321",
    appId: "1:176529254321:web:dfa78ed74a62fa75277f90",
    measurementId: "G-YXV11P7FJB"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth();

const sections = document.querySelectorAll(".section");
const menuLinks = document.querySelectorAll(".menu a");
const tituloSeccion = document.getElementById("tituloSeccion");
const sidebar = document.getElementById("sidebar");
const toggleMenu = document.getElementById("toggleMenu");
const logoutBtn = document.getElementById("logoutBtn");

const btnAgregarCliente = document.getElementById("btnAgregarCliente");
const formCliente = document.getElementById("formCliente");
const btnVolverListaClientes = document.getElementById("btnVolverListaClientes");
const btnCancelarCliente = document.getElementById("btnCancelarCliente");
const tablaClientesBody = document.querySelector("#tablaClientes tbody");
let clientesData = {};

const btnAgregarMascota = document.getElementById("btnAgregarMascota");
const formMascota = document.getElementById("formMascota");
const btnVolverListaMascotas = document.getElementById("btnVolverListaMascotas");
const btnCancelarMascota = document.getElementById("btnCancelarMascota");
const tablaMascotasBody = document.querySelector("#tablaMascotas tbody");
const duenoMascotaSelect = document.getElementById("duenoMascotaSelect");
const especieMascotaSelect = document.getElementById("especieMascotaSelect");
const especieMascotaOtro = document.getElementById("especieMascotaOtro");
const razaMascotaSelect = document.getElementById("razaMascotaSelect");
const razaMascotaOtro = document.getElementById("razaMascotaOtro");
let mascotasData = {};

const btnAgregarCita = document.getElementById("btnAgregarCita");
const btnVolverListaCitas = document.getElementById("btnVolverListaCitas");
const btnCancelarCitaForm = document.getElementById("btnCancelarCitaForm");
const formCita = document.getElementById("formCita");
const calendarEl = document.getElementById("calendario");
const clienteCitaSelect = document.getElementById("clienteCitaSelect");
const mascotaCitaSelect = document.getElementById("mascotaCitaSelect");
const veterinarioCitaSelect = document.getElementById("veterinarioCitaSelect");
const servicioCitaSelect = document.getElementById("servicioCitaSelect");
const costoCitaInput = document.getElementById("costoCita");
const tablaCitasBody = document.querySelector("#tablaCitas tbody");
const tablaCitasProgramadasBody = document.querySelector("#tablaCitasProgramadas tbody");
const tablaHistorialCitasBody = document.querySelector("#tablaHistorialCitas tbody");
const tituloFormCita = document.getElementById("tituloFormCita");
const btnVerHistorialCitas = document.getElementById("btnVerHistorialCitas");
const btnVolverListaCitasHistorial = document.getElementById("btnVolverListaCitasHistorial");
const btnCalendarioCitas = document.getElementById("btnCalendarioCitas");
const calendarioContainer = document.getElementById("calendarioContainer");
const closeCalendarBtn = document.getElementById("closeCalendarBtn");
const citaDetailModal = document.getElementById("citaDetailModal");
const detalleContenido = document.getElementById("detalleContenido");
const closeDetailBtn = document.getElementById("closeDetailBtn");
const btnVolverHistorial = document.getElementById("btnVolverHistorial");
const detalleId = document.getElementById("detalleId");
const detalleFechaHora = document.getElementById("detalleFechaHora");
const detalleCliente = document.getElementById("detalleCliente");
const detalleMascota = document.getElementById("detalleMascota");
const detalleVeterinario = document.getElementById("detalleVeterinario");
const detalleServicio = document.getElementById("detalleServicio");
const detalleCosto = document.getElementById("detalleCosto");
const detalleEstado = document.getElementById("detalleEstado");
const detalleNotas = document.getElementById("detalleNotas"); 
let calendar;
let serviciosData = {};
let citasDataGlobal = {};
let empleadosData = {};
let isDataLoaded = { clientes: false, mascotas: false, servicios: false, empleados: false };

const formCobro = document.getElementById("formCobro");
const btnVolverPagos = document.getElementById("btnVolverPagos");
const btnCancelarCobro = document.getElementById("btnCancelarCobro");
const btnVerHistorialPagos = document.getElementById("btnVerHistorialPagos");
const btnVolverPagosHistorial = document.getElementById("btnVolverPagosHistorial");
let recepcionistaData = {};
let pagosPendientesData = {};
let historialPagosData = {};


const totalClientes = document.getElementById("totalClientes");
const citasDia = document.getElementById("citasDia");

const razasComunes = {
    Perro: ['Labrador', 'Pastor Alemán', 'Chihuahua', 'Poodle', 'Bulldog', 'Otro'],
    Gato: ['Siamés', 'Persa', 'Maine Coon', 'Ragdoll', 'Shorthair', 'Otro'],
    Ave: ['Periquito', 'Canario', 'Cacatúa', 'Loro', 'Otro'],
    Reptil: ['Iguana', 'Tortuga', 'Serpiente', 'Gecko', 'Otro'],
    Otro: ['Raza no especificada']
};

function capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

function showSection(id, title) {
    sections.forEach(s => s.classList.remove("active"));
    const targetSection = document.getElementById(id);
    if (targetSection) {
        targetSection.classList.add("active");
        tituloSeccion.textContent = title;
    } else {
        return;
    }
    menuLinks.forEach(link => link.classList.remove("active"));
    const baseId = id.replace('Lista', '').replace('Formulario', '').replace('Historial', '').replace('detalleHistorial', 'citas').replace('cobro', 'pagos');
    const linkId = `#btn${capitalize(baseId)}`;
    const link = document.querySelector(linkId);
    if (link) link.classList.add("active");
    sidebar.classList.remove("open");
}

function resetFormAndShow(form, formSectionId, title) {
    form.reset();
    const idField = document.getElementById(form.id.replace('form', '').replace(/.$/, 'Id'));
    if (idField) idField.value = "";
    document.getElementById(`tituloForm${form.id.replace('form', '')}`).textContent = title;
    showSection(formSectionId, title);
}

function loadCalendar(citasData) {
    if (isDataLoaded.clientes && isDataLoaded.mascotas && isDataLoaded.servicios && isDataLoaded.empleados) {
        manageCalendar(citasData);
    }
}

onValue(ref(db, "clientes"), (snapshot) => {
    clientesData = snapshot.val() || {};
    totalClientes.textContent = Object.keys(clientesData).length;
    loadClientes();
    
    if (isDataLoaded.mascotas) {
        loadMascotas(); 
        populateClienteMascotaSelects(clienteCitaSelect.value, mascotaCitaSelect.value); 
    }

    isDataLoaded.clientes = true;
    loadCalendar(citasDataGlobal);
});

onValue(ref(db, "mascotas"), (snapshot) => {
    mascotasData = snapshot.val() || {};
    document.getElementById("totalMascotas").textContent = Object.keys(mascotasData).length;
    loadMascotas();
    
    if (isDataLoaded.clientes) {
        loadClientes();
    }

    isDataLoaded.mascotas = true;
    loadCalendar(citasDataGlobal);
});

onValue(ref(db, "servicios"), (snapshot) => {
    serviciosData = snapshot.val() || {};
    populateServiciosSelect();
    isDataLoaded.servicios = true;
    loadCalendar(citasDataGlobal);
});

onValue(ref(db, "empleados"), (snapshot) => {
    empleadosData = snapshot.val() || {};
    isDataLoaded.empleados = true;
    populateVeterinariosSelect(false);
    loadCalendar(citasDataGlobal);
});

onValue(ref(db, "citas"), (snapshot) => {
    citasDataGlobal = snapshot.val() || {};
    markNoShowForPastCitas(citasDataGlobal);
    loadCalendar(citasDataGlobal);
    loadCitas(citasDataGlobal);
});

auth.onAuthStateChanged(user => {
    if (user) {
        onValue(ref(db, 'usuarios'), (snapshot) => {
            const usuarios = snapshot.val();
            const usuarioEntry = Object.entries(usuarios || {}).find(([key, val]) => val.uid === user.uid);
            
            if (usuarioEntry) {
                const empleadoKey = usuarioEntry[1].empleadoKey;
                onValue(ref(db, `empleados/${empleadoKey}`), (empSnapshot) => {
                    const empleado = empSnapshot.val();
                    if (empleado && empleado.rol === 'recepcionista') {
                        recepcionistaData = { 
                            dbKey: empleadoKey, 
                            nombre: empleado.nombre, 
                            rol: empleado.rol 
                        };
                        document.querySelector('.rol').textContent = `Recepcionista (${empleado.nombre})`;
                        startRecepcionistaDataListeners();
                    } else {
                        signOut(auth);
                        window.location.href = "../index.html";
                    }
                }, { onlyOnce: true });
            } else {
                signOut(auth);
                window.location.href = "../index.html";
            }
        });
    } else {
        window.location.href = "../index.html";
    }
});

function startRecepcionistaDataListeners() {
    onValue(ref(db, "pagosPendientes"), (snapshot) => {
        pagosPendientesData = snapshot.val() || {};
        loadPagosPendientes(pagosPendientesData); 
    });

    onValue(ref(db, "historialPagos"), (snapshot) => {
        historialPagosData = snapshot.val() || {};
    });
}

toggleMenu.addEventListener("click", () => sidebar.classList.toggle("open"));

menuLinks.forEach(boton => {
    boton.addEventListener('click', e => {
        e.preventDefault();
        const baseId = boton.id.replace('btn', '').toLowerCase();
        let targetId = `${baseId}Lista`;
        if (baseId === 'citas' || baseId === 'inicio') {
            targetId = baseId === 'citas' ? 'citasLista' : 'inicio';
        } else if (baseId === 'pagos') {
            targetId = 'pagosLista';
        }
        showSection(targetId, capitalize(baseId));
        if (baseId === 'citas' && calendar) {
            calendar.render();
        }
    });
});

logoutBtn.addEventListener("click", async () => {
    try {
        await signOut(auth);
        window.location.href = "../index.html";
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
    }
});

btnAgregarCliente.addEventListener("click", () => {
    resetFormAndShow(formCliente, 'clientesFormulario', 'Registrar Nuevo Cliente');
});
btnVolverListaClientes.addEventListener("click", () => showSection('clientesLista', 'Clientes'));
btnCancelarCliente.addEventListener("click", () => showSection('clientesLista', 'Clientes'));

formCliente.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("clienteId").value;
    const cliente = {
        nombre: document.getElementById("nombreCliente").value,
        apellidoPaterno: document.getElementById("apellidoPaternoCliente").value,
        apellidoMaterno: document.getElementById("apellidoMaternoCliente").value,
        telefono: document.getElementById("telefonoCliente").value,
        correo: document.getElementById("correoCliente").value,
        direccion: document.getElementById("direccionCliente").value
    };
    const clientesRef = ref(db, "clientes");
    if (id) {
        update(ref(db, `clientes/${id}`), cliente);
    } else {
        push(clientesRef, cliente);
    }
    alert(`Cliente guardado con éxito.`);
    showSection('clientesLista', 'Clientes');
});

function loadClientes() {
    tablaClientesBody.innerHTML = "";
    const clientesArray = Object.entries(clientesData);
    if (!clientesArray.length) {
        return tablaClientesBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No hay clientes registrados.</td></tr>`;
    }
    clientesArray.forEach(([key, cli]) => {
        const mascotasCount = Object.values(mascotasData).filter(m => m.duenoId === key).length;
        
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${key.substring(0, 5)}...</td>
            <td>${cli.nombre} ${cli.apellidoPaterno} ${cli.apellidoMaterno}</td>
            <td>${cli.correo || 'N/A'}</td>
            <td>${cli.telefono || 'N/A'}</td>
            <td>${mascotasCount}</td>
            <td>
                <button class="edit-cliente edit-btn" data-id="${key}"><i class="fas fa-edit"></i> Editar</button>
                <button class="delete-cliente delete-btn" data-id="${key}"><i class="fas fa-trash-alt"></i> Eliminar</button>
            </td>`;
        tablaClientesBody.appendChild(tr);
    });
    tablaClientesBody.querySelectorAll(".edit-cliente").forEach(button => {
        button.addEventListener("click", (e) => {
            const key = e.target.closest('button').dataset.id;
            const cli = clientesData[key];
            document.getElementById("clienteId").value = key;
            document.getElementById("nombreCliente").value = cli.nombre;
            document.getElementById("apellidoPaternoCliente").value = cli.apellidoPaterno;
            document.getElementById("apellidoMaternoCliente").value = cli.apellidoMaterno;
            document.getElementById("telefonoCliente").value = cli.telefono;
            document.getElementById("correoCliente").value = cli.correo;
            document.getElementById("direccionCliente").value = cli.direccion;
            showSection('clientesFormulario', `Editar Cliente: ${cli.nombre}`);
        });
    });
    tablaClientesBody.querySelectorAll(".delete-cliente").forEach(button => {
        button.addEventListener("click", (e) => {
            const key = e.target.closest('button').dataset.id;
            const cliData = clientesData[key];
            if (confirm(`¿Seguro que desea eliminar al cliente ${cliData.nombre} y sus mascotas asociadas?`)) {
                remove(ref(db, `clientes/${key}`));
                Object.entries(mascotasData).forEach(([mascotaKey, mascota]) => {
                    if (mascota.duenoId === key) {
                        remove(ref(db, `mascotas/${mascotaKey}`));
                    }
                });
            }
        });
    });
}

btnAgregarMascota.addEventListener("click", () => {
    populateDuenoSelect();
    resetFormAndShow(formMascota, 'mascotasFormulario', 'Registrar Nueva Mascota');
    especieMascotaOtro.value = '';
    razaMascotaOtro.value = '';
    especieMascotaSelect.dispatchEvent(new Event('change'));
});
btnVolverListaMascotas.addEventListener("click", () => showSection('mascotasLista', 'Mascotas'));
btnCancelarMascota.addEventListener("click", () => showSection('mascotasLista', 'Mascotas'));

function populateDuenoSelect() {
    duenoMascotaSelect.innerHTML = '<option value="">-- Seleccione un Dueño --</option>';
    Object.entries(clientesData).forEach(([key, cli]) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = `${cli.nombre} ${cli.apellidoPaterno}`;
        duenoMascotaSelect.appendChild(option);
    });
}

especieMascotaSelect.addEventListener('change', () => {
    const especie = especieMascotaSelect.value;
    const isOtro = especie === 'Otro';
    
    especieMascotaOtro.style.display = isOtro ? 'block' : 'none';
    especieMascotaOtro.required = isOtro;
    especieMascotaOtro.value = isOtro ? especieMascotaOtro.value : '';

    razaMascotaSelect.style.display = isOtro ? 'none' : 'block';
    razaMascotaSelect.required = !isOtro;
    razaMascotaSelect.value = '';

    razaMascotaOtro.style.display = 'none';
    razaMascotaOtro.required = false;
    razaMascotaOtro.value = '';

    if (!isOtro) {
        razaMascotaSelect.innerHTML = '<option value="">-- Seleccionar Raza --</option>';
        const razas = razasComunes[especie] || [];
        if (especie) {
            razas.forEach(raza => {
                razaMascotaSelect.innerHTML += `<option value="${raza}">${raza}</option>`;
            });
        }
    }
    
    if (razaMascotaSelect.style.display !== 'none') {
        razaMascotaSelect.dispatchEvent(new Event('change'));
    }
});

razaMascotaSelect.addEventListener('change', () => {
    const raza = razaMascotaSelect.value;
    const isOtroRaza = razaMascotaSelect.style.display !== 'none' && raza === 'Otro';
    
    razaMascotaOtro.style.display = isOtroRaza ? 'block' : 'none';
    razaMascotaOtro.required = isOtroRaza;
});

formMascota.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("mascotaId").value;
    
    let especieFinal = especieMascotaSelect.value;
    if (especieFinal === 'Otro') {
        especieFinal = especieMascotaOtro.value.trim() || 'No Especificada';
    }
    
    let razaFinal = razaMascotaSelect.value;
    if (razaMascotaSelect.style.display === 'none') {
        razaFinal = razaMascotaOtro.value.trim() || 'No Especificada';
    } else if (razaFinal === 'Otro') {
        razaFinal = razaMascotaOtro.value.trim() || 'No Especificada';
    } else if (razaFinal === 'Raza no especificada') {
        razaFinal = 'No Especificada';
    }

    const mascota = {
        duenoId: duenoMascotaSelect.value,
        nombre: document.getElementById("nombreMascota").value,
        genero: document.getElementById("generoMascota").value,
        especie: especieFinal,
        raza: razaFinal,
        fechaNac: document.getElementById("fechaNacMascota").value,
        peso: document.getElementById("pesoMascota").value
    };
    const mascotasRef = ref(db, "mascotas");
    if (id) {
        update(ref(db, `mascotas/${id}`), mascota);
    } else {
        push(mascotasRef, mascota);
    }
    alert(`Mascota guardada con éxito.`);
    showSection('mascotasLista', 'Mascotas');
});

function loadMascotas() {
    tablaMascotasBody.innerHTML = "";
    const mascotasArray = Object.entries(mascotasData);
    if (!mascotasArray.length) {
        return tablaMascotasBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No hay mascotas registradas.</td></tr>`;
    }
    mascotasArray.forEach(([key, masc]) => {
        const dueno = clientesData[masc.duenoId];
        const duenoNombre = dueno ? `${dueno.nombre} ${dueno.apellidoPaterno}` : 'N/A (Dueño Eliminado)';
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${key.substring(0, 5)}...</td>
            <td>${masc.nombre}</td>
            <td>${masc.especie}</td>
            <td>${masc.raza}</td>
            <td>${duenoNombre} (${masc.duenoId.substring(0, 5)}...)</td>
            <td>
                <button class="edit-mascota edit-btn" data-id="${key}"><i class="fas fa-edit"></i> Editar</button>
                <button class="delete-mascota delete-btn" data-id="${key}"><i class="fas fa-trash-alt"></i> Eliminar</button>
            </td>`;
        tablaMascotasBody.appendChild(tr);
    });
    tablaMascotasBody.querySelectorAll(".edit-mascota").forEach(button => {
        button.addEventListener("click", (e) => {
            const key = e.target.closest('button').dataset.id;
            const masc = mascotasData[key];
            populateDuenoSelect();
            document.getElementById("mascotaId").value = key;
            document.getElementById("duenoMascotaSelect").value = masc.duenoId;
            document.getElementById("nombreMascota").value = masc.nombre;
            document.getElementById("generoMascota").value = masc.genero;
            document.getElementById("fechaNacMascota").value = masc.fechaNac;
            document.getElementById("pesoMascota").value = masc.peso;
            
            const especiePredefinida = masc.especie in razasComunes;
            const especieSelectValue = especiePredefinida ? masc.especie : 'Otro';
            especieMascotaSelect.value = especieSelectValue;
            especieMascotaSelect.dispatchEvent(new Event('change'));
            
            if (!especiePredefinida) {
                especieMascotaOtro.value = masc.especie;
            } else {
                const razasDeEspecie = razasComunes[masc.especie] || [];
                const razaPredefinida = razasDeEspecie.includes(masc.raza);
                const razaSelectValue = razaPredefinida ? masc.raza : 'Otro';
                razaMascotaSelect.value = razaSelectValue;
                if (!razaPredefinida) {
                    razaMascotaOtro.value = masc.raza;
                }
            }
            showSection('mascotasFormulario', `Editar Mascota: ${masc.nombre}`);
        });
    });
    tablaMascotasBody.querySelectorAll(".delete-mascota").forEach(button => {
        button.addEventListener("click", (e) => {
            const key = e.target.closest('button').dataset.id;
            const mascData = mascotasData[key];
            if (confirm(`¿Seguro que desea eliminar a la mascota ${mascData.nombre}?`)) {
                remove(ref(db, `mascotas/${key}`));
            }
        });
    });
}

function populateVeterinariosSelect(onlyVets = true) {
    veterinarioCitaSelect.innerHTML = '<option value="">-- Seleccionar Veterinario --</option>';
    Object.entries(empleadosData).forEach(([key, emp]) => {
        if (!onlyVets || emp.rol === 'veterinario') {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = `${emp.nombre} ${emp.apellidoPaterno}`;
            veterinarioCitaSelect.appendChild(option);
        }
    });
}

function populateServiciosSelect() {
    servicioCitaSelect.innerHTML = '<option value="">-- Seleccionar Servicio --</option>';
    Object.entries(serviciosData).forEach(([key, serv]) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = `${serv.nombre} ($${parseFloat(serv.costo).toFixed(2)})`;
        servicioCitaSelect.appendChild(option);
    });
    servicioCitaSelect.onchange = () => {
        const selectedKey = servicioCitaSelect.value;
        const servicio = serviciosData[selectedKey];
        if (servicio) {
            costoCitaInput.value = parseFloat(servicio.costo).toFixed(2);
        } else {
            costoCitaInput.value = "";
        }
    };
}

function populateClienteMascotaSelects(selectedClientId = null, selectedMascotaId = null) {
    clienteCitaSelect.innerHTML = '<option value="">-- Seleccionar Cliente --</option>';
    Object.entries(clientesData).forEach(([key, cli]) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = `${cli.nombre} ${cli.apellidoPaterno}`;
        if (key === selectedClientId) option.selected = true;
        clienteCitaSelect.appendChild(option);
    });
    
    mascotaCitaSelect.innerHTML = '<option value="">-- Seleccionar Mascota --</option>';
    mascotaCitaSelect.disabled = true;

    const updateMascotas = (clientId) => {
        mascotaCitaSelect.innerHTML = '<option value="">-- Seleccionar Mascota --</option>';
        Object.entries(mascotasData).forEach(([key, masc]) => {
            if (masc.duenoId === clientId) {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = `${masc.nombre} (${masc.especie})`;
                if (key === selectedMascotaId) option.selected = true;
                mascotaCitaSelect.appendChild(option);
            }
        });
        mascotaCitaSelect.disabled = !clientId;
    };

    clienteCitaSelect.onchange = (e) => updateMascotas(e.target.value);
    
    if (selectedClientId) {
        updateMascotas(selectedClientId);
    }
}

function getVetName(vetId) {
    if (!vetId) return 'N/A';
    const vet = empleadosData[vetId]; 
    if (vet && vet.nombre) {
        return `${vet.nombre || ''} ${vet.apellidoPaterno || ''}`.trim();
    }
    return `ID: ${vetId.substring(0, 5)}...`;
}


function parseDateParts(dateStr) {
    if (!dateStr) return null;
    const dateParts = dateStr.match(/^\d{4}-\d{2}-\d{2}/);
    if (!dateParts) return null;
    const [y, m, d] = dateParts[0].split("-").map(Number);
    return { year: y, monthIndex: m - 1, day: d };
}

function isSameLocalDay(dateStr, todayDateObj = new Date()) {
    const parts = parseDateParts(dateStr);
    if (!parts) return false;
    return parts.year === todayDateObj.getFullYear() && parts.monthIndex === todayDateObj.getMonth() && parts.day === todayDateObj.getDate();
}

function isPastDay(dateStr, todayDateObj = new Date()) {
    const parts = parseDateParts(dateStr);
    if (!parts) return false;
    const citaDate = new Date(parts.year, parts.monthIndex, parts.day);
    const today = new Date(todayDateObj.getFullYear(), todayDateObj.getMonth(), todayDateObj.getDate());
    return citaDate < today;
}

function timeStringToDate(dateStr, timeStr) {
    if (!dateStr || !timeStr) return null;
    const parts = parseDateParts(dateStr);
    if (!parts) return null;
    const [hh, mm] = timeStr.split(':').map(Number);
    return new Date(parts.year, parts.monthIndex, parts.day, hh, mm, 0);
}

function isPastAndPassedTime(cita) {
    const fecha = cita.fecha;
    const hora = cita.hora;
    if (!fecha || !hora) return false;
    const start = timeStringToDate(fecha, hora);
    if (!start) return false;
    let durationMinutes = 60; // Default
    const servicio = serviciosData[cita.servicioId];
    if (servicio && servicio.duracion) {
        const d = parseInt(servicio.duracion);
        if (!isNaN(d) && d > 0) durationMinutes = d;
    }
    const end = new Date(start.getTime() + durationMinutes * 60000);
    return new Date() > end;
}

function markNoShowForPastCitas(citasData) {
    const updates = {};
    const entries = citasData && typeof citasData === 'object' ? Object.entries(citasData) : [];
    entries.forEach(([key, cita]) => {
        if (!cita) return;
        const estado = cita.estadoCita || 'Pendiente';
        if (estado === 'Pendiente') {
            if (isPastAndPassedTime(cita)) {
                updates[`citas/${key}/estadoCita`] = 'No Asistió';
                updates[`citas/${key}/noAsistioEn`] = new Date().toISOString();
            }
        }
    });
    if (Object.keys(updates).length > 0) {
        update(ref(db), updates)
            .catch(error => console.error("Error al actualizar estados:", error));
    }
}


// ===========================================
//  FUNCIONES DE CITAS (CORE)
// ===========================================

function manageCalendar(citasData) {
    const events = buildCalendarEvents(citasData);
    if (calendar) {
        calendar.setOption('events', events);
    } else {
        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: "dayGridMonth",
            locale: "es",
            height: 550,
            selectable: true,
            headerToolbar: {
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay"
            },
            events: events,
            dateClick: (info) => {
                formCita.reset();
                document.getElementById("citaId").value = "";
                tituloFormCita.textContent = "Agendar Nueva Cita";
                document.getElementById("fechaCita").value = info.dateStr;
                document.getElementById("costoCita").value = "";
                populateClienteMascotaSelects();
                populateVeterinariosSelect();
                showSection('citasFormulario', 'Agendar Nueva Cita');
            },
            eventClick: (info) => {
                const props = info.event.extendedProps;
                showCitaDetails(props, info.event.start, info.event.id);
            }
        });
        calendar.render();
    }
}

function buildCalendarEvents(citasData) {
    const entries = citasData && typeof citasData === 'object' ? Object.entries(citasData) : [];
    const events = entries.map(([key, cita]) => {
        const cliente = clientesData[cita.clienteId] || {};
        const mascota = mascotasData[cita.mascotaId] || {};
        const servicioNombre = serviciosData[cita.servicioId]?.nombre || cita.servicio || 'Servicio N/A';
        const estado = cita.estadoCita || 'Pendiente';
        let color = '#2a9d8f';
        if (estado === 'Completada') color = '#28a745';
        else if (estado === 'Cancelada') color = '#dc3545';
        else if (estado === 'No Asistió' || (estado === 'Pendiente' && isPastAndPassedTime(cita))) color = '#6c757d';

        return {
            id: key,
            title: `${servicioNombre} (${mascota.nombre || 'Mascota'})`,
            start: `${cita.fecha}T${cita.hora}`,
            extendedProps: {
                ...cita,
                servicioNombre: servicioNombre,
                clienteNombre: `${cliente.nombre || ''} ${cliente.apellidoPaterno || ''}`.trim(),
                mascotaNombre: mascota.nombre || 'N/A'
            },
            color: color
        };
    });
    return events;
}

function handleCompleteCita(key, cita) {
    if (confirm(`¿Marcar la cita de ${citasDataGlobal[key].servicio} como COMPLETA? (Esto la enviará a cobros si es necesario)`)) {
        update(ref(db, `citas/${key}`), { estadoCita: 'Completada', completadaEn: new Date().toISOString() });
    }
}

function handleCancelCita(key, cita) {
    if (confirm(`¿Seguro que desea CANCELAR la cita de ${citasDataGlobal[key].servicio} a las ${citasDataGlobal[key].hora}?`)) {
        update(ref(db, `citas/${key}`), { estadoCita: 'Cancelada', canceladaEn: new Date().toISOString() });
    }
}

function loadCitas(citasData) {
    const todayObj = new Date();
    tablaCitasBody.innerHTML = "";
    tablaCitasProgramadasBody.innerHTML = "";
    tablaHistorialCitasBody.innerHTML = "";

    const citasEntries = citasData && typeof citasData === 'object' ? Object.entries(citasData) : [];
    const citasHoy = [];
    const citasProgramadas = [];
    const citasHistorial = [];

    citasEntries.forEach(([key, cita]) => {
        const fechaCampo = cita.fecha ?? cita.fechaCita ?? null;
        if (!fechaCampo) return;

        const estado = cita.estadoCita || 'Pendiente';
        const isCompletedOrCanceled = estado !== 'Pendiente';
        const isHistoricalDate = isPastDay(fechaCampo, todayObj);

        if (isCompletedOrCanceled || isHistoricalDate) {
            citasHistorial.push([key, cita]);
        } else if (isSameLocalDay(fechaCampo, todayObj)) {
            citasHoy.push([key, cita]);
        } else {
            citasProgramadas.push([key, cita]);
        }
    });

    citasHoy.sort((a, b) => (a[1].hora || "").localeCompare(b[1].hora || ""));
    citasProgramadas.sort((a, b) => `${a[1].fecha} ${a[1].hora}`.localeCompare(`${b[1].fecha} ${b[1].hora}`));
    citasHistorial.sort((a, b) => `${b[1].fecha} ${b[1].hora}`.localeCompare(`${a[1].fecha} ${a[1].hora}`));

    citasDia.textContent = citasHoy.filter(([key, cita]) => cita.estadoCita === 'Pendiente').length;

    const now = new Date();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    document.getElementById("citasProximaSemana").textContent = citasProgramadas.filter(([key, cita]) => {
        const parts = parseDateParts(cita.fecha);
        if (!parts) return false;
        const citaDate = new Date(parts.year, parts.monthIndex, parts.day);
        return (citaDate.getTime() - now.getTime()) < oneWeek;
    }).length;

    renderCitasTable(citasHoy, tablaCitasBody, "noCitasDia", true);
    renderCitasTable(citasProgramadas, tablaCitasProgramadasBody, "noCitasProgramadas", false, true);
    
    // Renderizar historial solo si la sección está activa
    if (document.getElementById('citasHistorial').classList.contains('active') || document.getElementById('detalleHistorial').classList.contains('active')) {
        renderCitasTable(citasHistorial, tablaHistorialCitasBody, "noCitasHistorial", false, true, true);
    }
}

function renderCitasTable(citasArray, tableBody, noCitasId, isToday = false, showDate = false, isHistory = false) {
    tableBody.innerHTML = "";
    if (!citasArray.length) {
        document.getElementById(noCitasId).style.display = 'block';
        return;
    }
    document.getElementById(noCitasId).style.display = 'none';

    citasArray.forEach(([key, cita]) => {
        const cliente = clientesData[cita.clienteId] || {};
        const mascota = mascotasData[cita.mascotaId] || {};
        const servicioNombre = serviciosData[cita.servicioId]?.nombre || cita.servicio || 'N/A';
        const veterinario = getVetName(cita.veterinarioId);
        const estado = cita.estadoCita || 'Pendiente';
        
        const tr = document.createElement("tr");
        let actions = '';
        
        if (isHistory) {
            actions = `<button class="view-cita view-btn" data-id="${key}"><i class="fas fa-eye"></i> Ver Detalle</button>`;
        } else {
            actions = `
                <button class="edit-cita edit-btn" data-id="${key}"><i class="fas fa-edit"></i> Editar</button>
                <button class="delete-cita delete-btn" data-id="${key}"><i class="fas fa-times-circle"></i> Cancelar</button>`;
            
            if (isToday && estado === 'Pendiente') {
                actions = `<button class="complete-cita complete-btn" data-id="${key}"><i class="fas fa-check-circle"></i> Completar</button>` + actions;
            } else if (estado !== 'Pendiente') {
                 actions = `<span class="estado-cita estado-${estado.toLowerCase().replace(' ', '-')}">${estado}</span>`;
            }
        }
        
        const fechaCelda = showDate ? `<td>${cita.fecha}</td>` : '';
        tr.innerHTML = `
            ${fechaCelda}
            <td>${cita.hora || 'N/A'}</td>
            <td>${(cliente.nombre ? `${cliente.nombre} ${cliente.apellidoPaterno ?? ''}` : 'N/A').trim()}</td>
            <td>${mascota.nombre || 'N/A'}</td>
            <td>${servicioNombre}</td>
            <td><span class="estado-cita estado-${estado.toLowerCase().replace(' ', '-')}">${isHistory ? estado : (estado === 'Completada' ? 'Finalizada' : estado)}</span> (${veterinario})</td>
            <td>${actions}</td>`;
        
        tableBody.appendChild(tr);
    });
    addCitasEventListeners(tableBody, citasDataGlobal, isHistory);
}

function addCitasEventListeners(tableBody, citasData, isHistory = false) {
    tableBody.querySelectorAll(".edit-cita").forEach(button => {
        button.onclick = (e) => {
            const key = e.target.closest('button').dataset.id;
            const cita = citasData[key];
            document.getElementById("citaId").value = key;
            tituloFormCita.textContent = "Editar Cita";
            document.getElementById("fechaCita").value = cita.fecha ?? cita.fechaCita ?? "";
            document.getElementById("horaCita").value = cita.hora;
            document.getElementById("costoCita").value = cita.costo;
            populateVeterinariosSelect(false);
            populateClienteMascotaSelects(cita.clienteId, cita.mascotaId);
            veterinarioCitaSelect.value = cita.veterinarioId;
            servicioCitaSelect.value = cita.servicioId || '';
            showSection('citasFormulario', 'Editar Cita');
        };
    });
    tableBody.querySelectorAll(".complete-cita").forEach(button => {
        button.onclick = (e) => {
            const key = e.target.closest('button').dataset.id;
            handleCompleteCita(key, citasData[key]);
        };
    });
    tableBody.querySelectorAll(".delete-cita").forEach(button => {
        button.onclick = (e) => {
            const key = e.target.closest('button').dataset.id;
            handleCancelCita(key, citasData[key]);
        };
    });

    tableBody.querySelectorAll(".view-cita").forEach(button => {
        button.onclick = (e) => {
            const key = e.target.closest('button').dataset.id;
            const cita = citasData[key];
            if (cita) {
                showCitaHistoryDetails(key, cita);
            }
        };
    });
}

function showCitaHistoryDetails(citaId, cita) {
    const cliente = clientesData[cita.clienteId] || {};
    const mascota = mascotasData[cita.mascotaId] || {};
    const veterinarioNombre = getVetName(cita.veterinarioId);
    const servicio = serviciosData[cita.servicioId] || {};
    const clienteNombre = `${cliente.nombre || 'N/A'} ${cliente.apellidoPaterno || ''} ${cliente.apellidoMaterno || ''}`;
    const mascotaNombre = mascota.nombre || 'N/A';
    const servicioNombre = servicio.nombre || cita.servicio || 'N/A';
    const costo = parseFloat(cita.costo || 0).toFixed(2);
    
    document.getElementById('detalleId').textContent = citaId.substring(0, 8) + '...';
    document.getElementById('detalleFechaHora').textContent = `${cita.fecha} a las ${cita.hora}`;
    document.getElementById('detalleCliente').textContent = clienteNombre.trim();
    document.getElementById('detalleMascota').textContent = mascotaNombre;
    document.getElementById('detalleVeterinario').textContent = veterinarioNombre;
    document.getElementById('detalleServicio').textContent = servicioNombre;
    document.getElementById('detalleCosto').textContent = `$${costo}`;
    document.getElementById('detalleEstado').textContent = cita.estadoCita || 'Finalizada';
    document.getElementById('detalleNotas').textContent = cita.notas || 'No hay notas o diagnóstico asociado.';

    showSection('detalleHistorial', `Detalle de Cita Histórica`);
}

btnAgregarCita.addEventListener("click", () => {
    formCita.reset();
    document.getElementById("citaId").value = "";
    tituloFormCita.textContent = "Agendar Nueva Cita";
    document.getElementById("fechaCita").value = new Date().toISOString().split('T')[0];
    document.getElementById("costoCita").value = "0.00";
    populateVeterinariosSelect();
    populateClienteMascotaSelects();
    populateServiciosSelect();
    showSection('citasFormulario', 'Agendar Nueva Cita');
});

btnVolverListaCitas.addEventListener("click", () => showSection('citasLista', 'Citas'));
btnCancelarCitaForm.addEventListener("click", () => showSection('citasLista', 'Citas'));

if (btnVerHistorialCitas) {
    btnVerHistorialCitas.addEventListener("click", () => {
        showSection('citasHistorial', 'Historial de Citas');
        loadCitas(citasDataGlobal);
    });
}
if (btnVolverListaCitasHistorial) {
    btnVolverListaCitasHistorial.addEventListener("click", () => showSection('citasLista', 'Citas'));
}
if (btnVolverHistorial) {
    btnVolverHistorial.addEventListener("click", () => {
        showSection('citasHistorial', 'Historial de Citas');
        loadCitas(citasDataGlobal);
    });
}

btnCalendarioCitas.addEventListener("click", () => {
    calendarioContainer.style.display = 'flex';
    if (calendar) {
        calendar.render();
        calendar.refetchEvents();
    }
});

closeCalendarBtn.addEventListener("click", () => {
    calendarioContainer.style.display = 'none';
});

closeDetailBtn.addEventListener("click", () => {
    citaDetailModal.style.display = 'none';
});

formCita.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("citaId").value;
    const servicioKey = servicioCitaSelect.value;
    const servicioData = serviciosData[servicioKey];
    
    if (!servicioData) {
        alert("Debe seleccionar un servicio válido.");
        return;
    }
    const horaSeleccionada = document.getElementById("horaCita").value;
    if (!horaSeleccionada) {
        alert("Seleccione una hora válida.");
        return;
    }
    
    const minTime = "08:00";
    const maxTime = "22:00";
    if (horaSeleccionada < minTime || horaSeleccionada > maxTime) {
        alert("La hora debe estar entre 08:00 y 22:00 (8:00 AM a 10:00 PM).");
        return;
    }
    
    const cita = {
        clienteId: clienteCitaSelect.value,
        mascotaId: mascotaCitaSelect.value,
        veterinarioId: veterinarioCitaSelect.value,
        servicioId: servicioKey,
        servicio: servicioData.nombre,
        costo: parseFloat(costoCitaInput.value) || 0,
        fecha: document.getElementById("fechaCita").value,
        hora: horaSeleccionada,
        estadoCita: id ? citasDataGlobal[id]?.estadoCita || 'Pendiente' : 'Pendiente'
    };
    
    const citasRef = ref(db, "citas");
    if (id) {
        update(ref(db, `citas/${id}`), cita);
    } else {
        push(citasRef, cita);
    }
    
    alert("Cita agendada/actualizada correctamente.");
    showSection('citasLista', 'Citas');
    if (calendar) {
        calendar.refetchEvents();
    }
});

function loadPagosPendientes(data) {
    const tablaBody = document.querySelector("#tablaPagosPendientes tbody");
    tablaBody.innerHTML = "";
    
    const pagosPendientes = Object.entries(data || {})
        .filter(([key, pago]) => pago.estado === 'PENDIENTE_COBRO'); 
    
    if (pagosPendientes.length === 0) {
        document.getElementById("noPagosPendientes").style.display = 'block';
        return;
    }
    document.getElementById("noPagosPendientes").style.display = 'none';

    pagosPendientes.forEach(([key, pago]) => {
        const cliente = clientesData[pago.clienteId] || {};
        const mascota = mascotasData[pago.mascotaId] || {};
        
        const clienteNombre = (cliente.nombre ? `${cliente.nombre} ${cliente.apellidoPaterno ?? ''}` : 'N/A').trim();
        const mascotaNombre = mascota.nombre || 'N/A';
        const fechaHora = `${pago.fechaCita || 'N/A'} ${pago.horaCita || ''}`; 

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${pago.citaId.substring(0, 8)}...</td>
            <td>${fechaHora}</td>
            <td>${clienteNombre}</td>
            <td>${mascotaNombre}</td>
            <td>$${parseFloat(pago.costoTotal || 0).toFixed(2)}</td>
            <td>
                <button class="procesar-pago-btn edit-btn" data-pagoid="${key}"><i class="fas fa-dollar-sign"></i> Cobrar</button>
            </td>`; 
        tablaBody.appendChild(tr);
    });
    
    tablaBody.querySelectorAll(".procesar-pago-btn").forEach(button => {
        button.addEventListener("click", (e) => {
            const pagoId = e.target.closest('button').dataset.pagoid;
            showCobroForm(pagoId);
        });
    });
}

function showCobroForm(pagoId) {
    const pago = pagosPendientesData[pagoId];
    if (!pago) return;

    const cliente = clientesData[pago.clienteId] || {};
    const mascota = mascotasData[pago.mascotaId] || {};
    const clienteNombre = (cliente.nombre ? `${cliente.nombre} ${cliente.apellidoPaterno ?? ''}` : 'N/A').trim();
    const mascotaNombre = mascota.nombre || 'N/A';
    const montoTotal = parseFloat(pago.costoTotal || 0);

    document.getElementById("citaIdCobro").value = pagoId; 
    document.getElementById("resumenCitaId").textContent = pago.citaId.substring(0, 8);
    document.getElementById("resumenCliente").textContent = clienteNombre;
    document.getElementById("resumenMascota").textContent = mascotaNombre;
    document.getElementById("montoTotalCobrar").textContent = `$${montoTotal.toFixed(2)}`;
    
    const montoRecibidoInput = document.getElementById("montoRecibido");
    montoRecibidoInput.value = montoTotal.toFixed(2); 
    document.getElementById("cambioDevolver").textContent = "$0.00";
    document.getElementById("btnConfirmarCobro").disabled = false;

    const listaServicios = document.getElementById("listaServiciosCobro");
    listaServicios.innerHTML = '';

    if (pago.costoServicio > 0) {
        listaServicios.innerHTML += `<li><strong>Servicio (${pago.servicioOriginal || 'Cita'}):</strong> $${parseFloat(pago.costoServicio).toFixed(2)}</li>`;
    }

    const productos = pago.productosCobro || {};
    if (Object.keys(productos).length > 0) {
        listaServicios.innerHTML += '<li><strong>--- Productos Dispensados ---</strong></li>';
        for (const [key, item] of Object.entries(productos)) {
            const subtotal = item.cantidad * item.precioUnitario;
            listaServicios.innerHTML += `<li>${item.cantidad} x ${item.nombre}: $${subtotal.toFixed(2)}</li>`;
        }
    }

    montoRecibidoInput.oninput = () => {
        const recibido = parseFloat(montoRecibidoInput.value) || 0;
        const cambio = recibido - montoTotal;
        document.getElementById("cambioDevolver").textContent = `$${cambio.toFixed(2)}`;
        document.getElementById("cambioDevolver").style.color = cambio >= 0 ? '#007bff' : '#dc3545';
        document.getElementById("btnConfirmarCobro").disabled = cambio < 0;
    };
    
    montoRecibidoInput.oninput();

    showSection('cobroFormulario', 'Procesar Pago');
}

formCobro.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const pagoId = document.getElementById("citaIdCobro").value;
    const pagoPendiente = pagosPendientesData[pagoId];
    
    if (!pagoPendiente) {
        alert("Error: El registro de pago pendiente no se encontró.");
        return;
    }
    if (!recepcionistaData.dbKey) {
        alert("Error de sesión: No se pudo identificar al recepcionista.");
        return;
    }

    const montoTotal = parseFloat(pagoPendiente.costoTotal || 0);
    const montoRecibido = parseFloat(document.getElementById("montoRecibido").value) || 0;
    const metodoPago = document.getElementById("metodoPago").value;
    const cambioDevolver = montoRecibido - montoTotal;

    if (cambioDevolver < 0) {
        alert("El monto recibido es menor al total a cobrar. Ajuste la cantidad.");
        return;
    }
    
    const updates = {};
    const nuevoPagoRef = push(ref(db, `historialPagos`));
    const fechaPago = new Date().toISOString();
    
    const registroPago = {
        citaId: pagoPendiente.citaId,
        expedienteId: pagoPendiente.expedienteId || 'N/A',
        clienteId: pagoPendiente.clienteId,
        mascotaId: pagoPendiente.mascotaId,
        veterinarioKey: pagoPendiente.veterinarioKey,
        recepcionistaKey: recepcionistaData.dbKey,
        montoTotal: montoTotal,
        montoRecibido: montoRecibido,
        cambio: cambioDevolver,
        metodoPago: metodoPago,
        detallesCobro: pagoPendiente, 
        fechaPago: fechaPago,
        estado: 'PAGADO_COMPLETADO'
    };
    updates[`historialPagos/${nuevoPagoRef.key}`] = registroPago;
    updates[`pagosPendientes/${pagoId}`] = null;

    try {
        await update(ref(db), updates);
        alert(` Pago de $${montoTotal.toFixed(2)} confirmado.`);
        showSection('pagosLista', 'Gestión de Pagos Pendientes'); 
    } catch (error) {
        console.error("Error al confirmar el cobro:", error);
        alert("Error al procesar el pago: " + error.message);
    }
});

document.querySelector("#btnPagos").addEventListener("click", (e) => {
    e.preventDefault();
    loadPagosPendientes(pagosPendientesData); 
    showSection('pagosLista', 'Gestión de Pagos Pendientes');
});

if (btnVolverPagos) btnVolverPagos.addEventListener("click", () => showSection('pagosLista', 'Gestión de Pagos Pendientes'));
if (btnCancelarCobro) btnCancelarCobro.addEventListener("click", () => showSection('pagosLista', 'Gestión de Pagos Pendientes'));

if (btnVerHistorialPagos) {
    btnVerHistorialPagos.addEventListener("click", (e) => {
        e.preventDefault();
        loadHistorialPagos(historialPagosData); 
        showSection('pagosHistorial', 'Historial de Pagos Realizados');
    });
}
if (btnVolverPagosHistorial) {
    btnVolverPagosHistorial.addEventListener("click", (e) => {
        e.preventDefault();
        showSection('pagosLista', 'Gestión de Pagos Pendientes');
    });
}


function loadHistorialPagos(data) {
    const tablaBody = document.querySelector("#tablaHistorialPagos tbody");
    tablaBody.innerHTML = "";
    
    const pagosCompletados = Object.entries(data || {})
        .filter(([key, pago]) => pago.estado === 'PAGADO_COMPLETADO')
        .sort((a, b) => new Date(b[1].fechaPago) - new Date(a[1].fechaPago)); 
    
    if (pagosCompletados.length === 0) {
        document.getElementById("noPagosHistorial").style.display = 'block';
        return;
    }
    document.getElementById("noPagosHistorial").style.display = 'none';

    pagosCompletados.forEach(([key, pago]) => {
        const cliente = clientesData[pago.clienteId] || {};
        const clienteNombre = (cliente.nombre ? `${cliente.nombre} ${cliente.apellidoPaterno ?? ''}` : 'N/A').trim();
        
        const fechaHora = new Date(pago.fechaPago).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${key.substring(0, 8)}...</td>
            <td>${fechaHora}</td>
            <td>${clienteNombre}</td>
            <td>$${parseFloat(pago.montoTotal || 0).toFixed(2)}</td>
            <td>${pago.metodoPago || 'Efectivo'}</td>
            <td>
                <button class="view-pago view-btn" data-id="${key}"><i class="fas fa-receipt"></i> Ver Ticket</button>
            </td>`; 
        tablaBody.appendChild(tr);
    });

    tablaBody.querySelectorAll(".view-pago").forEach(button => {
        button.addEventListener("click", (e) => {
            const pagoId = e.target.closest('button').dataset.id;
            const pago = historialPagosData[pagoId];
            showPagoDetailsModal(pagoId, pago);
        });
    });
}

function showPagoDetailsModal(pagoId, pago) {
    const cliente = clientesData[pago.clienteId] || {};
    const mascota = mascotasData[pago.mascotaId] || {};
    const recepcionista = empleadosData[pago.recepcionistaKey] || {};
    const clienteNombre = `${cliente.nombre || 'N/A'} ${cliente.apellidoPaterno || ''} ${cliente.apellidoMaterno || ''}`;
    const recepcionistaNombre = `${recepcionista.nombre || 'N/A'} ${recepcionista.apellidoPaterno || ''}`;
    const fechaPago = new Date(pago.fechaPago).toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' });
    
    let serviciosHtml = '';
    
    if (pago.detallesCobro.costoServicio > 0) {
        serviciosHtml += `
            <tr>
                <td>${pago.detallesCobro.servicioOriginal || 'Servicio de Cita'}</td>
                <td>1</td>
                <td>$${parseFloat(pago.detallesCobro.costoServicio).toFixed(2)}</td>
                <td>$${parseFloat(pago.detallesCobro.costoServicio).toFixed(2)}</td>
            </tr>`;
    }
    
    const productos = pago.detallesCobro.productosCobro || {};
    for (const item of Object.values(productos)) {
        const subtotal = item.cantidad * item.precioUnitario;
        serviciosHtml += `
            <tr>
                <td>Producto: ${item.nombre}</td>
                <td>${item.cantidad}</td>
                <td>$${parseFloat(item.precioUnitario).toFixed(2)}</td>
                <td>$${subtotal.toFixed(2)}</td>
            </tr>`;
    }

    const modalContent = `
        <h3 style="text-align: center; border-bottom: 2px solid #007bff; padding-bottom: 5px;">TICKET DE PAGO</h3>
        <p><strong>Folio ID:</strong> ${pagoId.substring(0, 10)}</p>
        <p><strong>Fecha/Hora:</strong> ${fechaPago}</p>
        <p><strong>Atendió:</strong> ${recepcionistaNombre.trim()}</p>
        <hr>
        <h4>Datos del Cliente</h4>
        <p><strong>Cliente:</strong> ${clienteNombre.trim()}</p>
        <p><strong>Mascota:</strong> ${mascota.nombre || 'N/A'}</p>
        <p><strong>Cita Ref:</strong> ${pago.citaId.substring(0, 8)}...</p>
        <hr>
        <h4>Detalle de Cobro</h4>
        <table class="table-detalle-cobro" style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
            <thead>
                <tr><th>Descripción</th><th>Cant.</th><th>P. Unitario</th><th>Subtotal</th></tr>
            </thead>
            <tbody>${serviciosHtml}</tbody>
        </table>
        
        <h3 style="text-align: right; margin-top: 20px;">TOTAL: <span style="color: #007bff;">$${parseFloat(pago.montoTotal).toFixed(2)}</span></h3>
        <p style="text-align: right;">Método: ${pago.metodoPago || 'Efectivo'}</p>
        <p style="text-align: right;">Recibido: $${parseFloat(pago.montoRecibido).toFixed(2)}</p>
        <p style="text-align: right; color: ${pago.cambio >= 0 ? '#28a745' : '#dc3545'}; font-weight: bold;">CAMBIO: $${parseFloat(pago.cambio).toFixed(2)}</p>
    `;
    
    detalleContenido.innerHTML = modalContent;
    citaDetailModal.style.display = 'flex';
}

document.addEventListener('DOMContentLoaded', () => {
    populateClienteMascotaSelects();
    populateServiciosSelect();
    especieMascotaSelect.dispatchEvent(new Event('change'));
    
    showSection("inicio", "Inicio");
});