// backend/src/routes/reservas.js
const express = require("express");
const { Op } = require("sequelize");
const { Reserva, Habitacion } = require("../models");
const { authenticateToken, authorizeRole } = require("../middlewares/authMiddleware");

const router = express.Router();

// -------- helpers --------
async function hayConflicto(habitacionId, inicio, fin) {
  const count = await Reserva.count({
    where: {
      habitacionId,
      [Op.or]: [
        { fechaInicio: { [Op.between]: [inicio, fin] } },
        { fechaFin:   { [Op.between]: [inicio, fin] } },
        { fechaInicio: { [Op.lte]: inicio }, fechaFin: { [Op.gte]: fin } },
      ],
    },
  });
  return count > 0;
}

// ========== Crear reserva (usuario logueado) ==========
router.post("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { habitacionId, fechaInicio, fechaFin } = req.body;

    if (!habitacionId || !fechaInicio || !fechaFin) {
      return res.status(400).json({ error: "habitacionId, fechaInicio y fechaFin son requeridos" });
    }

    const hab = await Habitacion.findByPk(habitacionId);
    if (!hab) return res.status(404).json({ error: "Habitación no encontrada" });

    if (await hayConflicto(habitacionId, fechaInicio, fechaFin)) {
      return res.status(409).json({ error: "La habitación no está disponible en ese rango" });
    }

    const reserva = await Reserva.create({
      userId,
      habitacionId,
      fechaInicio,
      fechaFin,
      estado: "confirmada",
    });

    res.status(201).json(reserva);
  } catch (error) {
    console.error("Crear reserva:", error);
    res.status(500).json({ error: error.message });
  }
});

// ========== Listar MIS reservas (usuario) ==========
router.get("/mias", authenticateToken, async (req, res) => {
  const reservas = await Reserva.findAll({ where: { userId: req.user.id } });
  res.json(reservas);
});

// ========== Listar TODAS (solo admin) ==========
router.get("/", authenticateToken, authorizeRole(["admin"]), async (req, res) => {
  const reservas = await Reserva.findAll();
  res.json(reservas);
});

// ========== Obtener por ID (dueño o admin) ==========
router.get("/:id", authenticateToken, async (req, res) => {
  const r = await Reserva.findByPk(req.params.id);
  if (!r) return res.status(404).json({ error: "Reserva no encontrada" });
  if (req.user.rol !== "admin" && r.userId !== req.user.id) {
    return res.status(403).json({ error: "No autorizado" });
  }
  res.json(r);
});

// ========== Actualizar (admin) ==========
router.put("/:id", authenticateToken, authorizeRole(["admin"]), async (req, res) => {
  const r = await Reserva.findByPk(req.params.id);
  if (!r) return res.status(404).json({ error: "Reserva no encontrada" });
  await r.update(req.body);
  res.json({ message: "Reserva actualizada" });
});

// ========== Cancelar (dueño o admin) ==========
router.patch("/:id/cancelar", authenticateToken, async (req, res) => {
  const r = await Reserva.findByPk(req.params.id);
  if (!r) return res.status(404).json({ error: "Reserva no encontrada" });
  if (req.user.rol !== "admin" && r.userId !== req.user.id) {
    return res.status(403).json({ error: "No autorizado" });
  }
  await r.update({ estado: "cancelada" });
  res.json(r);
});

// ========== Eliminar (admin) ==========
router.delete("/:id", authenticateToken, authorizeRole(["admin"]), async (req, res) => {
  const deleted = await Reserva.destroy({ where: { id: req.params.id } });
  deleted ? res.json({ message: "Reserva eliminada" }) : res.status(404).json({ error: "Reserva no encontrada" });
});

module.exports = router;

