// frontend/js/login.js
import { loginUser } from "./api.js";

const form = document.getElementById("loginForm");
const emailEl = document.getElementById("email");
const passEl = document.getElementById("password");
const msgEl = document.getElementById("loginMsg");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  msgEl.textContent = "Iniciando sesión...";
  try {
    const data = await loginUser(emailEl.value.trim(), passEl.value);
    const name = data?.user?.nombre || localStorage.getItem("userName") || "usuario";
    const role = data?.user?.rol || localStorage.getItem("userRole") || "cliente";

    // Para mostrar toast en la siguiente página
    sessionStorage.setItem("welcomeName", name);

    const target = role === "admin" ? "admin.html" : "hotels.html";
    window.location.assign(target);
  } catch (err) {
    console.error("Login error:", err);
    msgEl.textContent = err.message || "Credenciales inválidas o error de servidor.";
  }
});

