const express = require("express");
const { Hotel } = require("../models");

const router = express.Router();

// Crear hotel
router.post("/", async (req, res) => {
  try {
    const hotel = await Hotel.create(req.body);
    res.json(hotel);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Listar todos
router.get("/", async (req, res) => {
  const hoteles = await Hotel.findAll();
  res.json(hoteles);
});

// Obtener por ID
router.get("/:id", async (req, res) => {
  const hotel = await Hotel.findByPk(req.params.id);
  hotel ? res.json(hotel) : res.status(404).json({ error: "Hotel no encontrado" });
});

// Actualizar
router.put("/:id", async (req, res) => {
  const [updated] = await Hotel.update(req.body, { where: { id: req.params.id } });
  updated ? res.json({ message: "Hotel actualizado" }) : res.status(404).json({ error: "Hotel no encontrado" });
});

// Eliminar
router.delete("/:id", async (req, res) => {
  const deleted = await Hotel.destroy({ where: { id: req.params.id } });
  deleted ? res.json({ message: "Hotel eliminado" }) : res.status(404).json({ error: "Hotel no encontrado" });
});

module.exports = router;
