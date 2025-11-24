import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, push, onValue, update, get, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

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

let farmaceuticoIdLogueado = null;
let farmaceuticoData = null;
let inventarioData = {};
let dispensacionesData = {};
let veterinariosData = {};
let mascotasData = {};
let currentDispensacionKey = null;

const sections = document.querySelectorAll(".section");
const menuLinks = document.querySelectorAll(".menu a");
const tituloSeccion = document.getElementById("tituloSeccion");
const sidebar = document.getElementById("sidebar");
const toggleMenu = document.getElementById("toggleMenu");
const logoutBtn = document.getElementById("logoutBtn");

const inventarioTotal = document.getElementById("inventarioTotal");
const stockCritico = document.getElementById("stockCritico");
const dispensacionesPendientes = document.getElementById("dispensacionesPendientes");

const tablaInventarioBody = document.querySelector("#tablaInventario tbody");
const btnNuevoItem = document.getElementById("btnNuevoItem");
const formInventario = document.getElementById("formInventario");
const btnVolverInventario = document.getElementById("btnVolverInventario");
const btnCancelarItem = document.getElementById("btnCancelarItem");

const nombreItemSelect = document.getElementById("nombreItemSelect");
const nombreItemOtro = document.getElementById("nombreItemOtro");
const nombreItemOtroContainer = document.getElementById("nombreItemOtroContainer");
const unidadMedidaSelect = document.getElementById("unidadMedidaSelect");
const unidadMedidaOtro = document.getElementById("unidadMedidaOtro");
const unidadMedidaOtroContainer = document.getElementById("unidadMedidaOtroContainer");

const tablaDispensacionesBody = document.querySelector("#tablaDispensaciones tbody");
const noDispensaciones = document.getElementById("noDispensaciones");
const tablaDetalleDispensacionBody = document.querySelector("#tablaDetalleDispensacion tbody");
const formDespacho = document.getElementById("formDespacho");
const btnVolverDispensaciones = document.getElementById("btnVolverDispensaciones");
const btnRechazarDispensacion = document.getElementById("btnRechazarDispensacion");

function showSection(targetId, title) {
    sections.forEach(s => s.classList.remove("active"));
    const targetSection = document.getElementById(targetId);
    if (targetSection) {
        targetSection.classList.add("active");
        tituloSeccion.textContent = title;
    }
    menuLinks.forEach(link => link.classList.remove("active"));
    const link = document.querySelector(`[data-target="${targetId}"]`);
    if (link) link.classList.add("active");
    sidebar.classList.remove("open");
}

function formatDate(isoString) {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "../index.html";
        return;
    }

    farmaceuticoIdLogueado = user.uid;

    try {
        let empleadoKey = null;
        const usuariosRef = ref(db, "usuarios");
        const usuariosQuery = query(usuariosRef, orderByChild("uid"), equalTo(farmaceuticoIdLogueado));
        const usuariosSnap = await get(usuariosQuery);

        if (usuariosSnap.exists()) {
            const entry = Object.entries(usuariosSnap.val())[0];
            const usuarioData = entry[1];
            empleadoKey = usuarioData.empleadoKey || null;
            if (usuarioData.rol !== 'farmaceutico') {
                throw new Error("El rol de usuario autenticado no es 'farmaceutico'.");
            }
        } else {
            throw new Error("Usuario no encontrado o no vinculado en la tabla 'usuarios'.");
        }

        if (empleadoKey) {
            const empleadoSnap = await get(ref(db, `empleados/${empleadoKey}`));
            if (empleadoSnap.exists()) {
                farmaceuticoData = empleadoSnap.val();
                farmaceuticoData.dbKey = empleadoKey; 
            } else {
                throw new Error("EmpleadoKey encontrado, pero no se hallaron datos en la tabla 'empleados'.");
            }
        }
        
        if (farmaceuticoData && farmaceuticoData.rol === 'farmaceutico') {
            document.getElementById("nombreUsuario").textContent = `${farmaceuticoData.nombre} ${farmaceuticoData.apellidoPaterno || ''}`;
            await loadCatalogs();
            startDataListeners();
            showSection("inicio", "Inicio");
        } else {
            console.error("Acceso denegado. Rol de empleado incorrecto:", farmaceuticoData);
            alert("Acceso denegado. Tu cuenta no tiene el rol 'farmaceutico'.");
            await signOut(auth);
            window.location.href = "../index.html";
        }

    } catch (error) {
        console.error("Error al autenticar/leer datos:", error);
        alert("Error de conexión o permisos. Consulte el registro del navegador para más detalles.");
        try { await signOut(auth); } catch(e){ console.warn("SignOut falló", e); }
        window.location.href = "../index.html";
    }
});

