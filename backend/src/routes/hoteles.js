// backend/src/routes/hoteles.js
const express = require("express");
const router = express.Router();
const { Hotel } = require("../models");
const { authenticateToken, authorizeRole } = require("../middlewares/authMiddleware");

// Listar todos (público)
router.get("/", async (_req, res) => {
  const hoteles = await Hotel.findAll();
  res.json(hoteles);
});

// Detalle de hotel (PÚBLICO) - necesario para hotel.html
router.get("/:id", async (req, res) => {
  const hotel = await Hotel.findByPk(req.params.id);
  if (!hotel) return res.status(404).json({ error: "Hotel no encontrado" });
  res.json(hotel);
});

// Crear (solo admin)
router.post("/", authenticateToken, authorizeRole(["admin"]), async (req, res) => {
  const { nombre, direccion, estrellas } = req.body;
  if (!nombre || !direccion || !Number.isInteger(Number(estrellas))) {
    return res.status(400).json({ error: "Datos inválidos" });
  }
  const hotel = await Hotel.create({ nombre, direccion, estrellas: Number(estrellas) });
  res.status(201).json(hotel);
});

// Actualizar (solo admin)
router.put("/:id", authenticateToken, authorizeRole(["admin"]), async (req, res) => {
  const hotel = await Hotel.findByPk(req.params.id);
  if (!hotel) return res.status(404).json({ error: "Hotel no encontrado" });
  const { nombre, direccion, estrellas } = req.body;
  await hotel.update({
    nombre: nombre ?? hotel.nombre,
    direccion: direccion ?? hotel.direccion,
    estrellas: estrellas ?? hotel.estrellas,
  });
  res.json(hotel);
});

// Eliminar (solo admin)
router.delete("/:id", authenticateToken, authorizeRole(["admin"]), async (req, res) => {
  const hotel = await Hotel.findByPk(req.params.id);
  if (!hotel) return res.status(404).json({ error: "Hotel no encontrado" });
  await hotel.destroy();
  res.json({ message: "Hotel eliminado" });
});

module.exports = router;




