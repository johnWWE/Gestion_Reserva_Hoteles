// backend/src/app.js
const express = require("express");
const path = require("path");

const app = express();

// Middlewares globales
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1️⃣ Servir estáticos correctamente
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// 2️⃣ Tus rutas API
app.use("/api/hoteles", require("./routes/hoteles"));
app.use("/api/habitaciones", require("./routes/habitaciones"));
app.use("/api/reservas", require("./routes/reservas"));
app.use("/api/pagos", require("./routes/pagos"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/usuarios", require("./routes/usuarios"));
app.use("/api/reportes", require("./routes/reportes"));
app.use("/api/external", require("./routes/external"));

// 3️⃣ Ruta principal
app.get("/", (req, res) => {
  res.send("Servidor funcionando 🚀");
});

// 4️⃣ Exportar al final
module.exports = app;
