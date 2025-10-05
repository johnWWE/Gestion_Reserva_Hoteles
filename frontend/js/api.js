// js/api.js
export const baseUrl = "http://localhost:3000"; // ajusta si tu backend está en otro puerto

export function setToken(token){
  localStorage.setItem("rh_token", token);
}

export function getToken(){
  return localStorage.getItem("rh_token");
}

export function clearToken(){
  localStorage.removeItem("rh_token");
}

async function handleResponse(res){
  const contentType = res.headers.get("content-type") || "";
  const text = await res.text();
  const data = contentType.includes("application/json") && text ? JSON.parse(text) : text;
  if(!res.ok){
    const msg = (data && data.message) || (data && data.error) || text || res.statusText;
    const err = new Error(msg);
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

export async function request(path, options = {}){
  const headers = options.headers || {};
  headers["Accept"] = "application/json";
  if(!headers["Content-Type"] && options.body) headers["Content-Type"] = "application/json";

  const token = getToken();
  if(token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(baseUrl + path, {...options, headers});
  return handleResponse(res);
}
