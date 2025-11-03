// frontend/js/register.js
import { registerUser } from "./api.js";

const form = document.getElementById("registerForm");
const nombreEl = document.getElementById("nombre");
const emailEl = document.getElementById("email");
const passEl = document.getElementById("password");
const msgEl = document.getElementById("regMsg");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  msgEl.textContent = "Creando cuenta...";
  try {
    await registerUser({
      nombre: nombreEl.value.trim(),
      email: emailEl.value.trim(),
      password: passEl.value
    });

    // Opciones: redirigir directo o llevar al login
    // 1) Redirigir a login:
    // window.location.href = "login.html";

    // 2) Autologin (si el backend devuelve token en register):
    const role = localStorage.getItem("userRole") || "cliente";
    window.location.assign(role === "admin" ? "admin.html" : "hotels.html");
  } catch (err) {
    console.error(err);
    msgEl.textContent = err.message || "No se pudo registrar. Intenta de nuevo.";
  }
});
