// frontend/js/admin-hotels.js
import { request, requestRaw} from "./api.js";
import { API_URL } from "./config.js";

const tbody = document.getElementById("tbody");
const listMsg = document.getElementById("listMsg");
const btnReload = document.getElementById("btnReload");

const formCreate = document.getElementById("formCreate");
const c_nombre = document.getElementById("c_nombre");
const c_direccion = document.getElementById("c_direccion");
const c_estrellas = document.getElementById("c_estrellas");
const createMsg = document.getElementById("createMsg");

// --- Elementos para subir imagen ---
const uploadInput = document.getElementById("uploadInput");
const uploadMsg = document.getElementById("uploadMsg");

let selectedHotelId = null;

// ============================
// VALIDAR ADMIN
// ============================
function ensureAdmin() {
  const role = localStorage.getItem("userRole");
  const token = localStorage.getItem("token");

  if (!token) {
    location.href = "login.html";
    return false;
  }
  if (role !== "admin") {
    listMsg.textContent = "Acceso restringido: solo administradores.";
    return false;
  }
  return true;
}

// ============================
// CARGAR HOTELES
// ============================
async function loadHotels() {
  listMsg.textContent = "Cargando hoteles...";
  try {
    const hotels = await request("/api/hoteles");
    render(hotels || []);
    listMsg.textContent = hotels?.length ? "" : "No hay hoteles.";
  } catch (err) {
    listMsg.textContent = `Error: ${err.message}`;
  }
}

// ============================
// RENDER TABLA
// ============================
function render(items) {
  tbody.innerHTML = items.map(h => rowHTML(h)).join("");

  items.forEach(h => {
    document.getElementById(`edit-${h.id}`).addEventListener("click", () => onEdit(h));
    document.getElementById(`del-${h.id}`).addEventListener("click", () => onDelete(h));
    document.getElementById(`img-${h.id}`).addEventListener("click", () => selectImage(h));
  });
}

function rowHTML(h) {
  const img = h.fotoUrl 
    ? `${API_URL}${h.fotoUrl}`
    : "./img/no-image.png";

  return `
    <tr>
      <td>${h.id}</td>
      <td><img src="${img}" style="width:70px;height:50px;object-fit:cover;border-radius:4px;"></td>
      <td>${h.nombre}</td>
      <td>${h.direccion}</td>
      <td>${h.estrellas}</td>
      <td>
        <button class="btn small" id="img-${h.id}">Imagen</button>
        <button class="btn small" id="edit-${h.id}">Editar</button>
        <button class="btn small" id="del-${h.id}">Eliminar</button>
      </td>
    </tr>
  `;
}

// ============================
// SUBIR IMAGEN (FETCH NATIVO)
// ============================

function selectImage(hotel) {
  selectedHotelId = hotel.id;
  uploadMsg.textContent = `Selecciona una imagen para: ${hotel.nombre}`;
  uploadInput.click();
}

uploadInput.addEventListener("change", async () => {
  if (!selectedHotelId) return;

  const file = uploadInput.files[0];
  if (!file) return;

  uploadMsg.textContent = "Subiendo imagen...";

  try {
    const formData = new FormData();
    formData.append("imagen", file);

    await requestRaw(`/api/hoteles/upload-image/${selectedHotelId}`, {
    method: "POST",
    body: formData
  });

    uploadMsg.textContent = "✅ Imagen subida correctamente";
    setTimeout(() => (uploadMsg.textContent = ""), 2000);

    loadHotels();
  } catch (err) {
    uploadMsg.textContent = `❌ Error: ${err.message}`;
  }
});

// ============================
// CREAR HOTEL
// ============================
formCreate.addEventListener("submit", async (e) => {
  e.preventDefault();
  createMsg.textContent = "Creando...";

  try {
    const body = {
      nombre: c_nombre.value.trim(),
      direccion: c_direccion.value.trim(),
      estrellas: Number(c_estrellas.value),
    };

    await request("/api/hoteles", {
      method: "POST",
      body
    });

    createMsg.textContent = "✔ Hotel creado";
    formCreate.reset();
    loadHotels();
  } catch (err) {
    createMsg.textContent = `Error: ${err.message}`;
  }
});

// ============================
// EDITAR HOTEL
// ============================
async function onEdit(h) {
  const nombre = prompt("Nombre:", h.nombre);
  if (nombre === null) return;

  const direccion = prompt("Dirección:", h.direccion);
  if (direccion === null) return;

  const estrellas = prompt("Estrellas (1-5):", h.estrellas);
  if (estrellas === null) return;

  try {
    await request(`/api/hoteles/${h.id}`, {
      method: "PUT",
      body: { nombre, direccion, estrellas: Number(estrellas) }
    });
    loadHotels();
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
}

// ============================
// ELIMINAR HOTEL
// ============================
async function onDelete(h) {
  if (!confirm(`Eliminar hotel "${h.nombre}" (#${h.id})?`)) return;

  try {
    await request(`/api/hoteles/${h.id}`, {
      method: "DELETE"
    });
    loadHotels();
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
}

btnReload.addEventListener("click", loadHotels);

// ============================
// INIT
// ============================
(function init() {
  if (!ensureAdmin()) return;
  loadHotels();
})();
