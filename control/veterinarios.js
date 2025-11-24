import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, onValue, update, get, query, orderByChild, equalTo, push } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyCZYL4A1Zz7Lq66Y6kjXZ4-eDUBz8asLcM",
    authDomain: "clinipet-huellitas.firebaseapp.com",
    databaseURL: "https://clinipet-huellitas-default-rtdb.firebaseio.com",
    projectId: "clinipet-huellitas",
    storageBucket: "clinipet-huellitas.firebaseapp.com",
    messagingSenderId: "176529254321",
    appId: "1:176529254321:web:dfa78ed74a62fa75277f90",
    measurementId: "G-YXV11P7FJB"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth();
let veterinarioIdLogueado = null; 
let veterinarioData = null;
let clientesData = {};
let mascotasData = {};
let serviciosData = {};
let citasDataGlobal = {};
let expedientesData = {};
let inventarioData = {}; 
let empleadosData = {}; 

const sections = document.querySelectorAll(".section");
const tituloSeccion = document.getElementById("tituloSeccion");
const sidebar = document.getElementById("sidebar");
const toggleMenu = document.getElementById("toggleMenu");
const logoutBtn = document.getElementById("logoutBtn");
const citasDiaVeterinario = document.getElementById("citasDiaVeterinario");
const pacientesTotales = document.getElementById("pacientesTotales");
const expedientesGuardados = document.getElementById("expedientesGuardados");
const citasProximaSemanaVeterinario = document.getElementById("citasProximaSemanaVeterinario");
const tablaCitasBodyHoy = document.querySelector("#tablaCitasVeterinarioHoy tbody"); 
const tablaCitasBodyProximas = document.querySelector("#tablaCitasVeterinarioProximas tbody"); 
const noCitasProximas = document.getElementById("noCitasProximas");
const tablaPacientesBody = document.querySelector("#tablaPacientesHistorial tbody");
const noPacientesAsignados = document.getElementById("noPacientesAsignados");
const formHistorial = document.getElementById("formHistorial");
const btnCancelarHistorial = document.getElementById("btnCancelarHistorial");
const btnVolverHistorialLista = document.getElementById("btnVolverHistorialLista");
const expedientesContainer = document.getElementById("expedientesContainer");
const tituloVistaExpediente = document.getElementById("tituloVistaExpediente");
const tablaDispensacionBody = document.querySelector("#tablaDispensacion tbody");
const btnAddMedicamento = document.getElementById("btnAddMedicamento");
const historialTratamientoNotas = document.getElementById("historialTratamientoNotas");
const formInsumosRapidos = document.getElementById("formInsumosRapidos");

