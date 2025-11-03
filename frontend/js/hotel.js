// js/hotel.js
// frontend/js/hotel.js
import { request } from "./api.js";
import { isLoggedIn } from "./session.js";
import { showToast } from "./utils.js";

function getId() {
  return new URLSearchParams(location.search).get("id");
}

const nameEl = document.getElementById("hotelName");
const infoEl = document.getElementById("hotelInfo");
const roomsEl = document.getElementById("rooms");
const msgEl = document.getElementById("msg");
const dateMsgEl = document.getElementById("dateMsg");
const inicioEl = document.getElementById("fechaInicio");
const finEl = document.getElementById("fechaFin");

function getDates() {
  const inicio = inicioEl.value;
  const fin = finEl.value;
  if (!inicio || !fin) return { ok: false, error: "Selecciona fecha de inicio y fin." };
  if (new Date(inicio) >= new Date(fin)) return { ok: false, error: "La fecha fin debe ser posterior a la fecha inicio." };
  return { ok: true, inicio, fin };
}

async function load() {
  const id = getId();
  if (!id) {
    nameEl.textContent = "Hotel no encontrado";
    msgEl.textContent = "Falta el parámetro ?id=";
    return;
  }

  try {
    // Detalle del hotel (público)
    const hotel = await request(`/api/hoteles/${id}`);
    nameEl.textContent = hotel.nombre || `Hotel #${id}`;
    infoEl.textContent = `${hotel.direccion || ""} · ${hotel.estrellas ? "⭐".repeat(hotel.estrellas) : ""}`;

    // Habitaciones del hotel (público)
    const rooms = await request(`/api/habitaciones?hotelId=${id}`);
    renderRooms(rooms || []);
  } catch (err) {
    nameEl.textContent = "Error cargando hotel";
    msgEl.textContent = `Error: ${err.message || "No Found"}`;
  }
}

function renderRooms(items) {
  if (!items.length) {
    msgEl.textContent = "No hay habitaciones para este hotel.";
    roomsEl.innerHTML = "";
    return;
  }
  msgEl.textContent = "";
  roomsEl.innerHTML = items.map(r => roomCard(r)).join("");

  // wire buttons
  items.forEach(r => {
    const btn = document.getElementById(`btn-reservar-${r.id}`);
    if (btn) btn.addEventListener("click", () => onReservar(r));
  });
}

function roomCard(r) {
  const precio = r.precio != null ? `S/ ${Number(r.precio).toFixed(2)}` : "—";
  return `
    <article class="card" style="padding:1rem">
      <h3 style="margin:0 0 .25rem 0;">Hab. ${r.numero} · ${r.tipo || ""}</h3>
      <p class="muted" style="margin:.25rem 0;">Precio: <strong>${precio}</strong></p>
      <button class="btn small" id="btn-reservar-${r.id}">Comprobar y reservar</button>
      <p id="status-${r.id}" class="muted" style="margin-top:.25rem;"></p>
    </article>
  `;
}

async function onReservar(room) {
  const d = getDates();
  if (!d.ok) { dateMsgEl.textContent = d.error; return; }
  dateMsgEl.textContent = "";

  const statusEl = document.getElementById(`status-${room.id}`);
  statusEl.textContent = "Comprobando disponibilidad...";

  try {
    // 1) disponibilidad
    const disp = await request(`/api/habitaciones/disponibilidad?habitacionId=${room.id}&inicio=${d.inicio}&fin=${d.fin}`);
    if (!disp?.disponible) {
      statusEl.textContent = "❌ No disponible en ese rango.";
      return;
    }
    statusEl.textContent = "✅ Disponible. Reservando...";

    // 2) si no estás logueado, te llevo a login y vuelves aquí
    if (!isLoggedIn()) {
      sessionStorage.setItem("postLoginRedirect", location.href);
      sessionStorage.setItem("preselectedDates", JSON.stringify({ inicio: d.inicio, fin: d.fin }));
      location.href = "login.html";
      return;
    }

    // 3) crear reserva
    const reserva = await request(`/api/reservas`, {
      method: "POST",
      body: { habitacionId: room.id, fechaInicio: d.inicio, fechaFin: d.fin }
    });

    statusEl.textContent = "";
    showToast(`Reserva creada #${reserva.id} 🎉`, 2000);
  } catch (err) {
    console.error(err);
    statusEl.textContent = `Error: ${err.message || "No se pudo reservar"}`;
  }
}

// Si venimos de login, recuperar fechas preseleccionadas
(function restoreDates() {
  try {
    const saved = sessionStorage.getItem("preselectedDates");
    if (saved) {
      const { inicio, fin } = JSON.parse(saved);
      if (inicio && fin) { inicioEl.value = inicio; finEl.value = fin; }
      sessionStorage.removeItem("preselectedDates");
    }
  } catch {}
})();

load();

