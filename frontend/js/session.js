// frontend/js/session.js
// =========================================================
// Control de sesión, visibilidad dinámica y “Bienvenido, {nombre}”
// =========================================================

export function isLoggedIn() {
  return Boolean(localStorage.getItem("token"));
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("userName");
  localStorage.removeItem("userRole");
  window.location.href = "index.html";
}

export function applySessionUI() {
  const logged = isLoggedIn();
  const role = localStorage.getItem("userRole");
  const userName = localStorage.getItem("userName") || "";

  // Oculta/mostrar por estado de sesión
  document.querySelectorAll("[data-hide-when='logged']").forEach(el => {
    el.style.display = logged ? "none" : "";
  });
  document.querySelectorAll("[data-show-when='logged']").forEach(el => {
    el.style.display = logged ? "" : "none";
  });
  document.querySelectorAll("[data-show-when='admin']").forEach(el => {
    el.style.display = (logged && role === "admin") ? "" : "none";
  });

  // Botón de logout
  const logoutBtn = document.querySelector("[data-action='logout']");
  if (logoutBtn) logoutBtn.onclick = logout;

  // “Bienvenido, {nombre}” en header
  document.querySelectorAll("[data-username]").forEach(el => {
    el.textContent = userName ? `Bienvenido, ${userName}` : "";
  });

  // Compatibilidad con viejo #welcome-text si existe
  const legacyWelcome = document.getElementById("welcome-text");
  if (legacyWelcome) {
    legacyWelcome.textContent = logged && userName ? `Bienvenido, ${userName}` : "";
  }
}

document.addEventListener("DOMContentLoaded", applySessionUI);
// Marca chip activo por pathname
(function markActiveNav(){
  const here = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav .chip[href]").forEach(a=>{
    const href = a.getAttribute("href");
    if (!href) return;
    const file = href.split("/").pop();
    if (file === here) a.classList.add("is-active");
  });
})();
