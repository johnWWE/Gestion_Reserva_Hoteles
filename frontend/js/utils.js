// js/utils.js
export function showMessage(el, text, type="info"){
  el.textContent = text;
  el.style.color = type === "error" ? "#c53030" : "#15803d";
  setTimeout(()=>{ el.textContent = ""; }, 4000);
}

export function formatDate(dateStr){
  if(!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString();
}

export function getQueryParam(name){
  return new URLSearchParams(location.search).get(name);
}
