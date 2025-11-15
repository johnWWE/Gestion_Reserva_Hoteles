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
  if (!habitacion)
    return res.status(404).json({ error: "Habitación no encontrada" });
  res.json(habitacion);
}

async function disponibilidad(req, res) {
  const { habitacionId, inicio, fin } = req.query;

  if (!habitacionId || !inicio || !fin)
    return res.status(400).json({ error: "Faltan datos" });

  const solapes = await Reserva.count({
    where: {
      habitacionId,
      fechaInicio: { [Op.lt]: fin },
      fechaFin: { [Op.gt]: inicio },
    }
  });

  res.json({ disponible: solapes === 0 });
}

async function rangosOcupados(req, res) {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "ID inválido" });

  const reservas = await Reserva.findAll({
    where: { habitacionId: id },
    attributes: ["id", "fechaInicio", "fechaFin", "estado"],
    order: [["fechaInicio", "ASC"]]
  });

  res.json(reservas);
}

async function createHabitacion(req, res) {
  const { hotelId, numero, tipo, capacidad, precio } = req.body;

  if (!hotelId || !numero || !tipo || capacidad == null)
    return res.status(400).json({ error: "Datos incompletos" });

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
  const deleted = await Habitacion.destroy({
    where: { id: req.params.id }
  });

  deleted
    ? res.json({ message: "Habitación eliminada" })
    : res.status(404).json({ error: "Habitación no encontrada" });
}

module.exports = {
  listHabitaciones,
  getHabitacion,
  disponibilidad,
  rangosOcupados,
  createHabitacion,
  updateHabitacion,
  deleteHabitacion,
};
