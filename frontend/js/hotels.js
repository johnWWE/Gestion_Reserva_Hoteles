// frontend/js/hotels.js
import { request } from "./api.js";
import { API_URL } from "./config.js";

// BASE del backend (sin tocar nada más)
const BASE_URL = API_URL.replace(/\/$/, ""); // por si algún día pones una barra al final



function getHotelImage(hotel) {
  if (!hotel.fotoUrl) return placeholderImg(hotel);

  // Asegurar que la URL empieza con "/"
  const clean = hotel.fotoUrl.startsWith("/")
    ? hotel.fotoUrl
    : "/" + hotel.fotoUrl;

  // URL final
  return `${BASE_URL}${clean}`;
}

const listEl  = document.getElementById("hotelsList");
const searchEl = document.getElementById("search");

// Filtros UI
const cityChipsEl = document.getElementById("cityChips");
const starChipsEl = document.getElementById("starChips");
const priceMinEl  = document.getElementById("priceMin");
const priceMaxEl  = document.getElementById("priceMax");
const btnPrice    = document.getElementById("btnPrice");
const btnClearPrice = document.getElementById("btnClearPrice");
const btnReset    = document.getElementById("btnReset");

const state = {
  all: [],
  q: "",
  cities: new Set(),
  stars: new Set(),
  priceMin: null,
  priceMax: null,
};

function cityFromAddress(addr = "") {
  const parts = String(addr).split(",").map(s => s.trim()).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : "";
}

function scoreFromStars(stars) {
  const s = Number(stars || 0);
  return Math.max(7.5, Math.min(10, 7.5 + s * 0.5)).toFixed(1);
}

function placeholderImg(hotel) {
  const city = cityFromAddress(hotel.direccion);
  return `https://source.unsplash.com/400x300/?hotel,${encodeURIComponent(city || hotel.nombre)}`;
}

async function minPriceForHotel(hotelId) {
  try {
    const rooms = await request(`/api/habitaciones?hotelId=${hotelId}`);
    if (!rooms?.length) return { min: null, count: 0 };
    const min = rooms.reduce((acc, r) => {
      const p = Number(r.precio || 0);
      return acc === null ? p : Math.min(acc, p);
    }, null);
    return { min, count: rooms.length };
  } catch {
    return { min: null, count: 0 };
  }
}

function renderRows(list) {
  if (!list.length) {
    listEl.innerHTML = `<p class="muted">No se encontraron hoteles.</p>`;
    return;
  }

  listEl.innerHTML = list.map(h => {
  const img = getHotelImage(h);
  console.log("Hotel:", h.nombre, "URL imagen:", img);

  const score = scoreFromStars(h.estrellas);
  const city  = cityFromAddress(h.direccion);
  const price = (h._minPrice != null)
    ? `<div class="price">S/ ${Number(h._minPrice).toFixed(2)}<small>Precio desde</small></div>`
    : `<div class="price"><small>Sin precio</small></div>`;

  return `
    <article class="hotel-row">
      <img class="hotel-thumb"
           src="${img}"
           alt="Foto de ${h.nombre}"
           style="width: 220px; height: 150px; object-fit: cover;"
           onerror="this.src='https://source.unsplash.com/400x300/?hotel';">

      <div class="hotel-info">
        <h3>${h.nombre}<span class="badge-score">${score}</span></h3>
        <div class="hotel-meta">
          ${h.direccion || ""}${city ? ` · ${city}` : ""}
          ${h.estrellas ? ` · ${"⭐".repeat(Number(h.estrellas))}` : ""}
        </div>
      </div>

      <div class="hotel-cta">
        ${price}
        <button class="hotel-btn secondary" data-loc="${h.direccion || ''} ${h.nombre}">
          Ver ubicación
        </button>
        <a class="hotel-btn" href="hotel.html?id=${h.id}">Ver disponibilidad</a>
      </div>

    </article>
  `;
}).join("");

}

/* ------------------- Filtros ------------------- */
function buildCityChips(all) {
  const cities = Array.from(new Set(all.map(h => cityFromAddress(h.direccion)).filter(Boolean))).sort();
  cityChipsEl.innerHTML = cities.map(c =>
    `<button class="chip" data-city="${encodeURIComponent(c)}">${c}</button>`
  ).join("") || `<span class="muted">Sin ciudades</span>`;

  cityChipsEl.querySelectorAll("button[data-city]").forEach(btn => {
    const val = decodeURIComponent(btn.dataset.city);
    btn.addEventListener("click", () => {
      if (state.cities.has(val)) state.cities.delete(val); else state.cities.add(val);
      btn.classList.toggle("active");
      applyFilter();
    });
  });
}

