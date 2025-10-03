const express = require("express");
const { Habitacion } = require("../models");

const router = express.Router();

// Crear habitación
router.post("/", async (req, res) => {
  try {
    const habitacion = await Habitacion.create(req.body);
    res.json(habitacion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Listar todas
router.get("/", async (req, res) => {
  const habitaciones = await Habitacion.findAll();
  res.json(habitaciones);
});

// Obtener por ID
router.get("/:id", async (req, res) => {
  const habitacion = await Habitacion.findByPk(req.params.id);
  habitacion ? res.json(habitacion) : res.status(404).json({ error: "Habitación no encontrada" });
});

// Actualizar
router.put("/:id", async (req, res) => {
  const [updated] = await Habitacion.update(req.body, { where: { id: req.params.id } });
  updated ? res.json({ message: "Habitación actualizada" }) : res.status(404).json({ error: "Habitación no encontrada" });
});

// Eliminar
router.delete("/:id", async (req, res) => {
  const deleted = await Habitacion.destroy({ where: { id: req.params.id } });
  deleted ? res.json({ message: "Habitación eliminada" }) : res.status(404).json({ error: "Habitación no encontrada" });
});

module.exports = router;
