import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, update, get } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { getAuth, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

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
const auth = getAuth(app);
const btnInicio = document.getElementById("btnInicio");
const btnEmpleadosMenu = document.getElementById("btnEmpleadosMenu");
const subEmpleados = document.getElementById("subEmpleados");
const btnUsuarios = document.getElementById("btnUsuarios");
const btnServicios = document.getElementById("btnServicios");
const sections = document.querySelectorAll(".section");
const tituloSeccion = document.getElementById("tituloSeccion");
const sidebar = document.getElementById("sidebar");
const toggleMenu = document.getElementById("toggleMenu");
const btnAgregarEmpleadoMenuLista = document.getElementById("btnAgregarEmpleadoMenuLista");
const btnVolverListaEmpleados = document.getElementById("btnVolverListaEmpleados");
const formEmpleado = document.getElementById("formEmpleado");
const campoExtra = document.getElementById("campoExtra");
const btnCancelar = document.getElementById("btnCancelar");
const sectionFormulario = document.getElementById("empleadosFormulario");
const sectionLista = document.getElementById("empleadosLista");
const tituloFormEmpleado = document.getElementById("tituloFormEmpleado");
let currentRol = "";
window.currentEmployeesData = {};
const btnAgregarUsuario = document.getElementById("btnAgregarUsuario");
const sectionUsuarios = document.getElementById("usuarios");
const sectionUsuariosFormulario = document.getElementById("usuariosFormulario");
const btnVolverListaUsuarios = document.getElementById("btnVolverListaUsuarios");
const formUsuario = document.getElementById("formUsuario");
const btnCancelarUsuario = document.getElementById("btnCancelarUsuario");
const empleadoIdSelect = document.getElementById("empleadoIdSelect");
const tituloFormUsuario = document.getElementById("tituloFormUsuario");
const usersTableBody = document.querySelector("#usuariosTable tbody");
window.currentUsersData = {};
const tablaServiciosBody = document.querySelector("#tablaServicios tbody");
const formServicio = document.getElementById("formServicio");
const btnAgregarServicio = document.getElementById("btnAgregarServicio");
const btnVolverListaServicios = document.getElementById("btnVolverListaServicios");
const btnCancelarServicio = document.getElementById("btnCancelarServicio");
const tituloFormServicio = document.getElementById("tituloFormServicio");
const totalServiciosCard = document.getElementById("totalServicios");
window.currentServiciosData = {};
const logoutBtn = document.getElementById("logoutBtn");

function capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

function showSection(id, title) {
  sections.forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  tituloSeccion.textContent = title;
  sidebar.classList.remove("show");
}

function showEmpleadosLista(rol) {
    sectionLista.classList.add("active");
    sectionFormulario.classList.remove("active");
    showSection("empleadosLista", `Lista de ${capitalize(rol)}s`);
}

function showEmpleadosForm() {
    sectionLista.classList.remove("active");
    sectionFormulario.classList.add("active");
    showSection("empleadosFormulario", `${capitalize(currentRol)}: Formulario`);
}

function showUsuariosLista() {
    sectionUsuarios.classList.add("active");
    sectionUsuariosFormulario.classList.remove("active");
    loadUsers();
    showSection("usuarios", "Gestión de Usuarios");
}

function showUsuariosForm() {
    sectionUsuarios.classList.add("active");
    sectionUsuariosFormulario.classList.add("active");
    showSection("usuariosFormulario", "Usuario: Formulario");
}

function showServiciosLista() {
    showSection("serviciosLista", "Gestión de Servicios");
    loadServices();
}

function showServiciosForm() {
    document.getElementById("serviciosLista").classList.remove("active");
    document.getElementById("serviciosFormulario").classList.add("active");
    showSection("serviciosFormulario", "Servicio: Formulario");
}

toggleMenu.addEventListener("click", () => sidebar.classList.toggle("show"));

btnInicio.addEventListener("click", (e) => { e.preventDefault(); showSection("inicio", "Panel de Administración"); });
btnEmpleadosMenu.addEventListener("click", (e) => { e.preventDefault(); subEmpleados.classList.toggle("show"); });
btnUsuarios.addEventListener("click", (e) => { e.preventDefault(); showUsuariosLista(); });
btnServicios.addEventListener("click", (e) => { e.preventDefault(); showServiciosLista(); });

document.querySelectorAll("#subEmpleados a").forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();
    const rol = link.dataset.rol;
    currentRol = rol;
    showEmpleadosLista(rol);
    loadEmployees(rol);
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

onValue(ref(db, "empleados"), (snapshot) => {
  const data = snapshot.val() || {};
  document.getElementById("totalEmpleados").textContent = Object.keys(data).length;
});

onValue(ref(db, "usuarios"), (snapshot) => {
  const data = snapshot.val() || {};
  document.getElementById("totalUsuarios").textContent = Object.keys(data).length;
});

onValue(ref(db, "servicios"), (snapshot) => {
    const data = snapshot.val() || {};
    totalServiciosCard.textContent = Object.keys(data).length;
});

btnAgregarEmpleadoMenuLista.addEventListener("click", () => {
  if (!currentRol) return alert("Selecciona un rol específico (Veterinario, Recepcionista, etc.) en el menú para agregar un empleado.");
  
  tituloFormEmpleado.textContent = `Agregar ${capitalize(currentRol)}`;
  formEmpleado.reset();
  document.getElementById("empId").value = "";
  generarCampoExtra(currentRol);
  showEmpleadosForm();
});

btnVolverListaEmpleados.addEventListener("click", (e) => {
    e.preventDefault();
    showEmpleadosLista(currentRol);
});

btnCancelar.addEventListener("click", (e) => {
    e.preventDefault();
    showEmpleadosLista(currentRol);
});

function generarCampoExtra(rol, data = {}) {
  campoExtra.innerHTML = "";
  if (rol === "veterinario") {
    campoExtra.innerHTML = `
      <div class="form-group">
        <label><i class="fas fa-id-card"></i> Cédula Profesional</label>
        <input type="text" id="cedula" required value="${data.cedula || ''}" placeholder="Ej. VET123456">
      </div>`;
  } else if (rol === "farmaceutico") {
    campoExtra.innerHTML = `
      <div class="form-group">
        <label><i class="fas fa-vial"></i> Registro COFEPRIS</label>
        <input type="text" id="registro" required value="${data.registro || ''}" placeholder="Ej. COFE12345">
      </div>`;
  } else if (rol === "administrador") {
    campoExtra.innerHTML = `
      <div class="form-group">
        <label><i class="fas fa-briefcase"></i> Cargo</label>
        <input type="text" id="cargo" required value="${data.cargo || ''}" placeholder="Ej. Supervisor">
      </div>`;
  }
}

formEmpleado.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("empId").value;
  const empleado = {
    apellidoPaterno: document.getElementById("apellidoPaterno").value,
    apellidoMaterno: document.getElementById("apellidoMaterno").value,
    nombre: document.getElementById("nombre").value,
    telefono: document.getElementById("telefono").value,
    direccion: document.getElementById("direccion").value,
    rol: currentRol,
    correo: document.getElementById("correoEmpleado").value 
  };
  if (currentRol === "veterinario") empleado.cedula = document.getElementById("cedula").value;
  if (currentRol === "farmaceutico") empleado.registro = document.getElementById("registro").value;
  if (currentRol === "administrador") empleado.cargo = document.getElementById("cargo").value;

  try {
    const empleadosRef = ref(db, "empleados");
    if (id) {
        await update(ref(db, `empleados/${id}`), empleado);
    } else {
        await push(empleadosRef, empleado);
    }
    alert(`${capitalize(currentRol)} guardado con éxito.`);
    showEmpleadosLista(currentRol);
  } catch (error) {
    console.error("Error al guardar empleado:", error);
    alert("Ocurrió un error al guardar el empleado.");
  }
});

