// frontend/js/users.js
import { request } from "./api.js";

const msgEl = document.getElementById("msg");
const tbody = document.getElementById("tbody");

function ensureAdmin() {
  const role = localStorage.getItem("userRole");
  const token = localStorage.getItem("token");
  if (!token) {
    location.href = "login.html";
    return false;
  }
  if (role !== "admin") {
    msgEl.textContent = "Acceso restringido: solo administradores.";
    return false;
  }
  return true;
}

async function load() {
  if (!ensureAdmin()) return;
  msgEl.textContent = "Cargando usuarios...";

  try {
    const users = await request("/api/usuarios");
    render(users || []);
    msgEl.textContent = "";
  } catch (err) {
    msgEl.textContent = `Error: ${err.message || "No se pudo cargar"}`;
  }
}

function render(items) {
  if (!items.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="muted">No hay usuarios.</td></tr>`;
    return;
  }
  tbody.innerHTML = items
    .map(u => `
      <tr>
        <td>${u.id}</td>
        <td>${u.nombre ?? ""}</td>
        <td>${u.email ?? ""}</td>
        <td>${u.rol ?? "cliente"}</td>
      </tr>
    `)
    .join("");
}

load();