function showSection(targetId, title) {
    sections.forEach(s => s.classList.remove("active"));
    const targetSection = document.getElementById(targetId);
    if (targetSection) {
        targetSection.classList.add("active");
        tituloSeccion.textContent = title;
        if (targetId === 'insumosFarmacia') {
            loadFormInsumosRapidos(); 
        }
    }
    document.querySelectorAll(".menu a").forEach(link => link.classList.remove("active"));
    const link = document.querySelector(`[data-target="${targetId}"]`);
    if (link) link.classList.add("active");
    sidebar.classList.remove("open");
}
function parseDateParts(dateStr) {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split("-").map(Number);
    return { year: y, monthIndex: m - 1, day: d };
}
function isSameLocalDay(dateStr, todayDateObj = new Date()) {
    const parts = parseDateParts(dateStr);
    if (!parts) return false;
    return parts.year === todayDateObj.getFullYear()
        && parts.monthIndex === todayDateObj.getMonth()
        && parts.day === todayDateObj.getDate();
}
function getInventarioOptions(selectedKey = null) {
    let options = `<option value="">Seleccione un ítem</option>`;
    const items = Object.entries(inventarioData || {}) 
        .filter(([key, item]) => item && item.stock > 0 && item.activo !== false) 
        .sort((a, b) => a[1].nombre.localeCompare(b[1].nombre));
    items.forEach(([key, item]) => {
        const selected = key === selectedKey ? 'selected' : '';
        const stockInfo = item.stock !== undefined ? ` (Stock: ${item.stock})` : '';
        options += `<option value="${key}" ${selected}>${item.nombre}${stockInfo}</option>`;
    });
    return options;
}
function addMedicamentoRow(data = {}) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>
            <select class="form-control item-id" required>
                ${getInventarioOptions(data.itemId)}
            </select>
        </td>
        <td><input type="text" class="form-control dosis-desc" value="${data.dosisDesc || ''}" placeholder="Dosis o Descripción" required></td>
        <td><input type="number" class="form-control cantidad-disp" value="${data.cantidad || 1}" min="1" required style="width: 80px;"></td>
        <td><button type="button" class="btn-remove-row btn-cancel"><i class="fas fa-trash"></i></button></td>
    `;
    tablaDispensacionBody.appendChild(tr);
    tr.querySelector('.btn-remove-row').addEventListener('click', (e) => {
        e.target.closest('tr').remove();
        if (tablaDispensacionBody.querySelectorAll('tr').length === 0) {
            addMedicamentoRow();
        }
    });
}
function handleCompleteCita(key, cita) {
    showHistorialForm(cita.mascotaId, "Comenzar Nuevo Expediente", null, key); 
}

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "../index.html";
        return;
    }
    veterinarioIdLogueado = user.uid;
    try {
        let empleadoKey = null;
        const usuariosRef = ref(db, "usuarios");
        const usuariosQuery = query(usuariosRef, orderByChild("uid"), equalTo(veterinarioIdLogueado));
        const usuariosSnap = await get(usuariosQuery);
        if (usuariosSnap.exists()) {
            const entry = Object.entries(usuariosSnap.val())[0];
            const usuarioData = entry[1];
            empleadoKey = usuarioData.empleadoKey || null;
            if (usuarioData.rol !== 'veterinario') {
                 throw new Error("El rol de usuario autenticado no es 'veterinario'.");
            }
        } else {
            throw new Error("Usuario no encontrado o no vinculado en la tabla 'usuarios'.");
        }
        if (empleadoKey) {
            const empleadoSnap = await get(ref(db, `empleados/${empleadoKey}`));
            if (empleadoSnap.exists()) {
                veterinarioData = empleadoSnap.val();
                veterinarioData.dbKey = empleadoKey; 
            } else {
                 throw new Error("EmpleadoKey encontrado, pero no se hallaron datos en la tabla 'empleados'.");
            }
        }
        if (veterinarioData && veterinarioData.rol === 'veterinario') {
            document.getElementById("nombreUsuario").textContent = `Dr/Dra. ${veterinarioData.nombre} ${veterinarioData.apellidoPaterno || ''}`;
            startDataListeners();
            showSection("inicio", "Inicio");
        } else {
            console.error("Acceso denegado. Rol de empleado incorrecto:", veterinarioData);
            alert("Acceso denegado. Tu cuenta no tiene el rol 'veterinario'.");
            await signOut(auth);
            window.location.href = "../index.html";
        }
    } catch (error) {
        console.error("Error al autenticar/leer datos:", error);
        alert("Error de conexión o permisos.");
        try { await signOut(auth); } catch(e){ console.warn("SignOut falló", e); }
        window.location.href = "../index.index.html";
    }
});

let isInitialDataLoaded = { clientes: false, mascotas: false, expedientes: false };

function checkAndLoadHistorial() {
    if (isInitialDataLoaded.clientes && isInitialDataLoaded.mascotas && isInitialDataLoaded.expedientes) {
        loadHistorialPacientes();
    }
}

function startDataListeners() {
    onValue(ref(db, "empleados"), (snapshot) => { empleadosData = snapshot.val() || {}; });
    
    onValue(ref(db, "clientes"), (snapshot) => { 
        clientesData = snapshot.val() || {}; 
        isInitialDataLoaded.clientes = true; 
        checkAndLoadHistorial();
    });
    
    onValue(ref(db, "mascotas"), (snapshot) => { 
        mascotasData = snapshot.val() || {}; 
        isInitialDataLoaded.mascotas = true;
        checkAndLoadHistorial();
    });
    
    onValue(ref(db, "expedientes"), (snapshot) => { 
        expedientesData = snapshot.val() || {}; 
        expedientesGuardados.textContent = Object.keys(expedientesData).length; 
        isInitialDataLoaded.expedientes = true;
        checkAndLoadHistorial(); 
    });
    
    onValue(ref(db, "inventario"), (snapshot) => { inventarioData = snapshot.val() || {}; loadFormInsumosRapidos(); }); 
    const citasRef = ref(db, "citas");
    const citasQuery = query(citasRef, orderByChild("veterinarioId"), equalTo(veterinarioData.dbKey));
    onValue(citasQuery, (snapshot) => {
        citasDataGlobal = snapshot.val() || {};
        loadCitasDashboard(citasDataGlobal);
        loadCitasProgramadas(citasDataGlobal);
    });
}

function loadCitasDashboard(citasData) {
    const todayObj = new Date();
    const citasEntries = citasData && typeof citasData === 'object' ? Object.entries(citasData) : [];
    const citasHoyPendientes = citasEntries
        .filter(([key, cita]) => isSameLocalDay(cita.fecha, todayObj) && cita.estadoCita === 'Pendiente');
    citasDiaVeterinario.textContent = citasHoyPendientes.length;
    const now = new Date();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    citasProximaSemanaVeterinario.textContent = citasEntries
        .filter(([key, cita]) => {
            const parts = parseDateParts(cita.fecha);
            if (!parts) return false;
            const citaDate = new Date(parts.year, parts.monthIndex, parts.day);
            return citaDate > now && (citaDate.getTime() - now.getTime()) < oneWeek && cita.estadoCita === 'Pendiente';
        }).length;
}

function loadCitasProgramadas(citasData) {
    tablaCitasBodyHoy.innerHTML = "";
    tablaCitasBodyProximas.innerHTML = "";
    const todayObj = new Date();
    const citasEntries = citasData && typeof citasData === 'object' ? Object.entries(citasData) : [];
    const citasHoy = [];
    const citasProximas = [];
    citasEntries
        .sort((a, b) => {
            const dateA = new Date(`${a[1].fecha}T${a[1].hora || '00:00'}`);
            const dateB = new Date(`${b[1].fecha}T${b[1].hora || '00:00'}`);
            return dateA - dateB;
        })
        .forEach(([key, cita]) => {
            if (isSameLocalDay(cita.fecha, todayObj) && cita.estadoCita === 'Pendiente') {
                citasHoy.push([key, cita]);
            } else if (cita.estadoCita === 'Pendiente' || cita.estadoCita === 'Programada') {
                 citasProximas.push([key, cita]);
            }
        });

    if (citasHoy.length === 0) {
        document.getElementById("noCitasDiaVeterinario").style.display = 'block';
        tablaCitasBodyHoy.innerHTML = `<tr><td colspan="6" style="text-align:center;"></td></tr>`;
    } else {
        document.getElementById("noCitasDiaVeterinario").style.display = 'none';
        citasHoy.forEach(([key, cita]) => {
            const cliente = clientesData[cita.clienteId] || {};
            const mascota = mascotasData[cita.mascotaId] || {};
            const clienteNombre = (cliente.nombre ? `${cliente.nombre} ${cliente.apellidoPaterno ?? ''}` : 'N/A').trim();
            const mascotaNombre = mascota.nombre || 'N/A';
            const servicioNombre = serviciosData[cita.servicioId]?.nombre || cita.servicio || 'N/A';
            const estado = cita.estadoCita || 'Pendiente';
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${cita.hora || 'N/A'}</td>
                <td>${clienteNombre}</td>
                <td>${mascotaNombre}</td>
                <td>${servicioNombre}</td>
                <td><span class="status-${estado.toLowerCase()}">${estado}</span></td>
                <td>
                    <button class="complete-cita complete-btn" data-citaid="${key}"><i class="fas fa-check-circle"></i> Terminar Cita</button> 
                </td>`; 
            tablaCitasBodyHoy.appendChild(tr);
        });
        tablaCitasBodyHoy.querySelectorAll(".complete-cita").forEach(button => {
            button.addEventListener("click", (e) => {
                const key = e.target.closest('button').dataset.citaid;
                handleCompleteCita(key, citasData[key]); 
            });
        });
    }

    if (citasProximas.length === 0) {
        noCitasProximas.style.display = 'block';
    } else {
        noCitasProximas.style.display = 'none';
        citasProximas.forEach(([key, cita]) => {
            const cliente = clientesData[cita.clienteId] || {};
            const mascota = mascotasData[cita.mascotaId] || {};
            const clienteNombre = (cliente.nombre ? `${cliente.nombre} ${cliente.apellidoPaterno ?? ''}` : 'N/A').trim();
            const mascotaNombre = mascota.nombre || 'N/A';
            const servicioNombre = serviciosData[cita.servicioId]?.nombre || cita.servicio || 'N/A';
            const estado = cita.estadoCita || 'Pendiente';
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${key.substring(0, 5)}...</td>
                <td>${cita.fecha || 'N/A'}</td>
                <td>${cita.hora || 'N/A'}</td>
                <td>${clienteNombre}</td>
                <td>${mascotaNombre}</td>
                <td>${servicioNombre}</td>
                <td>$${parseFloat(cita.costo || 0).toFixed(2)}</td>
                <td><span class="status-${estado.toLowerCase()}">${estado}</span></td>`; 
            tablaCitasBodyProximas.appendChild(tr);
        });
    }
}

function loadHistorialPacientes() {
    tablaPacientesBody.innerHTML = "";
    
    const mascotasConExpediente = new Set();
    Object.values(expedientesData).forEach(exp => {
        if (exp.veterinarioId === veterinarioData.dbKey) {
            mascotasConExpediente.add(exp.mascotaId);
        }
    });

    const mascotasFiltradas = Array.from(mascotasConExpediente)
        .map(mascotaId => [mascotaId, mascotasData[mascotaId]])
        .filter(([key, masc]) => masc); 
    
    pacientesTotales.textContent = mascotasFiltradas.length;
    
    if (mascotasFiltradas.length === 0) {
        noPacientesAsignados.style.display = 'block';
        return;
    }
    
    noPacientesAsignados.style.display = 'none';
    
    mascotasFiltradas.forEach(([key, masc]) => {
        
        let clienteKey = masc.duenoId; 
        let dueno = null;

        if (clienteKey) {
            
            dueno = clientesData[clienteKey];

            if (!dueno && clienteKey.startsWith('-')) {
                const clienteKeyLimpia = clienteKey.substring(1); 
                dueno = clientesData[clienteKeyLimpia];
            }
        }
        
        const duenoNombre = dueno 
            ? `${dueno.nombre} ${dueno.apellidoPaterno || ''}`.trim() 
            : 'N/A';
            
        const countExpedientes = Object.values(expedientesData).filter(exp => exp.mascotaId === key).length;
        
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${key.substring(0, 5)}...</td>
            <td>${masc.nombre}</td>
            <td>${masc.especie} / ${masc.raza}</td>
            <td>${duenoNombre}</td>
            <td>${countExpedientes}</td>
            <td>
                <button class="continue-expediente edit-btn" data-id="${key}"><i class="fas fa-folder-open"></i> Ver Expedientes</button>
            </td>`; 
        tablaPacientesBody.appendChild(tr);
    });
    
    tablaPacientesBody.querySelectorAll(".continue-expediente").forEach(button => {
        button.addEventListener("click", (e) => {
            e.preventDefault(); 
            const mascotaId = button.dataset.id; 
            if(mascotaId) {
                loadExpedientes(mascotaId);
            }
        });
    });
}


