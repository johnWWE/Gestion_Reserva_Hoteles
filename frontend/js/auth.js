// js/auth.js
import { apiRequest,saveToken } from "./api.js";

const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");
const mensaje = document.getElementById("mensaje");

// ✅ REGISTRO
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = {
      nombre: document.querySelector('input[name="nombre"]').value,
      email: document.querySelector('input[name="email"]').value,
      password: document.querySelector('input[name="password"]').value,
    };

    try {
      const data = await apiRequest("/auth/register", "POST", formData);
      mensaje.textContent = `✅ ${data.mensaje || "Usuario registrado correctamente"}`;
    } catch (err) {
      mensaje.textContent = `❌ Error: Intenta nuevamente`;
    }
  });
}

// ✅ LOGIN
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = {
      email: document.querySelector("#email").value,
      password: document.querySelector("#password").value,
    };

    try {
      const data = await apiRequest("/auth/login", "POST", formData);
      console.log("Respuesta del backend:", data);

      if (data.token) {
        saveToken(data.token);
        mensaje.textContent = "✅ Inicio de sesión exitoso";
        setTimeout(() => (window.location.href = "index.html"), 1500);
      } else {
        mensaje.textContent = "❌ Credenciales incorrectas";
      }
    } catch (err) {
      console.error("Error al iniciar sesión:", err);
      mensaje.textContent = "❌ Error al iniciar sesión";
    }
  });
}


