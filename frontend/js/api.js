// frontend/js/api.js
import { API_URL } from "./config.js";

export function getToken() {
  return localStorage.getItem("token");
}

export async function request(path, { method = "GET", body, headers = {} } = {}) {
  const opts = { method, headers: { "Content-Type": "application/json", ...headers } };
  const token = getToken();
  if (token) opts.headers["Authorization"] = `Bearer ${token}`;
  if (body !== undefined) opts.body = JSON.stringify(body);

  const res = await fetch(`${API_URL}${path}`, opts);

  // intenta parsear JSON; si no hay, usa objeto vacío
  let data = null;
  try { data = await res.json(); } catch (_) {}

  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || `${res.status} ${res.statusText}`;
    throw new Error(msg);
  }
  return data ?? {};
}

export async function registerUser({ nombre, email, password, rol = "cliente" }) {
  const data = await request("/api/auth/register", {
    method: "POST",
    body: { nombre, email, password, rol }
  });

  // Si tu backend devuelve token en el registro, guardamos sesión:
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
