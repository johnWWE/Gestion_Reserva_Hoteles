// frontend/js/utils.js
export function showMessage(el, text, type = "info") {
  el.textContent = text;
  el.style.color = type === "error" ? "#c53030" : "#15803d";
  setTimeout(() => { el.textContent = ""; }, 4000);
}

export function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString();
}

export function getQueryParam(name) {
  return new URLSearchParams(location.search).get(name);
}

// Toast minimal para avisos cortos (bienvenida, etc)
export function showToast(message = "", ms = 1800) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message || "Hecho";
  Object.assign(el.style, {
    position: "fixed", left: "50%", top: "24px", transform: "translateX(-50%)",
    background: "#111", color: "#fff", padding: ".75rem 1rem", borderRadius: "10px",
    boxShadow: "0 10px 30px rgba(0,0,0,.25)", zIndex: "9999",
    opacity: "0", pointerEvents: "none", transition: "opacity .25s, transform .25s",
    fontSize: "14px"
  });
  document.body.appendChild(el);
  requestAnimationFrame(() => { el.style.opacity = "1"; el.style.transform = "translateX(-50%) translateY(0)"; });
  const t = setTimeout(() => {
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 250);
  }, ms);
  return () => { clearTimeout(t); el.remove(); };
}
