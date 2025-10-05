// js/hotels.js
import { request } from "./api.js";

const listEl = document.getElementById("hotelsList");
const searchEl = document.getElementById("search");

async function loadHotels(){
  try{
    const hoteles = await request("/hotels");
    renderHotels(hoteles || []);
  }catch(err){
    listEl.innerHTML = `<p>Error cargando hoteles: ${err.message}</p>`;
    console.error(err);
  }
}

function renderHotels(hoteles){
  if(!hoteles.length) {
    listEl.innerHTML = "<p>No hay hoteles disponibles.</p>";
    return;
  }
  listEl.innerHTML = hoteles.map(h => `
    <article class="card" aria-label="hotel ${h.nombre}">
      <h4>${h.nombre}</h4>
      <p class="muted">${h.ciudad || h.direccion || ""}</p>
      <p>${h.descripcion || ""}</p>
      <div class="meta">
        <a class="btn small" href="hotel.html?id=${h.id}">Ver</a>
      </div>
    </article>
  `).join("");
}

if(searchEl){
  searchEl.addEventListener("input", (e)=>{
    const q = e.target.value.toLowerCase();
    document.querySelectorAll("#hotelsList .card").forEach(card=>{
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(q) ? "" : "none";
    });
  });
}

document.addEventListener("DOMContentLoaded", loadHotels);
