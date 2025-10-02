// backend/server.js
const usuariosRoutes = require("./routes/usuarios");

const express = require("express");
const { sequelize } = require("./models");
sequelize.sync({ alter: true }) // crea/actualiza las tablas
  .then(() => console.log("✅ Tablas sincronizadas"))
  .catch(err => console.error("❌ Error al sincronizar tablas:", err));
const app = express();
const PORT = 3000;

// Middleware para que Express pueda entender JSON
app.use(express.json());

// Usar rutas
app.use("/usuarios", usuariosRoutes);
// Ruta inicial de prueba
app.get("/", (req, res) => {
  res.send("Bienvenido a la API de Reservas de Hoteles 🏨");
});

// Levantar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
