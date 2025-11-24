import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, get, set, child } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

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

const form = document.getElementById("loginForm");
const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");

togglePassword.addEventListener("click", () => {
    const isPassword = passwordInput.type === "password";
    passwordInput.type = isPassword ? "text" : "password";
    togglePassword.classList.toggle("fa-eye");
    togglePassword.classList.toggle("fa-eye-slash");
});

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
        alert("Por favor, completa todos los campos.");
        return;
    }

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        if (email === "admin@clinipet.com") {
            const adminRef = ref(db, "empleados/" + user.uid);
            const snapshot = await get(adminRef);

            if (!snapshot.exists()) {
                await set(adminRef, {
                    nombre: "Administrador",
                    correo: "admin@clinipet.com",
                    password: "admin123",
                    rol: "administrador"
                });
            }

            window.location.href = "../vista/admin.html";
            return;
        }

        const dbRef = ref(db);
        const snapshot = await get(child(dbRef, "usuarios"));

        if (snapshot.exists()) {
            let foundUser = null;

            snapshot.forEach((childSnap) => {
                const data = childSnap.val();
                if (data.correo === email) {
                    foundUser = data;
                }
            });

            if (!foundUser) {
                alert("Correo o contraseña incorrectos.");
                form.reset();
                return;
            }

            const rol = foundUser.rol?.toLowerCase();

            switch (rol) {
                case "administrador":
                    window.location.href = "../vista/admin.html";
                    break;
                case "veterinario":
                    window.location.href = "../vista/veterinario.html";
                    break;
                case "recepcionista":
                    window.location.href = "../vista/recep.html";
                    break;
                case "farmaceutico":
                    window.location.href = "../vista/farmaceutico.html";
                    break;
                default:
                    alert("Rol no reconocido.");
                    break;
            }
        } else {
            alert("No hay usuarios registrados.");
        }
    } catch (error) {
        if (error.code === "auth/wrong-password") {
            alert("Contraseña incorrecta.");
        } else if (error.code === "auth/user-not-found" || error.code === "auth/invalid-credential") {
            alert("No existe una cuenta con ese correo.");
        } else {
            alert("Error: " + error.message);
        }
    }
});
