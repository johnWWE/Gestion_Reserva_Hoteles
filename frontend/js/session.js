// js/session.js

const token = localStorage.getItem("token");
const userName = localStorage.getItem("userName");
const userRole = localStorage.getItem("userRole"); // opcional para el admin

// Elementos del DOM
const navLogin = document.getElementById("nav-login");
const navRegister = document.getElementById("nav-register");
const navAdmin = document.getElementById("nav-admin");
const welcomeText = document.getElementById("welcome-text");
const btnLogout = document.getElementById("btn-logout");

// Si hay sesión activa
if (token && userName) {
  navLogin.style.display = "none";
  navRegister.style.display = "none";
  btnLogout.hidden = false;
  welcomeText.textContent = `Bienvenido, ${userName} 👋`;

  // Mostrar el panel admin solo si el rol es admin
  if (userRole === "admin") {
    navAdmin.style.display = "inline";
  } else {
    navAdmin.style.display = "none";
  }

} else {
  // Sin sesión activa
  navLogin.style.display = "inline";
  navRegister.style.display = "inline";
  btnLogout.hidden = true;
  welcomeText.textContent = "";
  navAdmin.style.display = "none";
}

// Evento cerrar sesión
btnLogout.addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("userName");
  localStorage.removeItem("userRole");
  window.location.href = "index.html";
});
