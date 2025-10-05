// js/main.js
import { getToken, clearToken } from "./api.js";

const btnLogout = document.getElementById("btn-logout");
const linkLogin = document.getElementById("link-login");

function updateNav(){
  const token = getToken();
  if(token){
    if(btnLogout) btnLogout.hidden = false;
    if(linkLogin) linkLogin.hidden = true;
  } else {
    if(btnLogout) btnLogout.hidden = true;
    if(linkLogin) linkLogin.hidden = false;
  }
}

if(btnLogout){
  btnLogout.addEventListener("click", ()=> {
    clearToken();
    updateNav();
    location.href = "index.html";
  });
}

updateNav();
