require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const { sequelize } = require("./models"); // importamos index.js de models
const testRoutes = require("./routes/test");


const app = express();

// Middlewares
app.use(express.json());
app.use(helmet());
app.use(morgan("dev"));
app.use("/api", testRoutes);
// Rutas de prueba (temporal)
app.get("/", (req, res) => {
  res.json({ mensaje: "🚀 API de Reservas de Hoteles funcionando!" });
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
