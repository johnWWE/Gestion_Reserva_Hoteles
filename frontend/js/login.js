import { loginUser } from "./api.js";

const form = document.getElementById("login-form");
const msg = document.getElementById("msg");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const data = await loginUser(email, password);
    msg.textContent = "Inicio de sesión exitoso ✅";
    setTimeout(() => {
      location.href = "index.html";
    }, 1000);
  } catch (error) {
    msg.textContent = "❌ " + error.message;
  }
});
