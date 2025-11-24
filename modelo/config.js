// Importar Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// Configuración de tu proyecto
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

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db };
