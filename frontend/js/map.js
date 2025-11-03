// frontend/js/map.js
import { API_URL } from "./config.js";
import { showMessage } from "./utils.js";

const mapEl = document.getElementById("map");
if (mapEl) {
  const map = L.map("map").setView([-12.0464, -77.0428], 12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap",
  }).addTo(map);

  const markers = [];
  const addMarker = (lat, lon, label) => {
    const m = L.marker([lat, lon]).addTo(map);
    if (label) m.bindPopup(label);
    markers.push(m);
    return m;
  };
  const clearMarkers = () => markers.forEach(m => map.removeLayer(m));

  async function geocode(q) {
    const res = await fetch(`${API_URL}/api/external/geocode?q=${encodeURIComponent(q)}`);
    if (!res.ok) throw new Error("Error geocodificación");
    return res.json();
  }

  // Buscador
  const form = document.getElementById("geosearch");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const q = document.getElementById("q").value.trim();
    if (!q) return;
    try {
      clearMarkers();
      const data = await geocode(q);
      if (!data?.length) {
        showMessage(mapEl, "No se encontraron resultados", "error");
        return;
      }
      const { lat, lon, display_name } = data[0];
      addMarker(lat, lon, display_name);
      map.setView([lat, lon], 15);
    } catch (err) {
      console.error(err);
      showMessage(mapEl, "Error buscando ubicación", "error");
    }
  });

  // Opcional: si hay tarjetas con data-address, las pinta en el mapa
  const cards = document.querySelectorAll("[data-address]");
  (async () => {
    for (const el of cards) {
      const addr = el.getAttribute("data-address");
      if (!addr) continue;
      try {
        const res = await geocode(addr);
        if (res && res[0]) {
          const { lat, lon } = res[0];
          const name = el.querySelector(".title")?.textContent || addr;
          addMarker(lat, lon, name);
        }
        await new Promise(r => setTimeout(r, 800)); // respetar Nominatim
      } catch {}
    }
  })();
}