function showHistorialForm(mascotaId, title, expedienteData = null, citaId = null, expedienteKey = null) {
    const mascota = mascotasData[mascotaId];
    if (!mascota) return;
    formHistorial.reset();
    tablaDispensacionBody.innerHTML = ''; 
    document.getElementById("expedienteMascotaId").value = mascotaId;
    document.getElementById("expedienteCitaId").value = citaId || ''; 
    document.getElementById("historialNombreMascota").value = mascota.nombre;
    document.getElementById("tituloFormHistorial").textContent = title;

    if (expedienteData) {
        document.getElementById("expedienteId").value = expedienteKey;
        document.getElementById("historialFecha").value = expedienteData.fecha || '';
        document.getElementById("historialMotivo").value = expedienteData.motivo || '';
        document.getElementById("historialDiagnostico").value = expedienteData.diagnostico || '';
        document.getElementById("historialTratamientoNotas").value = expedienteData.tratamientoNotas || ''; 
        if (expedienteData.itemsDispensados && Array.isArray(expedienteData.itemsDispensados)) {
            expedienteData.itemsDispensados.forEach(item => {
                addMedicamentoRow({
                    itemId: item.itemId,
                    dosisDesc: item.dosisDesc,
                    cantidad: item.cantidad
                });
            });
        } else {
            addMedicamentoRow(); 
        }
    } else {
        document.getElementById("expedienteId").value = "";
        document.getElementById("historialFecha").value = new Date().toISOString().split('T')[0];
        addMedicamentoRow(); 
    }
    showSection('historialFormulario', title);
}