function buildStarChips(all) {
  const set = new Set(all.map(h => Number(h.estrellas || 0)).filter(Boolean));
  const stars = Array.from(set).sort((a,b)=>a-b);
  starChipsEl.innerHTML = stars.map(s =>
    `<button class="chip badge" data-star="${s}">${"⭐".repeat(s)}</button>`
  ).join("") || `<span class="muted">Sin estrellas</span>`;

  starChipsEl.querySelectorAll("button[data-star]").forEach(btn => {
    const s = Number(btn.dataset.star);
    btn.addEventListener("click", () => {
      if (state.stars.has(s)) state.stars.delete(s); else state.stars.add(s);
      btn.classList.toggle("active");
      applyFilter();
    });
  });
}

function hookPrice() {
  btnPrice?.addEventListener("click", () => {
    const min = priceMinEl.value ? Number(priceMinEl.value) : null;
    const max = priceMaxEl.value ? Number(priceMaxEl.value) : null;
    state.priceMin = Number.isFinite(min) ? min : null;
    state.priceMax = Number.isFinite(max) ? max : null;
    applyFilter();
  });
  btnClearPrice?.addEventListener("click", () => {
    priceMinEl.value = ""; priceMaxEl.value = "";
    state.priceMin = null; state.priceMax = null;
    applyFilter();
  });
}

function applyFilter() {
  const q = state.q.toLowerCase().trim();
  let rows = state.all.slice();

  if (q) {
    rows = rows.filter(h =>
      String(h.nombre).toLowerCase().includes(q) ||
      String(h.direccion).toLowerCase().includes(q)
    );
  }

  if (state.cities.size) {
    rows = rows.filter(h => state.cities.has(cityFromAddress(h.direccion)));
  }

  if (state.stars.size) {
    rows = rows.filter(h => state.stars.has(Number(h.estrellas || 0)));
  }

  if (state.priceMin != null || state.priceMax != null) {
    rows = rows.filter(h => {
      const p = h._minPrice == null ? null : Number(h._minPrice);
      if (p == null) return false;
      if (state.priceMin != null && p < state.priceMin) return false;
      if (state.priceMax != null && p > state.priceMax) return false;
      return true;
    });
  }

  renderRows(rows);
}

searchEl?.addEventListener("input", () => {
  state.q = searchEl.value || "";
  applyFilter();
});

btnReset?.addEventListener("click", () => {
  state.cities.clear();
  state.stars.clear();
  state.priceMin = null;
  state.priceMax = null;
  priceMinEl.value = "";
  priceMaxEl.value = "";
  document.querySelectorAll(".chip.active").forEach(el => el.classList.remove("active"));
  if (searchEl) searchEl.value = "";
  state.q = "";
  applyFilter();
});

/* --------------- Carga inicial --------------- */
async function loadHotels() {
  listEl.innerHTML = `<p class="muted">Cargando hoteles…</p>`;
  const hotels = await request("/api/hoteles");

  console.log("Hoteles desde API:", hotels); // 👈 para ver qué llega desde el backend

  const withPrices = await Promise.all(hotels.map(async h => {
    const { min } = await minPriceForHotel(h.id);
    return { ...h, _minPrice: min };
  }));

  state.all = withPrices;
  buildCityChips(state.all);
  buildStarChips(state.all);
  hookPrice();
  applyFilter();
}
loadHotels();
// ===============================
// MAPA – Ver ubicación
// ===============================
// ===============================
// VER UBICACIÓN – Redirigir a Google Maps
// ===============================
document.addEventListener("click", async (e) => {
  if (!e.target.matches("[data-loc]")) return;

  const query = e.target.dataset.loc.trim();
  if (!query) {
    alert("Dirección no disponible.");
    return;
  }

  try {
    // Buscar ubicación con la API del backend
    const geo = await fetch(`${API_URL}/api/external/geocode?q=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .catch(() => []);

    if (geo.length > 0) {
      // Caso 1: Ubicación exacta encontrada
      const lat = parseFloat(geo[0].lat);
      const lon = parseFloat(geo[0].lon);
      const url = `https://www.google.com/maps?q=${lat},${lon}`;
      window.open(url, "_blank");
      return;
    }

    // Caso 2: No encontró dirección exacta → usar ciudad
    const city = query.split(",").pop().trim();
    if (city) {
      const url = `https://www.google.com/maps?q=${encodeURIComponent(city)}`;
      window.open(url, "_blank");
      return;
    }

    // Caso 3: Nada disponible
    alert("No se pudo obtener la ubicación.");
  } catch (err) {
    alert("Error al buscar ubicación.");
  }
});