function loadEmployees(rol) {
  const tbody = document.querySelector("#tablaEmpleados tbody");
  const empleadosRef = ref(db, "empleados");
  
  onValue(empleadosRef, (snapshot) => {
    const data = snapshot.val() || {};
    const filtered = Object.entries(data).filter(([key, emp]) => emp.rol === rol);
    
    window.currentEmployeesData = data;
    
    tbody.innerHTML = "";
    
    if (!filtered.length) {
      return tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">
        <i class="fas fa-exclamation-circle" style="margin-right: 5px;"></i> No hay ${rol}s registrados.
      </td></tr>`;
    }
    
    filtered.forEach(([key, emp]) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${key.substring(0, 8)}...</td>
        <td>${emp.nombre} ${emp.apellidoPaterno} ${emp.apellidoMaterno}</td>
        <td>${emp.correo || 'N/A'}</td>
        <td>${emp.rol}</td>
        <td>
          <button class="edit-empleado edit" data-id="${key}"><i class="fas fa-edit"></i> Editar</button>
          <button class="delete-empleado delete" data-id="${key}"><i class="fas fa-trash-alt"></i> Eliminar</button>
        </td>`;
      tbody.appendChild(tr);
    });
    
    tbody.querySelectorAll(".edit-empleado").forEach(button => {
        button.addEventListener("click", handleEditEmpleado);
    });

    tbody.querySelectorAll(".delete-empleado").forEach(button => {
        button.addEventListener("click", handleDeleteEmpleado);
    });
  });
}

