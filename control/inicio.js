import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  databaseURL: "TU_DB_URL",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_BUCKET",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Inicio de sesión exitoso");
    window.location.href = "../paginas/inicio.html";
  } catch (error) {
    alert("Error: " + error.message);
  }
});

document.getElementById("togglePassword").addEventListener("click", () => {
  const passwordInput = document.getElementById("password");
  passwordInput.type = passwordInput.type === "password" ? "text" : "password";
});

document.getElementById("logoHeader").addEventListener("click", () => {
  window.location.href = "../paginas/inicio.html";
});

document.getElementById("imagenLogin").addEventListener("click", () => {
  window.location.href = "../paginas/inicio.html";
});

document.getElementById("logoForm").addEventListener("click", () => {
  window.location.href = "../paginas/inicio.html";
});