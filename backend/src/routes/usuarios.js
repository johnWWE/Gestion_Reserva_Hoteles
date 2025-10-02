// backend/routes/usuarios.js
const express = require("express");
const router = express.Router();

// Ruta GET de ejemplo
router.get("/", (req, res) => {
  res.json({ mensaje: "Lista de usuarios (ejemplo)" });
});

module.exports = router;
