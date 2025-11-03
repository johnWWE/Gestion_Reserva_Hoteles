// frontend/js/hotel.js
import { request } from "./api.js";
import { isLoggedIn } from "./session.js";

const $ = (s) => document.querySelector(s);
const nameEl   = $("#hotelName");
const infoEl   = $("#hotelInfo");
const roomsEl  = $("#rooms");
const msgEl    = $("#msg");
const dateMsgEl = $("#dateMsg");
const inicioEl = $("#fechaInicio");
const finEl    = $("#fechaFin");

function getId() {
  return new URLSearchParams(location.search).get("id");
}

function toISOFromInput(el) {
  // fuerza YYYY-MM-DD aunque el navegador muestre dd/mm/yyyy
  if (el.valueAsDate instanceof Date && !isNaN(+el.valueAsDate)) {
    const d = el.valueAsDate;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${da}`;
  }
  const v = (el.value || "").trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) {
    const [d, m, y] = v.split("/");
    return `${y}-${m}-${d}`;
  }
  return v; // ya puede venir YYYY-MM-DD
}

function getDates() {
  const inicio = toISOFromInput(inicioEl);
  const fin = toISOFromInput(finEl);
  if (!inicio || !fin) return { ok:false, error:"Selecciona fecha de inicio y fin." };
  if (new Date(inicio) >= new Date(fin)) return { ok:false, error:"La fecha fin debe ser posterior a la fecha inicio." };
  return { ok:true, inicio, fin };
}

async function load() {
  const id = getId();
  if (!id) { nameEl.textContent = "Hotel no encontrado"; msgEl.textContent = "Falta ?id="; return; }

  // fecha mínima = hoy
  const d = new Date(); d.setHours(0,0,0,0);
  const min = d.toISOString().slice(0,10);
  inicioEl.min = min; finEl.min = min;

  try {
    const h = await request(`/api/hoteles/${id}`); // público
    nameEl.textContent = h.nombre || `Hotel #${id}`;
    infoEl.textContent = `${h.direccion || ""} · ${h.estrellas ? "⭐".repeat(h.estrellas) : ""}`;

    const rooms = await request(`/api/habitaciones?hotelId=${id}`); // público
    renderRooms(rooms || []);
  } catch (err) {
    nameEl.textContent = "Error cargando hotel";
    msgEl.textContent = `Error: ${err.message || "No encontrado"}`;
  }
}

function renderRooms(items) {
  if (!items.length) { roomsEl.innerHTML = ""; msgEl.textContent = "No hay habitaciones."; return; }
  msgEl.textContent = "";
  roomsEl.innerHTML = items.map(r => `
    <article class="card" style="padding:1rem">
      <h3 style="margin:0 0 .25rem 0;">Hab. ${r.numero} ${r.tipo ? "· "+r.tipo : ""}</h3>
      <p class="muted">Precio: <strong>${r.precio != null ? `S/ ${Number(r.precio).toFixed(2)}` : "—"}</strong></p>
      <button class="btn small" data-room="${r.id}">Comprobar y reservar</button>
      <p id="status-${r.id}" class="muted" style="margin-top:.25rem;"></p>
    </article>
  `).join("");

  roomsEl.querySelectorAll("button[data-room]").forEach(btn => {
    btn.addEventListener("click", () => onReservar(Number(btn.dataset.room)));
  });
}

async function onReservar(habitacionId) {
  const d = getDates();
  if (!d.ok) { dateMsgEl.textContent = d.error; return; }
  dateMsgEl.textContent = "";

  const statusEl = document.getElementById(`status-${habitacionId}`);
  statusEl.textContent = "Comprobando disponibilidad...";

  try {
    // 1) disponibilidad (público)
    const disp = await request(`/api/habitaciones/disponibilidad?habitacionId=${habitacionId}&inicio=${d.inicio}&fin=${d.fin}`);
    if (!disp?.disponible) { statusEl.textContent = "❌ No disponible en ese rango."; return; }
    statusEl.textContent = "✅ Disponible.";

    // 2) si no está logueado → login
    if (!isLoggedIn()) {
      sessionStorage.setItem("postLoginRedirect", location.href);
      sessionStorage.setItem("preselectedDates", JSON.stringify({ inicio: d.inicio, fin: d.fin }));
      location.href = "login.html";
      return;
    }

    // 3) crear reserva (privado)
    statusEl.textContent = "Creando reserva...";
    const r = await request(`/api/reservas`, {
      method: "POST",
      body: { habitacionId, fechaInicio: d.inicio, fechaFin: d.fin }
    });

    sessionStorage.setItem("reservationSuccess",
      `Reserva #${r.id} creada del ${d.inicio} al ${d.fin}`);
    location.href = "reservations.html";
  } catch (err) {
    console.error(err);
    statusEl.textContent = `Error: ${err.message || "No se pudo reservar"}`;
  }
}

// restaurar fechas si venimos de login
(function restoreDates() {
  try {
    const saved = sessionStorage.getItem("preselectedDates");
    if (saved) {
      const { inicio, fin } = JSON.parse(saved);
      if (inicio) inicioEl.value = inicio;
      if (fin) finEl.value = fin;
      sessionStorage.removeItem("preselectedDates");
    }
  } catch {}
})();

[inicioEl, finEl].forEach(el => el?.addEventListener("input", () => { dateMsgEl.textContent = ""; }));
load();

