
/*backend/src/controllers/habitacionController.js*/
const { Op } = require("sequelize");
const { Habitacion, Reserva } = require("../models");

async function listHabitaciones(req, res) {
  const { hotelId } = req.query;
  const where = hotelId ? { hotelId } : {};
  const habitaciones = await Habitacion.findAll({ where });
  res.json(habitaciones);
}

async function getHabitacion(req, res) {
  const habitacion = await Habitacion.findByPk(req.params.id);
  if (!habitacion) return res.status(404).json({ error: "Habitación no encontrada" });
  res.json(habitacion);
}

async function disponibilidad(req, res) {
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

  // Regla semiabierta [inicio, fin): solapa si: inicio < existente.fin && existente.inicio < fin
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
}

async function createHabitacion(req, res) {
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
}

async function updateHabitacion(req, res) {
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
}

async function deleteHabitacion(req, res) {
  const deleted = await Habitacion.destroy({ where: { id: req.params.id } });
  deleted
    ? res.json({ message: "Habitación eliminada" })
    : res.status(404).json({ error: "Habitación no encontrada" });
}

module.exports = {
  listHabitaciones,
  getHabitacion,
  disponibilidad,
  createHabitacion,
  updateHabitacion,
  deleteHabitacion,
};
