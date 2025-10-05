// js/reservations.js
import { request } from "./api.js";
import { formatDate } from "./utils.js";

const listEl = document.getElementById("myReservations");

async function loadReservations(){
  try{
    const reservas = await request("/reservas");
    if(!reservas.length) { listEl.innerHTML = "<p>No tienes reservas.</p>"; return; }
    listEl.innerHTML = reservas.map(r => `
      <article class="card">
        <h4>Reserva #${r.id} — ${r.estado}</h4>
        <p>Habitación: ${r.habitacionId}</p>
        <p>Desde: ${formatDate(r.fechaInicio)} - Hasta: ${formatDate(r.fechaFin)}</p>
        <div class="meta">
          <button class="btn small cancelBtn" data-id="${r.id}">Cancelar</button>
        </div>
      </article>
    `).join("");

    document.querySelectorAll(".cancelBtn").forEach(b=>{
      b.addEventListener("click", async (e)=>{
        const id = e.currentTarget.dataset.id;
        try{
          await request(`/reservas/${id}`, { method: "DELETE" });
          loadReservations();
        }catch(err){
          alert("Error cancelando: " + (err.message || ""));
        }
      });
    });

  }catch(err){
    listEl.innerHTML = `<p>Error: ${err.message}</p>`;
  }
}

document.addEventListener("DOMContentLoaded", loadReservations);