async function loadCatalogs() {
    const vetSnap = await get(ref(db, "empleados"));
    veterinariosData = {};
    vetSnap.forEach(snap => {
        const vet = snap.val();
        if (vet.rol === 'veterinario') {
            veterinariosData[snap.key] = `${vet.nombre} ${vet.apellidoPaterno || ''}`;
        }
    });

    const mascSnap = await get(ref(db, "mascotas"));
    mascotasData = mascSnap.val() || {};
}

function startDataListeners() {
    onValue(ref(db, "inventario"), (snapshot) => { 
        inventarioData = snapshot.val() || {}; 
        loadInventarioTable(inventarioData);
        updateDashboard(inventarioData, dispensacionesData);
    });
    
    onValue(ref(db, "dispensaciones"), (snapshot) => { 
        dispensacionesData = snapshot.val() || {}; 
        loadDispensacionesTable(dispensacionesData);
        updateDashboard(inventarioData, dispensacionesData);
    });
}

function updateDashboard(inventario, dispensaciones) {
    const inventarioKeys = Object.keys(inventario).length;
    inventarioTotal.textContent = inventarioKeys;

    let criticoCount = 0;
    Object.values(inventario).forEach(item => {
        if (item.stock !== undefined && item.stockMinimo !== undefined && item.stock <= item.stockMinimo && item.activo !== false) {
            criticoCount++;
        }
    });
    stockCritico.textContent = criticoCount;

    // CORRECCIÓN 1: Contar solicitudes pendientes usando el estado 'Pendiente_Farmacia'
    const pendientesCount = Object.values(dispensaciones).filter(disp => disp.estado === 'Pendiente_Farmacia').length;
    dispensacionesPendientes.textContent = pendientesCount;
}


