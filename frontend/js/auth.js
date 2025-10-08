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
      nombre:document.querySelector('input[name="nombre"]').value,
      email: document.querySelector('input[name="email"]').value,
      password: document.querySelector('input[name="password"]').value,
    };

    try {
      const data = await apiRequest("/auth/register", "POST", formData);
      mensaje.textContent = '✅ ${data.mensaje || "Usuario registrado correctamente"}';
      alert("Usuario registrado correctamente ✅");
      window.location.href = "login.html";
    } catch (err) {
      console.error("Error en el registro:",err);
      mensaje.textContent = '❌ Error: Intenta nuevamente';
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

      localStorage.setItem("token", data.token);
      localStorage.setItem("userName", data.user.nombre);
      localStorage.setItem("userRole", data.user.role); // si tu backend lo envía
      alert("Inicio de sesión exitoso ✅ Bienvenido ${data.user.nombre}");
      window.location.href = "index.html";  
      }else {
        mensaje.textContent = "❌ Credenciales incorrectas";
      }
    } catch (err) {
      console.error("Error al iniciar sesión:", err);
      mensaje.textContent = "❌ Error al iniciar sesión";
    }
  });
}


