// js/auth.js
import { request, setToken } from "./api.js";
import { showMessage } from "./utils.js";

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const messageEl = document.getElementById("message");

if(loginForm){
  loginForm.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const email = loginForm.email.value.trim();
    const password = loginForm.password.value.trim();
    try{
      const data = await request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      setToken(data.token);
      showMessage(messageEl, "Login correcto, redirigiendo...", "success");
      setTimeout(()=> location.href = "hotels.html", 800);
    }catch(err){
      showMessage(messageEl, err.message || "Error en login", "error");
      console.error(err);
    }
  });
}

if(registerForm){
  registerForm.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const nombre = registerForm.nombre.value.trim();
    const email = registerForm.email.value.trim();
    const password = registerForm.password.value.trim();
    try{
      await request("/auth/register", { method: "POST", body: JSON.stringify({ nombre, email, password }) });
      showMessage(messageEl, "Usuario creado. Puedes iniciar sesión.", "success");
      setTimeout(()=> location.href = "login.html", 900);
    }catch(err){
      showMessage(messageEl, err.message || "Error en registro", "error");
      console.error(err);
    }
  });
}
