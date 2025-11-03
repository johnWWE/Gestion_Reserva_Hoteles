// frontend/js/reservations.js
import { request } from "./api.js";
// Mostrar mensaje de éxito si venimos de reservar
(function () {
  const ok = sessionStorage.getItem("reservationSuccess");
  if (ok) { alert(ok); sessionStorage.removeItem("reservationSuccess"); } // o usa tu toast
})();
const listEl = document.getElementById("list");
const msgEl = document.getElementById("msg");
const titleEl = document.getElementById("title");

async function load() {
  const role = localStorage.getItem("userRole") || "cliente";

  // Endpoint correcto según rol:
  // - admin: GET /api/reservas
  // - cliente: GET /api/reservas/mias
  const path = role === "admin" ? "/api/reservas" : "/api/reservas/mias";
  if (role === "admin") titleEl.textContent = "Reservas (admin)";

  try {
    const data = await request(path);
    renderList(data || []);
  } catch (err) {
    // Si no hay sesión, manda a login
    if (/401|Acceso denegado|Token/.test(err.message)) {
      window.location.href = "login.html";
      return;
    }
    msgEl.textContent = `Error: ${err.message || "No se pudo cargar"}`;
  }
}

function renderList(items) {
  if (!items.length) {
    msgEl.textContent = "No hay reservas aún.";
    listEl.innerHTML = "";
    return;
  }
  msgEl.textContent = "";
  listEl.innerHTML = items.map(cardHTML).join("");
}

function fmtDate(iso) {
  // iso esperado: 'YYYY-MM-DD'
  if (!iso || typeof iso !== "string") return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso; // si no es YYYY-MM-DD lo devolvemos tal cual
  return `${d}/${m}/${y}`; // muestra DD/MM/YYYY sin tocar zona horaria
}

function cardHTML(r) {
  return `
    <article class="card" style="padding:1rem">
      <h3 style="margin:0 0 .25rem 0;">Reserva #${r.id}</h3>
      <p class="muted" style="margin:.25rem 0;">Estado: <strong>${r.estado || "pendiente"}</strong></p>
      <p style="margin:.25rem 0;">Del <strong>${fmtDate(r.fechaInicio)}</strong> al <strong>${fmtDate(r.fechaFin)}</strong></p>
      <p style="margin:.25rem 0;">Habitación ID: ${r.habitacionId}</p>
      ${r.userId ? `<p style="margin:.25rem 0;">Usuario ID: ${r.userId}</p>` : ""}
    </article>
  `;
}

load();

