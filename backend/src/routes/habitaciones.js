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

  const whereSolape = {
    habitacionId,
    [Op.and]: [
      { fechaInicio: { [Op.lt]: fin } },
      { fechaFin:   { [Op.gt]: inicio } },
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

// ====== RANGOS OCUPADOS (público)
// GET /api/habitaciones/:id/ocupadas?inicio=YYYY-MM-DD&fin=YYYY-MM-DD
router.get("/:id/ocupadas", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "ID inválido" });

    const today = new Date(); today.setHours(0,0,0,0);
    const defInicio = today.toISOString().slice(0,10);
    const defFin = new Date(today.getTime() + 90*24*3600*1000).toISOString().slice(0,10);

    const inicio = (req.query.inicio || defInicio).toString().slice(0,10);
    const fin    = (req.query.fin    || defFin   ).toString().slice(0,10);

    const whereSolape = {
      habitacionId: id,
      [Op.and]: [
        { fechaInicio: { [Op.lt]: fin } },
        { fechaFin:   { [Op.gt]: inicio } },
      ],
    };

    const reservas = await Reserva.findAll({
      where: whereSolape,
      attributes: ["id", "fechaInicio", "fechaFin", "estado"],
      order: [["fechaInicio", "ASC"]],
      limit: 100,
    });

    res.json(reservas);
  } catch (e) {
    console.error("GET /api/habitaciones/:id/ocupadas ERROR:", e);
    res.status(500).json({ error: "No se pudo obtener rangos ocupados" });
  }
});

// ====== Detalle (público)
router.get("/:id", async (req, res) => {
  const habitacion = await Habitacion.findByPk(req.params.id);
  habitacion ? res.json(habitacion) : res.status(404).json({ error: "Habitación no encontrada" });
});

// ====== CRUD admin (crear/editar/eliminar) ...
// (lo que ya tenías)

module.exports = router;
