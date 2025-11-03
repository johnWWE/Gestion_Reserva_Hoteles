// frontend/js/admin-hotels.js
import { request } from "./api.js";

const tbody = document.getElementById("tbody");
const listMsg = document.getElementById("listMsg");
const btnReload = document.getElementById("btnReload");

const formCreate = document.getElementById("formCreate");
const c_nombre = document.getElementById("c_nombre");
const c_direccion = document.getElementById("c_direccion");
const c_estrellas = document.getElementById("c_estrellas");
const createMsg = document.getElementById("createMsg");

function ensureAdmin() {
  const role = localStorage.getItem("userRole");
  const token = localStorage.getItem("token");
  if (!token) { location.href = "login.html"; return false; }
  if (role !== "admin") { listMsg.textContent = "Acceso restringido: solo administradores."; return false; }
  return true;
}

async function loadHotels() {
  listMsg.textContent = "Cargando hoteles...";
  try {
    const hotels = await request("/api/hoteles");
    render(hotels || []);
    listMsg.textContent = hotels?.length ? "" : "No hay hoteles.";
  } catch (err) {
    listMsg.textContent = `Error: ${err.message || "No se pudo cargar"}`;
  }
}

function render(items) {
  tbody.innerHTML = items.map(h => rowHTML(h)).join("");
  items.forEach(h => {
    const bE = document.getElementById(`edit-${h.id}`);
    const bD = document.getElementById(`del-${h.id}`);
    if (bE) bE.addEventListener("click", () => onEdit(h));
    if (bD) bD.addEventListener("click", () => onDelete(h));
  });
}

function rowHTML(h) {
  return `
    <tr>
      <td>${h.id}</td>
      <td>${h.nombre ?? ""}</td>
      <td>${h.direccion ?? ""}</td>
      <td>${h.estrellas ?? ""}</td>
      <td>
        <a class="btn small" href="hotel.html?id=${h.id}">Ver</a>
        <button class="btn small" id="edit-${h.id}">Editar</button>
        <button class="btn small" id="del-${h.id}">Eliminar</button>
      </td>
    </tr>
  `;
}

formCreate.addEventListener("submit", async (e) => {
  e.preventDefault();
  createMsg.textContent = "Creando...";
  try {
    const body = {
      nombre: c_nombre.value.trim(),
      direccion: c_direccion.value.trim(),
      estrellas: Number(c_estrellas.value),
    };
    await request("/api/hoteles", { method: "POST", body });
    createMsg.textContent = "✅ Hotel creado";
    formCreate.reset();
    await loadHotels();
  } catch (err) {
    createMsg.textContent = `Error: ${err.message || "No se pudo crear"}`;
  }
});

async function onEdit(h) {
  const nombre = prompt("Nombre:", h.nombre ?? "");
  if (nombre === null) return;
  const direccion = prompt("Dirección:", h.direccion ?? "");
  if (direccion === null) return;
  const estStr = prompt("Estrellas (1-5):", h.estrellas ?? "3");
  if (estStr === null) return;
  const estrellas = Number(estStr);

  try {
    await request(`/api/hoteles/${h.id}`, { method: "PUT", body: { nombre, direccion, estrellas } });
    await loadHotels();
  } catch (err) {
    alert(`Error: ${err.message || "No se pudo editar"}`);
  }
}

async function onDelete(h) {
  if (!confirm(`Eliminar hotel "${h.nombre}" (#${h.id})?`)) return;
  try {
    await request(`/api/hoteles/${h.id}`, { method: "DELETE" });
    await loadHotels();
  } catch (err) {
    alert(`Error: ${err.message || "No se pudo eliminar"}`);
  }
}

btnReload.addEventListener("click", loadHotels);

(function init() {
  if (!ensureAdmin()) return;
  loadHotels();
})();
