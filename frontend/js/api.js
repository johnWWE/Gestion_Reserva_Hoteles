// frontend/js/api.js
import { API_URL } from "./config.js";

export function getToken() {
  return localStorage.getItem("token");
}

export async function request(path, { method = "GET", body, headers = {} } = {}) {
  const url = `${API_URL}${path}`;
  const opts = { method, headers: { "Content-Type": "application/json", ...headers } };
  const token = getToken();
  if (token) opts.headers["Authorization"] = `Bearer ${token}`;
  if (body !== undefined) opts.body = JSON.stringify(body);

  if (window.API_DEBUG) console.log("[API] →", method, url, body ?? "");

  const res = await fetch(url, opts);

  // intenta parsear JSON
  let data;
  const text = await res.text(); // leemos como texto para poder depurar
  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    if (window.API_DEBUG) console.warn("[API] JSON parse error:", e, "body:", text);
    data = null;
  }

  if (window.API_DEBUG) console.log("[API] ←", res.status, res.statusText, data ?? text);

  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || `${res.status} ${res.statusText}`;
    throw new Error(msg);
  }
  // si no hay data, devuelve objeto vacío para evitar undefined
  return data ?? {};
}

export async function registerUser({ nombre, email, password, rol = "cliente" }) {
  const data = await request("/api/auth/register", {
    method: "POST",
    body: { nombre, email, password, rol }
  });
  if (data?.token) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("userName", data.user?.nombre || "");
    localStorage.setItem("userRole", data.user?.rol || "cliente");
  }
  return data;
}

export async function loginUser(email, password) {
  const data = await request("/api/auth/login", {
    method: "POST",
    body: { email, password }
  });
  if (!data?.token) throw new Error("Respuesta de login inválida");
  localStorage.setItem("token", data.token);
  localStorage.setItem("userName", data.user?.nombre || "");
  localStorage.setItem("userRole", data.user?.rol || "cliente");
  return data;
}