function loadExpedientes(mascotaId) {
    const mascota = mascotasData[mascotaId];
    if (!mascota) return;
    tituloVistaExpediente.textContent = `Historial Completo de ${mascota.nombre}`;
    expedientesContainer.innerHTML = '';
    
    let noExpedientesMsg = document.getElementById('noExpedientes');
    if (!noExpedientesMsg) {
        noExpedientesMsg = document.createElement('div');
        noExpedientesMsg.id = 'noExpedientes';
        noExpedientesMsg.style.cssText = "text-align: center; margin-top: 20px; color: #555; display:none;";
        noExpedientesMsg.textContent = "No hay expedientes registrados para este paciente por el veterinario actual.";
        expedientesContainer.appendChild(noExpedientesMsg);
    }
    
    const expedientesMascota = Object.entries(expedientesData)
        .filter(([key, exp]) => exp.mascotaId === mascotaId)
        .sort((a, b) => new Date(b[1].fecha) - new Date(a[1].fecha));

    if (expedientesMascota.length === 0) {
        noExpedientesMsg.style.display = 'block';
    } else {
        noExpedientesMsg.style.display = 'none';
        expedientesMascota.forEach(([key, exp]) => {
            const esVeterinarioActual = exp.veterinarioId === veterinarioData.dbKey;
            const vetInfo = empleadosData[exp.veterinarioId]; 
            const vetNombre = vetInfo ? `Dr/Dra. ${vetInfo.nombre} ${vetInfo.apellidoPaterno || ''}` : 'Veterinario Desconocido';
            const fechaExpediente = exp.fecha || 'N/A';
            const card = document.createElement('div');
            card.className = 'form-card expediente-card';
            
            let itemsHtml = '';
            const items = exp.itemsDispensados || []; 
            const tratamientoNotas = exp.tratamientoNotas || exp.tratamiento || 'N/A';
            
            if (items.length > 0) {
                itemsHtml = `
                    <div class="expediente-items">
                        <h4>Insumos/Medicamentos Registrados:</h4>
                        <ul>
                            ${items.map(item => `
                                <li>
                                    <strong>${item.nombreItem || 'N/A'}</strong>: 
                                    ${item.cantidad || 0} unidad(es). 
                                    Dosis/Nota: ${item.dosisDesc || 'N/A'}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                `;
            }
            
            card.innerHTML = `
                <div class="expediente-header">
                    <h3>Consulta del ${fechaExpediente}</h3>
                    <p>Atendido por: ${vetNombre}</p>
                    <p class="small-text">Expediente ID: ${key.substring(0, 8)}</p>
                    ${exp.citaId ? `<p class="small-text">Referencia Cita ID: ${exp.citaId.substring(0, 8)}</p>` : ''}
                </div>
                <hr>
                <div class="expediente-body">
                    <p><strong>Motivo de la Consulta:</strong> ${exp.motivo || 'N/A'}</p>
                    <p><strong>Diagnóstico:</strong> ${exp.diagnostico || 'N/A'}</p>
                    <p><strong>Notas de Tratamiento:</strong> ${tratamientoNotas}</p>
                    ${itemsHtml}
                </div>
                ${esVeterinarioActual ? `<div class="expediente-footer"><button class="edit-btn edit-expediente" data-expedienteid="${key}"><i class="fas fa-edit"></i> Editar Entrada</button></div>` : ''}
            `;
            expedientesContainer.appendChild(card);
        });

        expedientesContainer.querySelectorAll(".edit-expediente").forEach(button => {
            button.addEventListener("click", (e) => {
                const key = e.target.closest('button').dataset.expedienteid;
                const expData = expedientesData[key];
                showHistorialForm(expData.mascotaId, "Editar Expediente", expData, expData.citaId, key);
            });
        });
    }
    showSection('vistaExpediente', `Historial Médico`);
}

formHistorial.addEventListener("submit", async (e) => {
    e.preventDefault();
    const mascotaId = document.getElementById("expedienteMascotaId").value;
    const citaId = document.getElementById("expedienteCitaId").value; 
    const expedienteKey = document.getElementById("expedienteId").value;
    const mascota = mascotasData[mascotaId] || { nombre: 'Paciente' };
    const itemsDispensados = [];
    let errorInventario = false;

    tablaDispensacionBody.querySelectorAll('tr').forEach(tr => {
        const itemId = tr.querySelector('.item-id').value;
        const dosisDesc = tr.querySelector('.dosis-desc').value.trim();
        const cantidad = parseInt(tr.querySelector('.cantidad-disp').value, 10);
        
        if (itemId && cantidad > 0) {
             const itemData = inventarioData[itemId];
             if (!itemData) {
                alert(`Error: El ítem con ID ${itemId} no se encuentra en el inventario.`);
                errorInventario = true;
                return;
             }
             if (cantidad > itemData.stock) {
                 alert(`Error: La cantidad de ${itemData.nombre} (${cantidad}) excede el stock disponible (${itemData.stock}). Por favor, ajuste.`);
                 errorInventario = true;
                 return; 
             }
            itemsDispensados.push({
                itemId: itemId,
                nombreItem: itemData.nombre,
                cantidad: cantidad,
                dosisDesc: dosisDesc,
                precioVenta: itemData.precioVenta || 0 
            });
        }
    });

    if (errorInventario) return;

    const datosExpediente = {
        mascotaId: mascotaId,
        veterinarioId: veterinarioData.dbKey,
        fecha: document.getElementById("historialFecha").value,
        motivo: document.getElementById("historialMotivo").value,
        diagnostico: document.getElementById("historialDiagnostico").value,
        tratamientoNotas: historialTratamientoNotas.value, 
        itemsDispensados: itemsDispensados.length > 0 ? itemsDispensados : null, 
        citaId: citaId || null 
    };

    try {
        let finalExpedienteKey = expedienteKey;
        const updates = {};
        let isNewExpediente = !expedienteKey;

        if (expedienteKey) {
            updates[`expedientes/${expedienteKey}`] = datosExpediente;
        } else {
            const newExpedienteRef = push(ref(db, `expedientes`), { ...datosExpediente, creadoEn: new Date().toISOString() });
            finalExpedienteKey = newExpedienteRef.key;
            updates[`expedientes/${finalExpedienteKey}`] = { ...datosExpediente, creadoEn: new Date().toISOString() };
        }
        
        if (citaId && isNewExpediente) {
            const citaOriginal = citasDataGlobal[citaId];
            const costoServicio = parseFloat(citaOriginal?.costo || 0);
            let costoInsumos = 0;
            const productosCobro = {};

            for (const item of itemsDispensados) {
                const itemData = inventarioData[item.itemId];
                const nuevoStock = itemData.stock - item.cantidad;
                
                updates[`inventario/${item.itemId}/stock`] = nuevoStock; 
                
                costoInsumos += (item.cantidad * parseFloat(item.precioVenta));
                
                productosCobro[item.itemId] = { 
                    nombre: item.nombreItem,
                    cantidad: item.cantidad,
                    precioUnitario: item.precioVenta,
                    dosisDesc: item.dosisDesc
                };
            }

            const costoTotal = costoServicio + costoInsumos;
            
            updates[`citas/${citaId}/estadoCita`] = 'Completada';
            updates[`citas/${citaId}/expedienteId`] = finalExpedienteKey;
            updates[`citas/${citaId}/completadaEn`] = new Date().toISOString();

            const pagoPendienteRef = push(ref(db, `pagosPendientes`));
            updates[`pagosPendientes/${pagoPendienteRef.key}`] = {
                citaId: citaId,
                expedienteId: finalExpedienteKey,
                clienteId: citaOriginal?.clienteId,
                mascotaId: mascotaId,
                veterinarioKey: veterinarioData.dbKey,
                servicioOriginal: citaOriginal?.servicio,
                costoServicio: costoServicio,
                costoInsumos: costoInsumos,
                costoTotal: costoTotal,
                fechaCita: citaOriginal?.fecha,
                estado: 'PENDIENTE_COBRO',
                productosCobro: productosCobro,
                creadoEn: new Date().toISOString()
            };
            
            alert(`Expediente guardado. Stock descontado. Pago de $${costoTotal.toFixed(2)} registrado como PENDIENTE de cobro.`);

        } else if (expedienteKey) {
            alert(`Expediente de ${mascota.nombre} actualizado con éxito. Si modificó ítems, el stock debe ajustarse manualmente.`);
        } else {
             alert(`Expediente de ${mascota.nombre} guardado con éxito. Nota: Este expediente no estaba asociado a una cita.`);
        }

        if (Object.keys(updates).length > 0) {
             await update(ref(db), updates);
        }

        loadExpedientes(mascotaId); 
    } catch (error) {
        console.error("Error al guardar/actualizar:", error);
        alert("Error de guardado: " + error.message);
    }
});

btnAddMedicamento.addEventListener('click', () => addMedicamentoRow());
toggleMenu.addEventListener("click", () => sidebar.classList.toggle("open"));

document.querySelectorAll('.menu a, #btnVolverListaHistorial, #btnVolverHistorialLista').forEach(boton => {
    boton.addEventListener("click", (e) => {
        e.preventDefault();
        const targetId = boton.dataset.target || 'inicio';
        let title;
        if (targetId === 'inicio') title = 'Inicio';
        else if (targetId === 'citasProgramadasLista') title = 'Citas Programadas';
        else if (targetId === 'historialPacienteLista') title = 'Historial Paciente'; 
        else if (targetId === 'insumosFarmacia') title = 'Insumos y Farmacia'; 
        showSection(targetId, title);
    });
});

logoutBtn.addEventListener("click", async () => {
    try {
        await signOut(auth);
        window.location.href = "../index.html"; 
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
        alert("Hubo un error al cerrar la sesión.");
    }
});

function loadFormInsumosRapidos() {
    formInsumosRapidos.innerHTML = `
        <div class="form-grid-2">
            <div class="form-group">
                <label>Fecha de Solicitud:</label>
                <input type="date" id="consumoFecha" value="${new Date().toISOString().split('T')[0]}" required>
            </div>
            <div class="form-group">
                <label>Descripción / Motivo de Solicitud:</label>
                <input type="text" id="consumoMotivo" placeholder="Ej: Reposición de materiales en consultorio 1 o 2" required>
            </div>
        </div>     
        <h4 style="margin-top: 20px;"><i class="fas fa-hand-holding-medical"></i> Solicitud de Ítems</h4>
        <div id="contenedorInsumosRapidos" class="table-responsive">
            <table id="tablaConsumoRapido" class="tabla-dinamica">
                <thead>
                    <tr>
                        <th>Medicamento / Insumo</th>
                        <th>Cantidad Solicitada</th>
                        <th><button type="button" class="btn-add-row" id="btnAddConsumoItem"><i class="fas fa-plus"></i></button></th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
        <div class="form-buttons-full" style="margin-top: 20px;">
            <button type="submit" class="btn-main"><i class="fas fa-save"></i> Registrar Solicitud</button>
        </div>
    `;
    const tablaConsumoRapidoBody = formInsumosRapidos.querySelector("#tablaConsumoRapido tbody");
    const btnAddConsumoItem = formInsumosRapidos.querySelector("#btnAddConsumoItem");
    
    function addConsumoItemRow() {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <select class="form-control consumo-item-id" required>
                    ${getInventarioOptions(null)} 
                </select>
            </td>
            <td><input type="number" class="form-control consumo-cantidad" value="1" min="1" required style="width: 100px;"></td>
            <td><button type="button" class="btn-remove-row btn-cancel"><i class="fas fa-trash"></i></button></td>
        `;
        tablaConsumoRapidoBody.appendChild(tr);
        tr.querySelector('.btn-remove-row').addEventListener('click', (e) => {
            if (tablaConsumoRapidoBody.querySelectorAll('tr').length > 1) {
                e.target.closest('tr').remove();
            } else {
                alert("Debe haber al menos un ítem para registrar la solicitud.");
            }
        });
    }

    if (tablaConsumoRapidoBody.querySelectorAll('tr').length === 0) {
        addConsumoItemRow();
    } else {
        tablaConsumoRapidoBody.querySelectorAll('.consumo-item-id').forEach(select => {
            const selectedValue = select.value;
            select.innerHTML = getInventarioOptions(selectedValue);
        });
    }

    btnAddConsumoItem.addEventListener('click', addConsumoItemRow);   
    formInsumosRapidos.removeEventListener("submit", handleConsumoRapidoSubmit); 
    formInsumosRapidos.addEventListener("submit", handleConsumoRapidoSubmit);
}

async function handleConsumoRapidoSubmit(e) {
    e.preventDefault();
    const fecha = document.getElementById("consumoFecha").value;
    const motivo = document.getElementById("consumoMotivo").value;
    const tablaConsumoRapidoBody = document.querySelector("#tablaConsumoRapido tbody");
    const itemsConsumidos = {}; 
    let errorInventario = false;    
    let itemsValidos = false;

    tablaConsumoRapidoBody.querySelectorAll('tr').forEach(tr => {
        const itemId = tr.querySelector('.consumo-item-id').value;
        const cantidad = parseInt(tr.querySelector('.consumo-cantidad').value, 10);

        if (itemId && cantidad > 0) {
            itemsValidos = true;
            const itemData = inventarioData[itemId];
            if (!itemData) {
                alert(`Error: El ítem con ID ${itemId} no se encuentra en el inventario.`);
                errorInventario = true;
                return;
            }
            
            itemsConsumidos[itemId] = {
                cantidadSolicitada: cantidad,
                cantidadDespachada: 0, 
                nombre: itemData.nombre,
                precioVenta: itemData.precioVenta || 0,
                dosisDesc: motivo 
            };
        }
    });

    if (errorInventario) return;
    if (!itemsValidos) {
        alert("Debe seleccionar al menos un ítem y especificar una cantidad para la solicitud rápida.");
        return;
    }

    try {
        await push(ref(db, `dispensaciones`), {
            veterinarioKey: veterinarioData.dbKey, 
            expedienteId: 'SOLICITUD_RAPIDA',
            mascotaKey: null, 
            productos: itemsConsumidos, 
            fechaCreacion: new Date().toISOString(),
            motivoConsumo: motivo,
            fechaConsumo: fecha,
            estado: 'Pendiente_Farmacia' 
        });
        alert("Solicitud Rápida de Insumos enviada a Farmacia. Se descontará stock tras su aprobación.");
        formInsumosRapidos.reset();
        loadFormInsumosRapidos(); 
    } catch (error) {
        console.error("Error al generar la nota de Solicitud Rápida:", error);
        alert("Error al registrar la solicitud.");
    }
}