function loadInventarioTable(inventario) {
    tablaInventarioBody.innerHTML = "";
    const items = Object.entries(inventario || {}).sort((a, b) => a[1].nombre.localeCompare(b[1].nombre));

    items.forEach(([key, item]) => {
        const stockClass = (item.stock <= item.stockMinimo && item.activo !== false) ? 'status-pendiente' : 'status-completada';
        const activoText = item.activo !== false ? 'Sí' : 'No';
        
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${key.substring(0, 5)}...</td>
            <td>${item.nombre}</td>
            <td>${item.tipo}</td>
            <td><span class="${stockClass}">${item.stock}</span></td>
            <td>${item.unidadMedida}</td>
            <td>$${parseFloat(item.precioVenta || 0).toFixed(2)}</td>
            <td>${activoText}</td>
            <td>
                <button class="edit-item edit-btn" data-id="${key}"><i class="fas fa-edit"></i> Editar</button>
                <button class="delete-item delete-btn" data-id="${key}"><i class="fas fa-trash"></i> Baja</button>
            </td>`;
        tablaInventarioBody.appendChild(tr);
    });

    tablaInventarioBody.querySelectorAll(".edit-item").forEach(button => {
        button.addEventListener("click", (e) => {
            const key = e.currentTarget.dataset.id;
            showInventarioForm(key, inventario[key]);
        });
    });
    tablaInventarioBody.querySelectorAll(".delete-item").forEach(button => {
        button.addEventListener("click", (e) => {
            const key = e.currentTarget.dataset.id;
            handleDeleteItem(key, inventario[key]);
        });
    });
}

btnNuevoItem.addEventListener("click", () => showInventarioForm(null));
btnVolverInventario.addEventListener("click", () => showSection('inventarioLista', 'Inventario Productos'));
btnCancelarItem.addEventListener("click", () => showSection('inventarioLista', 'Inventario Productos'));

nombreItemSelect.addEventListener('change', () => {
    nombreItemOtroContainer.style.display = nombreItemSelect.value === 'Otro' ? 'flex' : 'none';
    nombreItemOtro.required = nombreItemSelect.value === 'Otro';
    if (nombreItemSelect.value !== 'Otro') nombreItemOtro.value = '';
});

unidadMedidaSelect.addEventListener('change', () => {
    unidadMedidaOtroContainer.style.display = unidadMedidaSelect.value === 'Otro' ? 'flex' : 'none';
    unidadMedidaOtro.required = unidadMedidaSelect.value === 'Otro';
    if (unidadMedidaSelect.value !== 'Otro') unidadMedidaOtro.value = '';
});

function showInventarioForm(key = null, data = {}) {
    formInventario.reset();
    document.getElementById("inventarioItemId").value = key || '';
    
    nombreItemOtroContainer.style.display = 'none';
    unidadMedidaOtroContainer.style.display = 'none';
    nombreItemOtro.required = false;
    unidadMedidaOtro.required = false;


    if (key) {
        document.getElementById("tituloInventarioForm").textContent = `Editar Producto: ${data.nombre}`;
        
        const isCommonName = Array.from(nombreItemSelect.options).some(opt => opt.value === data.nombre);
        
        if (isCommonName) {
            nombreItemSelect.value = data.nombre;
        } else {
            nombreItemSelect.value = 'Otro';
            nombreItemOtro.value = data.nombre || '';
            nombreItemOtroContainer.style.display = 'flex';
            nombreItemOtro.required = true;
        }

        const isCommonUnit = Array.from(unidadMedidaSelect.options).some(opt => opt.value === data.unidadMedida);

        if (isCommonUnit) {
            unidadMedidaSelect.value = data.unidadMedida;
        } else {
            unidadMedidaSelect.value = 'Otro';
            unidadMedidaOtro.value = data.unidadMedida || '';
            unidadMedidaOtroContainer.style.display = 'flex';
            unidadMedidaOtro.required = true;
        }

        document.getElementById("tipoItem").value = data.tipo || '';
        document.getElementById("stock").value = data.stock || 0;
        document.getElementById("precioVenta").value = data.precioVenta || 0;
        document.getElementById("stockMinimo").value = data.stockMinimo || 0;
        document.getElementById("descripcionItem").value = data.descripcionItem || '';
        document.getElementById("itemActivo").checked = data.activo !== false;
    } else {
        document.getElementById("tituloInventarioForm").textContent = "Crear Nuevo Producto de Inventario";
        document.getElementById("itemActivo").checked = true;
    }
    showSection('inventarioFormulario', 'Gestión de Producto');
}

formInventario.addEventListener("submit", async (e) => {
    e.preventDefault();
    const key = document.getElementById("inventarioItemId").value;
    
    let nombreFinal;
    if (nombreItemSelect.value === 'Otro') {
        nombreFinal = nombreItemOtro.value.trim();
    } else {
        nombreFinal = nombreItemSelect.value;
    }
    if (!nombreFinal) { alert("Error de validación: Por favor, ingrese o seleccione el nombre del producto."); return; }

    let unidadFinal;
    if (unidadMedidaSelect.value === 'Otro') {
        unidadFinal = unidadMedidaOtro.value.trim();
    } else {
        unidadFinal = unidadMedidaSelect.value;
    }
        if (!unidadFinal) { alert("Error de validación: Por favor, ingrese o seleccione la unidad de medida."); return; }

    const itemData = {
        nombre: nombreFinal, 
        tipo: document.getElementById("tipoItem").value,
        stock: parseInt(document.getElementById("stock").value, 10),
        unidadMedida: unidadFinal, 
        precioVenta: parseFloat(document.getElementById("precioVenta").value),
        stockMinimo: parseInt(document.getElementById("stockMinimo").value, 10),
        descripcionItem: document.getElementById("descripcionItem").value || "",
        activo: document.getElementById("itemActivo").checked
    };
    
    if (!itemData.tipo) { alert("Error de validación: El tipo de producto es obligatorio."); return; }

    try {
        if (key) {
            await update(ref(db, `inventario/${key}`), { ...itemData, ultimaActualizacion: new Date().toISOString() });
            alert(`Producto ${itemData.nombre} actualizado con éxito.`);
        } else {
            await push(ref(db, "inventario"), { ...itemData, creadoEn: new Date().toISOString() });
            alert(`Nuevo producto ${itemData.nombre} agregado al inventario.`);
        }
        showSection('inventarioLista', 'Inventario Productos');
    } catch (error) {
        console.error("FIREBASE ERROR AL GUARDAR PRODUCTO:", error);
        alert("Error al guardar producto. Consulte la consola para ver el detalle del error.");
    }
});

function handleDeleteItem(key, item) {
    if (confirm(`¿Está seguro de dar de BAJA el producto "${item.nombre}"? Esto lo marcará como inactivo.`)) {
        try {
            update(ref(db, `inventario/${key}`), { activo: false, dadoDeBaja: new Date().toISOString() });
            alert(`Producto "${item.nombre}" dado de baja (inactivo) correctamente.`);
        } catch (error) {
            console.error("Error al dar de baja producto:", error);
            alert("Error al dar de baja el producto.");
        }
    }
}

function loadDispensacionesTable(dispensaciones) {
    tablaDispensacionesBody.innerHTML = "";
    // CORRECCIÓN 2: Filtrar por el estado correcto 'Pendiente_Farmacia'
    const pendientes = Object.entries(dispensaciones || {})
        .filter(([key, disp]) => disp.estado === 'Pendiente_Farmacia')
        .sort((a, b) => new Date(a[1].fechaCreacion) - new Date(b[1].fechaCreacion));

    if (pendientes.length === 0) {
        noDispensaciones.style.display = 'block';
        return;
    }
    noDispensaciones.style.display = 'none';

    pendientes.forEach(([key, disp]) => {
        const veterinarioNombre = veterinariosData[disp.veterinarioKey] || 'Veterinario Desconocido';
        
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${key.substring(0, 5)}...</td>
            <td>${formatDate(disp.fechaCreacion)}</td>
            <td>${veterinarioNombre}</td>
            <td><span class="status-pendiente">${disp.estado}</span></td>
            <td>
                <button class="view-dispensacion view-btn" data-id="${key}"><i class="fas fa-eye"></i> Ver / Despachar</button>
            </td>`;
        tablaDispensacionesBody.appendChild(tr);
    });

    tablaDispensacionesBody.querySelectorAll(".view-dispensacion").forEach(button => {
        button.addEventListener("click", (e) => {
            const key = e.currentTarget.dataset.id;
            showDispensacionDetalle(key, dispensaciones[key]);
        });
    });
}

