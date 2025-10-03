// src/app.js (Esquema básico)

const express = require("express");
const app = express();

// Ruta principal
app.get("/", (req, res) => {
  res.send("Servidor funcionando 🚀");
});

module.exports = app;