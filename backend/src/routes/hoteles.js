const express = require("express");
const router = express.Router();
const { Hotel } = require("../models");
const { authenticateToken, authorizeRole } = require("../middlewares/authMiddleware");

// ✅ RUTA PÚBLICA - ver hoteles
router.get("/", async (req, res) => {
  const hoteles = await Hotel.findAll();
  res.json(hoteles);
});

// ✅ RUTA PROTEGIDA (usuario logueado) - ver hotel específico
router.get("/:id", authenticateToken, async (req, res) => {
  const hotel = await Hotel.findByPk(req.params.id);
  if (!hotel) return res.status(404).json({ error: "Hotel no encontrado" });
  res.json(hotel);
});

// ✅ RUTA SOLO ADMIN - crear hotel
router.post("/", authenticateToken, authorizeRole(["admin"]), async (req, res) => {
  const hotel = await Hotel.create(req.body);
  res.status(201).json(hotel);
});

// ✅ RUTA SOLO ADMIN - actualizar hotel
router.put("/:id", authenticateToken, authorizeRole(["admin"]), async (req, res) => {
  const hotel = await Hotel.findByPk(req.params.id);
  if (!hotel) return res.status(404).json({ error: "Hotel no encontrado" });

  await hotel.update(req.body);
  res.json(hotel);
});

// ✅ RUTA SOLO ADMIN - eliminar hotel
router.delete("/:id", authenticateToken, authorizeRole(["admin"]), async (req, res) => {
  const hotel = await Hotel.findByPk(req.params.id);
  if (!hotel) return res.status(404).json({ error: "Hotel no encontrado" });

  await hotel.destroy();
  res.json({ message: "Hotel eliminado" });
});

module.exports = router;


