// js/api.js

const API_URL = "http://localhost:3000/api"; // ajusta el puerto si cambias el backend

export async function apiRequest(endpoint, method = "GET", data = null, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: data ? JSON.stringify(data) : null,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText);
  }

  return await res.json();
}

export function saveToken(token) {
  localStorage.setItem("token", token);
}

export function getToken() {
  return localStorage.getItem("token");
}

export function clearToken() {
  localStorage.removeItem("token");
}
