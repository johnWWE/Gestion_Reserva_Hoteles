// backend/src/server.js
require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");

const { sequelize } = require("./models"); // index.js de models
const { authenticateToken, authorizeRole } = require("./middlewares/authMiddleware");

const app = express();

// ---- Middlewares base
app.use(cors());            // en prod: configura origin
app.use(express.json());
app.use(helmet());
app.use(morgan("dev"));
app.use("/api/usuarios", require("./routes/usuarios"));
app.use("/api/habitaciones", require("./routes/habitaciones"));
app.use("/api/hoteles", require("./routes/hoteles"));


// ---- Cargador seguro de rutas (no romper si falta algún archivo)
function tryMount(path, mountpoint) {
  try {
    const router = require(path);
    app.use(mountpoint, router);
    console.log(`✅ Ruta montada: ${mountpoint} -> ${path}`);
  } catch (err) {
    if (err.code === "MODULE_NOT_FOUND") {
      console.warn(`⚠️  Ruta omitida: ${mountpoint} (no existe ${path})`);
    } else {
      console.error(`❌ Error cargando ${path}:`, err.message);
    }
  }
}

// ---- Montar rutas con prefijo /api
tryMount("./routes/external", "/api/external");
tryMount("./routes/test", "/api");                 // se omitirá si no existe
tryMount("./routes/usuarios", "/api/usuarios");    // se omitirá si no existe
tryMount("./routes/hoteles", "/api/hoteles");
tryMount("./routes/habitaciones", "/api/habitaciones");
tryMount("./routes/reservas", "/api/reservas");
tryMount("./routes/auth", "/api/auth");
tryMount("./routes/pagos", "/api/pagos");
tryMount("./routes/reportes", "/api/reportes");


// ---- Utilitarias / demo
app.get("/", (req, res) => {
  res.json({ mensaje: "🚀 API de Reservas de Hoteles funcionando!" });
});

app.get("/me", authenticateToken, (req, res) => {
  res.json({ userId: req.user.id, rol: req.user.rol });
});

app.delete("/usuarios/:id", authenticateToken, authorizeRole(["admin"]), (req, res) => {
  res.json({ message: "Usuario eliminado (solo admin)" });
});

// ---- Mejor logging de errores no capturados
process.on("unhandledRejection", (reason) => {
  console.error("🔴 UnhandledRejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("🔴 UncaughtException:", err);
});

// ---- Arranque con sync
const PORT = process.env.PORT || 3000;

(async () => {
  try {
    console.log("⏳ Conectando a DB…");
    await sequelize.authenticate();
    console.log("✅ Conexión a DB OK");
    await sequelize.sync({ alter: true });
    console.log("✅ Tablas sincronizadas");

    app.listen(PORT, () => {
      console.log(`🌍 Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Error iniciando el servidor:", err.message);
    console.error("🧪 Revisa tus variables .env: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET");
    // No hacemos process.exit para que nodemon no quede en bucle ciego;
    // pero sí dejamos el proceso vivo para ver logs.
  }
})();