function showDispensacionDetalle(key, disp) {
    currentDispensacionKey = key;
    
    const veterinarioNombre = veterinariosData[disp.veterinarioKey] || 'Veterinario Desconocido';
    const pacienteNombre = disp.mascotaKey === 'SOLICITUD_RAPIDA' 
            ? `SOLICITUD RÁPIDA (${disp.motivoConsumo || 'N/A'})` 
            : mascotasData[disp.mascotaKey]?.nombre || 'Paciente No Encontrado';
    
    document.getElementById("dispensacionIdDetalle").textContent = key.substring(0, 8);
    document.getElementById("dispensacionFechaDetalle").textContent = formatDate(disp.fechaCreacion);
    document.getElementById("dispensacionVeterinarioDetalle").textContent = veterinarioNombre;
    document.getElementById("dispensacionPacienteDetalle").textContent = pacienteNombre;

    tablaDetalleDispensacionBody.innerHTML = "";

    
    if (disp.productos && typeof disp.productos === 'object' && !Array.isArray(disp.productos)) {
        Object.entries(disp.productos).forEach(([productoId, detalle]) => {
            
            const itemInventario = inventarioData[productoId] || {}; 
            const productoNombre = itemInventario.nombre || 'Producto no encontrado';
            const unidadMedida = itemInventario.unidadMedida || '';
            const stockActual = itemInventario.stock !== undefined ? itemInventario.stock : 0;
            const cantidadSolicitada = detalle.cantidadSolicitada || 0;
            const cantidadPorDefecto = Math.min(cantidadSolicitada, stockActual);
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${productoNombre}</td>
                <td>${cantidadSolicitada} ${unidadMedida}</td>
                <td>${stockActual}</td>
                <td>
                    <input type="number" 
                        class="input-despachar" 
                        data-product-id="${productoId}" 
                        data-max-stock="${stockActual}"
                        data-solicitado="${cantidadSolicitada}"
                        value="${cantidadPorDefecto}" 
                        min="0" 
                        max="${stockActual}" 
                        required>
                </td>`;
            tablaDetalleDispensacionBody.appendChild(tr);
        });
    } else if (disp.productos && Array.isArray(disp.productos)) {
        disp.productos.forEach(detalle => {
            const productoId = detalle.productoId;
            const itemInventario = inventarioData[productoId] || {};
            
            const productoNombre = itemInventario.nombre || 'Producto no encontrado';
            const unidadMedida = itemInventario.unidadMedida || '';
            const stockActual = itemInventario.stock !== undefined ? itemInventario.stock : 0;
            
            const cantidadSolicitada = detalle.cantidadSolicitada || 0;
            const cantidadPorDefecto = Math.min(cantidadSolicitada, stockActual);

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${productoNombre}</td>
                <td>${cantidadSolicitada} ${unidadMedida}</td>
                <td>${stockActual}</td>
                <td>
                    <input type="number" 
                        class="input-despachar" 
                        data-product-id="${productoId}" 
                        data-max-stock="${stockActual}"
                        data-solicitado="${cantidadSolicitada}"
                        value="${cantidadPorDefecto}" 
                        min="0" 
                        max="${stockActual}" 
                        required>
                </td>`;
            tablaDetalleDispensacionBody.appendChild(tr);
        });
    }

    showSection('vistaDispensacion', 'Despacho de Solicitud');
}

