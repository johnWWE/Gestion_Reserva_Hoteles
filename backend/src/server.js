// backend/src/server.js
require("dotenv").config();

const path = require("path");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");

const { sequelize } = require("./models");
const { authenticateToken, authorizeRole } = require("./middlewares/authMiddleware");

const app = express();

// Middlewares base
app.use(cors({
  origin: "https://peppy-axolotl-04f880.netlify.app",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials:true
}));
app.use(express.json());
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["*"],
        "img-src": ["*", "data:", "blob:"],
        "script-src": ["'self'", "*"],
        "connect-src": ["*", "data:"],
        "style-src": ["'self'", "'unsafe-inline'", "*"],
      },
    },
  })
);
app.use(morgan("dev"));

// Habilitar CORS para archivos estáticos (IMÁGENES)
app.use("/uploads", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});
// Static images
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// Rutas
app.use("/api/auth", require("./routes/auth"));
app.use("/api/usuarios", require("./routes/usuarios"));
app.use("/api/hoteles", require("./routes/hoteles"));
app.use("/api/habitaciones", require("./routes/habitaciones"));
app.use("/api/reservas", require("./routes/reservas"));
app.use("/api/pagos", require("./routes/pagos"));
app.use("/api/reportes", require("./routes/reportes"));
app.use("/api/external", require("./routes/external"));

// Ruta base
app.get("/", (req, res) => {
  res.json({ mensaje: "🚀 API funcionando correctamente" });
});

// Debug usuario
app.get("/me", authenticateToken, (req, res) => {
  res.json({ userId: req.user.id, rol: req.user.rol });
});

// Arranque
const PORT = process.env.PORT || 3000;

(async () => {
  try {
    console.log("⏳ Conectando a DB…");
    await sequelize.authenticate();
    console.log("✅ Conexión a DB OK");

    await sequelize.sync({ alter: true });
    console.log("📦 Tablas sincronizadas");

    app.listen(PORT, () => {
      console.log(`🌍 Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Error iniciando:", err.message);
  }
})();


