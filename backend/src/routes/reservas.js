const express = require("express");
const { Reserva } = require("../models");

const router = express.Router();

// Crear reserva
router.post("/", async (req, res) => {
  try {
    const reserva = await Reserva.create(req.body);
    res.json(reserva);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Listar todas
router.get("/", async (req, res) => {
  const reservas = await Reserva.findAll();
  res.json(reservas);
});

// Obtener por ID
router.get("/:id", async (req, res) => {
  const reserva = await Reserva.findByPk(req.params.id);
  reserva ? res.json(reserva) : res.status(404).json({ error: "Reserva no encontrada" });
});

// Actualizar
router.put("/:id", async (req, res) => {
  const [updated] = await Reserva.update(req.body, { where: { id: req.params.id } });
  updated ? res.json({ message: "Reserva actualizada" }) : res.status(404).json({ error: "Reserva no encontrada" });
});

// Eliminar
router.delete("/:id", async (req, res) => {
  const deleted = await Reserva.destroy({ where: { id: req.params.id } });
  deleted ? res.json({ message: "Reserva eliminada" }) : res.status(404).json({ error: "Reserva no encontrada" });
});

module.exports = router;