formDespacho.addEventListener("submit", (e) => {
    e.preventDefault();
    if (currentDispensacionKey) {
        handleDespacharDispensacion(currentDispensacionKey, dispensacionesData[currentDispensacionKey]);
    }
});

btnVolverDispensaciones.addEventListener("click", () => showSection('dispensacionesLista', 'Solicitudes de Despacho'));

btnRechazarDispensacion.addEventListener("click", () => {
    if (currentDispensacionKey && confirm("¿Confirma que desea RECHAZAR esta solicitud de despacho?")) {
        handleRechazarDispensacion(currentDispensacionKey);
    }
});

async function handleDespacharDispensacion(dispensacionKey, dispensacion) {
    const inputs = document.querySelectorAll("#tablaDetalleDispensacion .input-despachar");
    const updates = {};
    let despachoCompleto = true;
    let tieneProductosADespachar = false;

    const productosDespachados = dispensacion.productos && !Array.isArray(dispensacion.productos) ? {...dispensacion.productos} : {};

    for (const input of inputs) {
        const productoId = input.dataset.productId;
        const cantidadDespachar = parseInt(input.value, 10);
        const stockActual = inventarioData[productoId]?.stock || 0;
        const productoNombre = inventarioData[productoId]?.nombre || 'Item';
        const cantidadSolicitada = parseInt(input.dataset.solicitado, 10);

        if (cantidadDespachar < 0) {
            alert(`Error: La cantidad a despachar para ${productoNombre} debe ser positiva.`);
            return;
        }
        
        if (cantidadDespachar > stockActual) {
            alert(`Error: No hay suficiente stock (${stockActual}) para despachar ${cantidadDespachar} de ${productoNombre}.`);
            return;
        }
        
        if (cantidadDespachar > 0) {
            tieneProductosADespachar = true;
            
            updates[`inventario/${productoId}/stock`] = stockActual - cantidadDespachar;
            if(productosDespachados[productoId]) {
                productosDespachados[productoId].cantidadDespachada = cantidadDespachar;
            } else if (Array.isArray(dispensacion.productos)) {
                console.warn("Manejo de array de productos no implementado para despacho complejo.");
            }
            
            if (cantidadDespachar < cantidadSolicitada) {
                despachoCompleto = false;
            }
        } else if (cantidadSolicitada > 0) {
            despachoCompleto = false;
        }
    }
    
    if (!tieneProductosADespachar && !confirm("No se ha marcado ningún producto para despachar. ¿Desea marcar esta solicitud como completada (cero productos despachados)?")) {
        return;
    }

    try {
        dispensacion.estado = despachoCompleto ? 'Completada' : 'Parcialmente Despachada';
        dispensacion.fechaDespacho = new Date().toISOString();
        dispensacion.farmaceuticoKey = farmaceuticoData.dbKey;
        dispensacion.productos = productosDespachados; 
        
        updates[`dispensaciones/${dispensacionKey}`] = dispensacion;
        
        await update(ref(db), updates);

        alert(`Despacho ${dispensacion.estado} realizado con éxito. Stock descontado.`);
        showSection('dispensacionesLista', 'Solicitudes de Despacho');

    } catch (error) {
        console.error("Error al confirmar despacho y descontar stock:", error);
        alert("Ocurrió un error al procesar el despacho. Consulte la consola.");
    }
}

