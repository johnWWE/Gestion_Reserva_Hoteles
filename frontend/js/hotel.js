// js/hotel.js
import { request, getToken } from "./api.js";
import { getQueryParam } from "./utils.js";

const hotelDetail = document.getElementById("hotelDetail");
const roomsList = document.getElementById("roomsList");
const modal = document.getElementById("reserveModal");
const reserveForm = document.getElementById("reserveForm");
const habitacionIdInput = document.getElementById("habitacionId");
const cancelBtn = document.getElementById("cancelReserve");
const reserveMsg = document.getElementById("reserveMsg");

const id = getQueryParam("id");

async function loadHotel(){
  try{
    const hotels = await request("/hotels");
    const hotel = hotels.find(h => String(h.id) === String(id));
    if(!hotel) { hotelDetail.innerHTML = "<p>Hotel no encontrado</p>"; return; }
    hotelDetail.innerHTML = `<h2>${hotel.nombre}</h2><p>${hotel.descripcion || ''}</p><p>${hotel.direccion || ''}</p>`;
    // Cargar habitaciones y filtrar por hotelId
    const habitaciones = await request("/habitaciones");
    const rooms = habitaciones.filter(r => String(r.hotelId) === String(id));
    renderRooms(rooms);
  }catch(err){
    hotelDetail.innerHTML = `<p>Error: ${err.message}</p>`;
    console.error(err);
  }
}

function renderRooms(rooms){
  if(!rooms.length){ roomsList.innerHTML = "<p>No hay habitaciones.</p>"; return; }
  roomsList.innerHTML = rooms.map(r => `
    <article class="card">
      <h4>${r.tipo} — Nº ${r.numero}</h4>
      <p>Precio: S/ ${r.precio}</p>
      <p>${r.disponible ? "Disponible" : "No disponible"}</p>
      <div class="meta">
        <button class="btn small reserveBtn" data-id="${r.id}" ${!r.disponible ? "disabled" : ""}>Reservar</button>
      </div>
    </article>
  `).join("");

  document.querySelectorAll(".reserveBtn").forEach(b=>{
    b.addEventListener("click",(e)=>{
      if(!getToken()) { alert("Debes iniciar sesión para reservar"); location.href = "login.html"; return; }
      const hid = e.currentTarget.dataset.id;
      habitacionIdInput.value = hid;
      modal.classList.remove("hidden");
    })
  });
}

if(cancelBtn){
  cancelBtn.addEventListener("click", ()=> modal.classList.add("hidden"));
}

if(reserveForm){
  reserveForm.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const habitacionId = habitacionIdInput.value;
    const fechaInicio = document.getElementById("fechaInicio").value;
    const fechaFin = document.getElementById("fechaFin").value;
    try{
      const payload = { habitacionId: Number(habitacionId), fechaInicio, fechaFin };
      const res = await request("/reservas", { method: "POST", body: JSON.stringify(payload) });
      reserveMsg.textContent = "Reserva creada";
      setTimeout(()=> {
        modal.classList.add("hidden");
        location.href = "reservations.html";
      }, 900);
    }catch(err){
      reserveMsg.textContent = err.message || "Error creando reserva";
      reserveMsg.style.color = "crimson";
    }
  });
}

document.addEventListener("DOMContentLoaded", loadHotel);