function handleEditEmpleado(e) {
    const key = e.target.closest("button").dataset.id;
    const emp = window.currentEmployeesData[key];
    currentRol = emp.rol; 
    
    tituloFormEmpleado.textContent = `Editar ${capitalize(currentRol)}`;
    document.getElementById("empId").value = key;
    document.getElementById("apellidoPaterno").value = emp.apellidoPaterno;
    document.getElementById("apellidoMaterno").value = emp.apellidoMaterno;
    document.getElementById("nombre").value = emp.nombre;
    document.getElementById("telefono").value = emp.telefono;
    document.getElementById("direccion").value = emp.direccion;
    document.getElementById("correoEmpleado").value = emp.correo;
    generarCampoExtra(currentRol, emp);
    showEmpleadosForm();
}

function handleDeleteEmpleado(e) {
    const key = e.target.closest("button").dataset.id;
    const empData = window.currentEmployeesData[key];
    if (confirm(`¿Seguro que desea eliminar a ${empData.nombre}?`)) {
        remove(ref(db, `empleados/${key}`));
    }
}

async function populateEmpleadoSelect(currentEmpleadoKey = null) {
    empleadoIdSelect.innerHTML = '<option value="">-- Seleccione un Empleado --</option>';
    const empleadosRef = ref(db, "empleados");
    const snapshot = await get(empleadosRef);
    const empleados = snapshot.val() || {};
    
    const usuariosSnapshot = await get(ref(db, "usuarios"));
    const usuarios = usuariosSnapshot.val() || {};
    
    Object.entries(empleados).forEach(([key, emp]) => {
        const yaExisteUsuario = Object.values(usuarios).some(user => user.empleadoKey === key && key !== currentEmpleadoKey);

        if (!yaExisteUsuario) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = `${emp.nombre} ${emp.apellidoPaterno} - ${capitalize(emp.rol)}`;
            empleadoIdSelect.appendChild(option);
        }
    });
}
btnAgregarUsuario.addEventListener("click", async () => {
  await populateEmpleadoSelect();
  showUsuariosForm();
  formUsuario.reset();
  document.getElementById("userId").value = "";
  document.getElementById("empleadoIdSelect").disabled = false;
  document.getElementById("passwordUsuario").setAttribute("required", true);
  document.getElementById("passwordUsuario").placeholder = "********";
  tituloFormUsuario.textContent = "Crear Nuevo Usuario de Acceso";
});

btnVolverListaUsuarios.addEventListener("click", (e) => {
    e.preventDefault();
    showUsuariosLista();
});

btnCancelarUsuario.addEventListener("click", (e) => {
    e.preventDefault();
    showUsuariosLista();
});

formUsuario.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userId = document.getElementById("userId").value;
  const correo = document.getElementById("correoUsuario").value;
  const password = document.getElementById("passwordUsuario").value;
  const rol = document.getElementById("rolUsuario").value;
  const empleadoKey = empleadoIdSelect.value;
  
  if (!empleadoKey) {
      alert("Debe seleccionar un empleado existente.");
      return;
  }

  try {
    if (userId) {
        const updates = {
            correo: correo,
            rol: rol
        };
        
        await update(ref(db, `usuarios/${userId}`), updates);

        alert(`Usuario ${correo} actualizado con éxito.`);
        
        document.getElementById("empleadoIdSelect").disabled = false;
        document.getElementById("passwordUsuario").setAttribute("required", true); 

    } else {
        if (!password) {
            alert("La contraseña es obligatoria para un nuevo usuario.");
            return;
        }

        const adminEmail = auth.currentUser ? auth.currentUser.email : null;
        let adminPassword = null;
        if (!adminEmail) {
            alert("No hay administrador autenticado para crear la cuenta.");
            return;
        } else {
            adminPassword = prompt("Para crear la cuenta, por favor escribe tu contraseña de administrador para crear la cuenta:");
            if (!adminPassword) {
                alert("Contraseña de administrador necesaria para completar la operación.");
                return;
            }
        }

        const userCredential = await createUserWithEmailAndPassword(auth, correo, password);
        const user = userCredential.user;
        
        await push(ref(db, "usuarios"), {
            empleadoKey: empleadoKey,
            uid: user.uid,
            correo: correo,
            rol: rol
        });

        await signInWithEmailAndPassword(auth, adminEmail, adminPassword);

        alert("Usuario agregado y credenciales creadas correctamente.");
    }
    
    showUsuariosLista();
  } catch (error) {
    alert("Error al guardar usuario: " + error.message);
  }
});

