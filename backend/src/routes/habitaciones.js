// backend/src/routes/habitaciones.js
const express = require("express");
const { Op } = require("sequelize");
const { Habitacion, Reserva } = require("../models");
const { authenticateToken, authorizeRole } = require("../middlewares/authMiddleware");

const router = express.Router();

// ====== Listar (público) con filtro por ?hotelId=
router.get("/", async (req, res) => {
  const { hotelId } = req.query;
  const where = hotelId ? { hotelId } : {};
  const habitaciones = await Habitacion.findAll({ where });
  res.json(habitaciones);
});


// ====== Disponibilidad (público)
// GET /api/habitaciones/disponibilidad?habitacionId=1&inicio=YYYY-MM-DD&fin=YYYY-MM-DD&debug=1
router.get("/disponibilidad", async (req, res) => {
  const habitacionId = Number(req.query.habitacionId);
  const inicio = String(req.query.inicio || "").trim();
  const fin    = String(req.query.fin || "").trim();
  const debug  = req.query.debug === "1";

  if (!habitacionId || !inicio || !fin) {
    return res.status(400).json({ error: "habitacionId, inicio y fin son requeridos" });
  }
  if (new Date(inicio) >= new Date(fin)) {
    return res.status(400).json({ error: "La fecha fin debe ser posterior a la fecha inicio" });
  }

  // Regla semiabierta [inicio, fin):
  // Solapa si:  existente.fechaInicio < fin  &&  inicio < existente.fechaFin
  const whereSolape = {
    habitacionId,
    [Op.and]: [
      { fechaInicio: { [Op.lt]: fin } },   // estrictamente menor
      { fechaFin:   { [Op.gt]: inicio } }, // estrictamente mayor
    ],
  };

  const solapes = await Reserva.count({ where: whereSolape });

  if (!debug) return res.json({ disponible: solapes === 0 });

  const bloqueadoras = await Reserva.findAll({
    where: whereSolape,
    attributes: ["id", "habitacionId", "fechaInicio", "fechaFin", "estado", "userId"],
    order: [["id", "ASC"]],
    limit: 10,
  });

  return res.json({ disponible: solapes === 0, solapes, bloqueadoras });
});



// ====== Detalle (público)
router.get("/:id", async (req, res) => {
  const habitacion = await Habitacion.findByPk(req.params.id);
  habitacion ? res.json(habitacion) : res.status(404).json({ error: "Habitación no encontrada" });
});

// ====== Crear/editar/eliminar (solo admin)
router.post("/", authenticateToken, authorizeRole(["admin"]), async (req, res) => {
  try {
    const { hotelId, numero, tipo, capacidad, precio } = req.body;
    if (!hotelId || !numero || !tipo || capacidad == null) {
      return res.status(400).json({ error: "hotelId, numero, tipo y capacidad son requeridos" });
    }
    const hab = await Habitacion.create({
      hotelId,
      numero,
      tipo,
      capacidad: Number(capacidad),
      precio: precio != null ? Number(precio) : null,
    });
    res.status(201).json(hab);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:id", authenticateToken, authorizeRole(["admin"]), async (req, res) => {
  const { numero, tipo, capacidad, precio } = req.body;
  const [updated] = await Habitacion.update(
    {
      numero,
      tipo,
      capacidad: capacidad != null ? Number(capacidad) : undefined,
      precio: precio != null ? Number(precio) : undefined,
    },
    { where: { id: req.params.id } }
  );
  updated
    ? res.json({ message: "Habitación actualizada" })
    : res.status(404).json({ error: "Habitación no encontrada" });
});

router.delete("/:id", authenticateToken, authorizeRole(["admin"]), async (req, res) => {
  const deleted = await Habitacion.destroy({ where: { id: req.params.id } });
  deleted
    ? res.json({ message: "Habitación eliminada" })
    : res.status(404).json({ error: "Habitación no encontrada" });
});

module.exports = router;

