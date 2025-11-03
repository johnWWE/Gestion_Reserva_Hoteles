// frontend/js/rooms.js
import { request } from "./api.js";

const filterHotel = document.getElementById("filterHotel");
const btnReload = document.getElementById("btnReload");
const tbody = document.getElementById("tbody");
const listMsg = document.getElementById("listMsg");

const c_hotel = document.getElementById("c_hotel");
const c_numero = document.getElementById("c_numero");
const c_tipo = document.getElementById("c_tipo");
const c_capacidad = document.getElementById("c_capacidad");
const c_precio = document.getElementById("c_precio");
const formCreate = document.getElementById("formCreate");
const createMsg = document.getElementById("createMsg");

function ensureAdmin() {
  const role = localStorage.getItem("userRole");
  const token = localStorage.getItem("token");
  if (!token) { location.href = "login.html"; return false; }
  if (role !== "admin") { listMsg.textContent = "Acceso restringido: solo administradores."; return false; }
  return true;
}

async function loadHotelsInto(selectEl, withAllOption = false) {
  const hotels = await request("/api/hoteles");
  selectEl.innerHTML = "";
  if (withAllOption) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "— Todos los hoteles —";
    selectEl.appendChild(opt);
  }
  hotels.forEach(h => {
    const o = document.createElement("option");
    o.value = h.id;
    o.textContent = `${h.id} · ${h.nombre}`;
    selectEl.appendChild(o);
  });
}

async function loadRooms() {
  listMsg.textContent = "Cargando habitaciones...";
  tbody.innerHTML = "";
  const hotelId = filterHotel.value;
  const path = hotelId ? `/api/habitaciones?hotelId=${hotelId}` : "/api/habitaciones";
  try {
    const rooms = await request(path);
    renderRooms(rooms || []);
    listMsg.textContent = rooms?.length ? "" : "No hay habitaciones.";
  } catch (err) {
    listMsg.textContent = `Error: ${err.message || "No se pudo cargar"}`;
  }
}

function renderRooms(items) {
  tbody.innerHTML = items.map(r => rowHTML(r)).join("");
  items.forEach(r => {
    const bE = document.getElementById(`edit-${r.id}`);
    const bD = document.getElementById(`del-${r.id}`);
    if (bE) bE.addEventListener("click", () => onEdit(r));
    if (bD) bD.addEventListener("click", () => onDelete(r));
  });
}

function rowHTML(r) {
  const precio = r.precio != null ? `S/ ${Number(r.precio).toFixed(2)}` : "—";
  return `
    <tr>
      <td>${r.id}</td>
      <td>${r.hotelId}</td>
      <td>${r.numero ?? ""}</td>
      <td>${r.tipo ?? ""}</td>
      <td>${r.capacidad ?? ""}</td>
      <td>${precio}</td>
      <td>
        <a class="btn small" href="hotel.html?id=${r.hotelId}">Ver hotel</a>
        <button class="btn small" id="edit-${r.id}">Editar</button>
        <button class="btn small" id="del-${r.id}">Eliminar</button>
      </td>
    </tr>
  `;
}

formCreate.addEventListener("submit", async (e) => {
  e.preventDefault();
  createMsg.textContent = "Creando...";
  try {
    const body = {
      hotelId: Number(c_hotel.value),
      numero: c_numero.value.trim(),
      tipo: c_tipo.value.trim(),
      capacidad: Number(c_capacidad.value),   // 👈 ahora enviamos capacidad
      precio: Number(c_precio.value)
    };
    await request("/api/habitaciones", { method: "POST", body });
    createMsg.textContent = "✅ Habitación creada";
    formCreate.reset();
    await loadRooms();
  } catch (err) {
    createMsg.textContent = `Error: ${err.message || "No se pudo crear"}`;
  }
});

async function onEdit(r) {
  const numero = prompt("Número de habitación:", r.numero ?? "");
  if (numero === null) return;
  const tipo = prompt("Tipo:", r.tipo ?? "");
  if (tipo === null) return;
  const capStr = prompt("Capacidad:", r.capacidad ?? "2");
  if (capStr === null) return;
  const capacidad = Number(capStr);
  const precioStr = prompt("Precio:", r.precio ?? "");
  if (precioStr === null) return;
  const precio = Number(precioStr);

  try {
    await request(`/api/habitaciones/${r.id}`, {
      method: "PUT",
      body: { numero, tipo, capacidad, precio } // 👈 actualizar capacidad también
    });
    await loadRooms();
  } catch (err) {
    alert(`Error: ${err.message || "No se pudo editar"}`);
  }
}

async function onDelete(r) {
  if (!confirm(`Eliminar habitación #${r.id}?`)) return;
  try {
    await request(`/api/habitaciones/${r.id}`, { method: "DELETE" });
    await loadRooms();
  } catch (err) {
    alert(`Error: ${err.message || "No se pudo eliminar"}`);
  }
}

async function init() {
  if (!ensureAdmin()) return;
  await loadHotelsInto(filterHotel, true);
  await loadHotelsInto(c_hotel, false);
  await loadRooms();
}

filterHotel.addEventListener("change", loadRooms);
btnReload.addEventListener("click", loadRooms);

init();
