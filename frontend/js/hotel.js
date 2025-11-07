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

// Reemplaza toISOFromInput por esta versión
function toISOFromInput(el) {
  // 1) Si el input ya está en 'YYYY-MM-DD', úsalo tal cual (NO toques zonas horarias)
  const raw = (el.value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  // 2) Si viene 'dd/mm/yyyy', normaliza
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
    const [d, m, y] = raw.split("/");
    return `${y}-${m}-${d}`;
  }

  // 3) Último recurso: si llega algo tipo ISO completo, recorta a YYYY-MM-DD
  //    (no conviertas a Date para evitar corrimientos)
  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) return raw.slice(0, 10);

  return raw; // tal cual
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
    const h = await request(`/api/hoteles/${id}`);
    nameEl.textContent = h.nombre || `Hotel #${id}`;
    infoEl.textContent = `${h.direccion || ""} · ${h.estrellas ? "⭐".repeat(h.estrellas) : ""}`;

    const rooms = await request(`/api/habitaciones?hotelId=${id}`);
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
    <article class="room-card">
      <div class="room-head">
        <h3 class="room-title">Hab. ${r.numero} ${r.tipo ? "· "+r.tipo : ""}</h3>
        <div class="room-price">
          <div class="price-amount">${r.precio != null ? `S/ ${Number(r.precio).toFixed(2)}` : "—"}</div>
          <small class="muted">Precio</small>
        </div>
      </div>

      <div class="busy-wrap">
        <div class="busy-title">Fechas ocupadas (próx. 90 días)</div>
        <div class="busy-chips" id="busy-${r.id}">
          <span class="muted">Cargando…</span>
        </div>
      </div>

      <div class="room-actions">
        <button class="btn" data-room="${r.id}">Comprobar y reservar</button>
        <p id="status-${r.id}" class="muted" style="margin-top:.25rem;"></p>
      </div>
    </article>
  `).join("");

  // listeners de reservar
  roomsEl.querySelectorAll("button[data-room]").forEach(btn => {
    btn.addEventListener("click", () => onReservar(Number(btn.dataset.room)));
  });

  // cargar rangos ocupados por habitación (ventana: hoy → +90d)
  const today = new Date(); today.setHours(0,0,0,0);
  const inicio = today.toISOString().slice(0,10);
  const fin = new Date(today.getTime() + 90*24*3600*1000).toISOString().slice(0,10);

  items.forEach(async (r) => {
    const box = document.getElementById(`busy-${r.id}`);
    try {
      const rangos = await request(`/api/habitaciones/${r.id}/ocupadas?inicio=${inicio}&fin=${fin}`);
      renderBusyChips(box, rangos);
    } catch (e) {
    console.error("Ocupadas error:", e);
    box.innerHTML = `<span class="muted">No se pudo cargar</span>`;
}
  });
}

// pinta chips tipo “05–07 nov”
function renderBusyChips(container, rangos) {
  if (!rangos?.length) {
    container.innerHTML = `<span class="muted">Sin ocupación próxima</span>`;
    return;
  }
  const html = rangos.map(r => {
    return `<span class="chip chip-busy" title="${r.fechaInicio} → ${r.fechaFin} (${r.estado})">
      ${fmtRange(r.fechaInicio, r.fechaFin)}
    </span>`;
  }).join("");
  container.innerHTML = html;
}

// “2025-11-05, 2025-11-07” → “05–07 nov”
function fmtRange(a, b) {
  const da = new Date(a+"T00:00:00");
  const db = new Date(b+"T00:00:00");
  const mm = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  const d1 = String(da.getDate()).padStart(2,"0");
  const d2 = String(db.getDate()).padStart(2,"0");
  const m1 = mm[da.getMonth()];
  const m2 = mm[db.getMonth()];
  return (da.getMonth()===db.getMonth())
    ? `${d1}–${d2} ${m1}`
    : `${d1} ${m1} – ${d2} ${m2}`;
}


async function onReservar(habitacionId) {
  const d = getDates();
  if (!d.ok) { dateMsgEl.textContent = d.error; return; }
  dateMsgEl.textContent = "";

  const statusEl = document.getElementById(`status-${habitacionId}`);
  statusEl.textContent = "Comprobando disponibilidad...";

  try {
    // 1) disponibilidad (con debug=1 para ver bloqueadoras si las hay)
    const disp = await request(
      `/api/habitaciones/disponibilidad?habitacionId=${habitacionId}&inicio=${d.inicio}&fin=${d.fin}&debug=1`
    );

    // logs de depuración
    console.log("Disponibilidad ->", { habitacionId, ...d, respuesta: disp });

    // Acepta boolean o string "true"
    const esDisponible = disp?.disponible === true || disp?.disponible === "true";

    if (!esDisponible) {
      statusEl.textContent = "❌ No disponible en ese rango.";
      if (disp && typeof disp === "object") {
        console.warn("Bloqueadoras:", disp.bloqueadoras || disp.solapes);
      }
      return;
    }
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
    console.error("Reservar error:", err);
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