async function handleRechazarDispensacion(dispensacionKey) {
    try {
        await update(ref(db, `dispensaciones/${dispensacionKey}`), { 
            estado: 'Rechazada', 
            fechaDespacho: new Date().toISOString(),
            farmaceuticoKey: farmaceuticoData.dbKey,
            notasRechazo: prompt("Opcional: Ingrese la razón del rechazo:") || 'Rechazado por farmacéutico.'
        });
        alert("Solicitud rechazada correctamente.");
        showSection('dispensacionesLista', 'Solicitudes de Despacho');
    } catch (error) {
        console.error("Error al rechazar dispensación:", error);
        alert("Error al rechazar la solicitud.");
    }
}

toggleMenu.addEventListener("click", () => sidebar.classList.toggle("open"));
menuLinks.forEach(boton => {
    boton.addEventListener("click", (e) => {
        e.preventDefault();
        const targetId = boton.dataset.target || 'inicio';
        let title = boton.textContent.trim().replace(/[\s\S]*?\s/u, '').trim(); 
        if (title.includes('Inicio')) title = 'Inicio';
        if (title.includes('Despacho')) title = 'Solicitudes de Despacho';
        if (title.includes('Inventario')) title = 'Inventario Productos';
        showSection(targetId, title);
    });
});

logoutBtn.addEventListener("click", async () => {
    try {
        await signOut(auth);
        window.location.href = "../index.html";
    } catch (error) {
        alert("Error al cerrar sesión: " + error.message);
    }
});