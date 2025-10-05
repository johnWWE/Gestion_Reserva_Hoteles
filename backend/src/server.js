require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const { sequelize } = require("./models"); // importamos index.js de models
const testRoutes = require("./routes/test");
const usuarios = require("./routes/usuarios");
const hoteles = require("./routes/hoteles");
const habitaciones = require("./routes/habitaciones");
const reservas = require("./routes/reservas");
const auth = require("./routes/auth");
const { authenticateToken, authorizeRole } = require("./middlewares/authMiddleware");
const app = express();
const cors = require("cors");
app.use(cors()); // Permite todas las origins en desarrollo
// Middlewares
app.use(express.json());
app.use(helmet());
app.use(morgan("dev"));

app.use("/api", testRoutes);
app.use("/users", usuarios);
app.use("/hotels", hoteles);
app.use("/habitaciones", habitaciones);
app.use("/reservas", reservas);
app.use("/auth", auth);
// Rutas de prueba (temporal)
app.get("/", (req, res) => {
  res.json({ mensaje: "🚀 API de Reservas de Hoteles funcionando!" });
});


app.get("/me", authenticateToken, (req, res) => {
  res.json({ userId: req.user.id, rol: req.user.rol });
});
app.delete("/usuarios/:id", authenticateToken, authorizeRole(["admin"]), (req, res) => {
  res.json({ message: "Usuario eliminado (solo admin)" });
});
// Sincronizar DB y arrancar servidor
const PORT = process.env.PORT || 3000;

sequelize
  .sync({ alter: true }) // alter:true actualiza columnas, force:true borra y recrea
  .then(() => {
    console.log("✅ Tablas sincronizadas con PostgreSQL");
    app.listen(PORT, () => {
      console.log(`🌍 Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Error al conectar con la base de datos:", err);
  });