async function handleEditUser(e) {
    const dbKey = e.target.closest("button").dataset.userDbKey;
    const userData = window.currentUsersData[dbKey];

    if (!userData) {
        alert("Datos de usuario no encontrados.");
        return;
    }

    await populateEmpleadoSelect(userData.empleadoKey);
    tituloFormUsuario.textContent = `Editar Usuario: ${userData.correo}`;
    document.getElementById("userId").value = dbKey;
    
    const empleadoSelect = document.getElementById("empleadoIdSelect");
    empleadoSelect.value = userData.empleadoKey;
    empleadoSelect.disabled = true;

    document.getElementById("correoUsuario").value = userData.correo;
    document.getElementById("rolUsuario").value = userData.rol;
    
    document.getElementById("passwordUsuario").removeAttribute("required");
    document.getElementById("passwordUsuario").placeholder = "Dejar vacío para no cambiar contraseña";

    showUsuariosForm();
}

async function loadUsers() {
  const empleadosRef = ref(db, "empleados");
  const empleadosSnapshot = await get(empleadosRef);
  const empleadosData = empleadosSnapshot.val() || {};

  onValue(ref(db, "usuarios"), (snapshot) => {
    usersTableBody.innerHTML = "";
    const usersData = snapshot.val() || {};
    const usersArray = Object.entries(usersData);
    
    window.currentUsersData = usersData;

    if (!usersArray.length) {
      return usersTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No hay usuarios registrados</td></tr>`;
    }

    usersArray.forEach(([key, user]) => {
      const row = document.createElement("tr");
      const empleado = empleadosData[user.empleadoKey] || {};
      const nombreCompleto = empleado.nombre ? `${empleado.nombre} ${empleado.apellidoPaterno} ${empleado.apellidoMaterno}` : 'Empleado no encontrado';

      row.innerHTML = `
        <td>${user.empleadoKey ? user.empleadoKey.substring(0, 8) + '...' : 'N/A'}</td>
        <td>${nombreCompleto}</td>
        <td>${user.correo || "Sin correo"}</td>
        <td>${capitalize(user.rol || "Sin rol")}</td>
        <td>
            <button class="edit-user edit" data-user-db-key="${key}"><i class="fas fa-edit"></i> Editar</button>
            <button class="delete-user delete" data-user-db-key="${key}" data-user-email="${user.correo}"><i class="fas fa-trash-alt"></i> Eliminar</button>
        </td>`;
      usersTableBody.appendChild(row);
    });
    
    usersTableBody.querySelectorAll(".edit-user").forEach(button => {
        button.addEventListener("click", handleEditUser);
    });
    
    usersTableBody.querySelectorAll(".delete-user").forEach(button => {
        button.addEventListener("click", async (e) => {
            const dbKey = e.target.closest("button").dataset.userDbKey;
            const email = e.target.closest("button").dataset.userEmail;

            if (confirm(`Eliminar la cuenta de acceso para ${email}?`)) {
                try {
                    await remove(ref(db, `usuarios/${dbKey}`)); 
                    alert(`Usuario ${email} eliminado de la base de datos de acceso.`);
                } catch (error) {
                    alert("Error al eliminar el usuario: " + error.message);
                }
            }
        });
    });
  });
}

const selectServicio = document.getElementById('nombreServicioSelect');
const inputOtroServicio = document.getElementById('nombreServicioOtro');

function toggleOtroServicioInput(valorSeleccionado) {
    if (valorSeleccionado === 'Otro') {
        inputOtroServicio.style.display = 'block';
        inputOtroServicio.setAttribute('required', 'required');
    } else {
        inputOtroServicio.style.display = 'none';
        inputOtroServicio.removeAttribute('required');
        if (valorSeleccionado !== '' && valorSeleccionado !== 'Otro') {
            inputOtroServicio.value = '';
        }
    }
}

btnAgregarServicio.addEventListener("click", () => {
    formServicio.reset();
    document.getElementById("servicioId").value = "";
    document.getElementById("nombreServicioSelect").value = "";
    document.getElementById("nombreServicioOtro").value = "";

    toggleOtroServicioInput("");

    tituloFormServicio.textContent = "Registrar Nuevo Servicio";
    showServiciosForm();
});

btnVolverListaServicios.addEventListener("click", () => {
    showServiciosLista();
});

btnCancelarServicio.addEventListener("click", () => {
    showServiciosLista();
});

function loadServices() {
    const serviciosRef = ref(db, "servicios");

    onValue(serviciosRef, (snapshot) => {
        const serviciosData = snapshot.val() || {};
        const serviciosArray = Object.entries(serviciosData);
        const tablaServiciosBody = document.querySelector("#tablaServicios tbody");
        
        window.currentServiciosData = serviciosData;

        tablaServiciosBody.innerHTML = "";

        if (!serviciosArray.length) {
            return tablaServiciosBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">
                <i class="fas fa-wrench" style="margin-right: 5px;"></i> No hay servicios registrados.
            </td></tr>`;
        }

        serviciosArray.forEach(([key, serv]) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${key.substring(0, 8)}...</td>
                <td>${serv.nombre || 'N/A'}</td>
                <td>$${parseFloat(serv.costo || 0).toFixed(2)}</td>
                <td>${serv.duracion || 'N/A'} min</td>
                <td style="max-width: 300px; white-space: normal;">${serv.descripcion || 'Sin descripción'}</td>
                <td>
                    <button class="edit-servicio edit" data-id="${key}"><i class="fas fa-edit"></i> Editar</button>
                    <button class="delete-servicio delete" data-id="${key}"><i class="fas fa-trash-alt"></i> Eliminar</button>
                </td>`;
            tablaServiciosBody.appendChild(tr);
        });
        
        tablaServiciosBody.querySelectorAll(".edit-servicio").forEach(button => {
            button.addEventListener("click", handleEditServicio);
        });

        tablaServiciosBody.querySelectorAll(".delete-servicio").forEach(button => {
            button.addEventListener("click", handleDeleteServicio);
        });
    });
}

function handleEditServicio(e) {
    const key = e.target.closest("button").dataset.id;
    const serv = window.currentServiciosData[key];
    
    document.getElementById("servicioId").value = key;
    
    selectServicio.value = "";
    inputOtroServicio.value = "";

    let nombreParaControl = serv.nombre || "";
    
    if (selectServicio.querySelector(`option[value="${serv.nombre}"]`)) {
        selectServicio.value = serv.nombre;
    } else {
        selectServicio.value = "Otro";
        inputOtroServicio.value = serv.nombre || "";
        nombreParaControl = "Otro";
    }

    toggleOtroServicioInput(nombreParaControl);

    document.getElementById("costoServicio").value = parseFloat(serv.costo || 0).toFixed(2);
    document.getElementById("duracionServicio").value = serv.duracion || '';
    document.getElementById("descripcionServicio").value = serv.descripcion || '';
    
    tituloFormServicio.textContent = `Editar Servicio: ${serv.nombre}`;
    showServiciosForm();
}

async function handleDeleteServicio(e) {
    const key = e.target.closest("button").dataset.id;
    const servData = window.currentServiciosData[key];
    if (confirm(`¿Seguro que desea eliminar el servicio "${servData.nombre}"?`)) {
        try {
            await remove(ref(db, `servicios/${key}`));
        } catch (error) {
            console.error("Error al eliminar servicio:", error);
            alert("Error al eliminar servicio.");
        }
    }
}

formServicio.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("servicioId").value;
    
    const nombreSelect = selectServicio.value.trim();
    const nombreOtro = inputOtroServicio.value.trim();
    
    let nombreServicioFinal = "";
    
    if (nombreSelect && nombreSelect !== 'Otro') {
        nombreServicioFinal = nombreSelect;
    } else if (nombreSelect === 'Otro' && nombreOtro) {
        nombreServicioFinal = nombreOtro;
    } else {
        alert("Debe seleccionar un servicio o especificar uno en el campo 'Otro'.");
        return;
    }
    
    const servicio = {
        nombre: nombreServicioFinal,
        costo: parseFloat(document.getElementById("costoServicio").value) || 0.00,
        duracion: parseInt(document.getElementById("duracionServicio").value) || 0,
        descripcion: document.getElementById("descripcionServicio").value.trim()
    };

    try {
        const serviciosRef = ref(db, "servicios");
        if (id) {
            await update(ref(db, `servicios/${id}`), servicio);
        } else {
            await push(serviciosRef, servicio);
        }
        alert(`Servicio "${servicio.nombre}" guardado con éxito.`);
        showServiciosLista();
    } catch (error) {
        console.error("Error al guardar servicio:", error);
        alert("Error al guardar servicio. Verifique la conexión.");
    }
});

document.addEventListener('DOMContentLoaded', () => {
    toggleOtroServicioInput(selectServicio.value);

    selectServicio.addEventListener('change', function() {
        toggleOtroServicioInput(selectServicio.value);
    });

    showSection("inicio", "Panel de Administración");
});