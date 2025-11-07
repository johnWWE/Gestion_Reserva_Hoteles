/*backend/src/controllers/reservaController.js*/
const { Op } = require("sequelize");
const { Reserva, Habitacion, Hotel, User} = require("../models");

function asISO(s) {
  if (!s) return null;
  const v = String(s).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  if (/^\d{4}-\d{2}-\d{2}T/.test(v)) return v.slice(0,10);
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) { const [d,m,y]=v.split("/"); return `${y}-${m}-${d}`; }
  const m = v.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  return null;
}

async function hayConflicto(habitacionId, inicio, fin) {
  const count = await Reserva.count({
    where: {
      habitacionId,
      [Op.and]: [
        { fechaInicio: { [Op.lt]: fin } },
        { fechaFin:   { [Op.gt]: inicio } },
      ],
    },
  });
  return count > 0;
}

async function crearReserva(req, res) {
  const userId = Number(req.user?.id);
  const habitacionId = Number(req.body?.habitacionId);
  const inicio = asISO(req.body?.fechaInicio);
  const fin    = asISO(req.body?.fechaFin);

  if (!userId) return res.status(401).json({ error: "Token inválido" });
  if (!habitacionId || !inicio || !fin) {
    return res.status(400).json({ error: "habitacionId, fechaInicio y fechaFin son requeridos" });
  }
  if (new Date(inicio) >= new Date(fin)) {
    return res.status(400).json({ error: "La fecha fin debe ser posterior a la fecha inicio" });
  }

  const hab = await Habitacion.findByPk(habitacionId);
  if (!hab) return res.status(404).json({ error: "Habitación no encontrada" });

  const hotel = await Hotel.findByPk(hab.hotelId);
  if (!hotel) return res.status(409).json({ error: "La habitación no tiene un hotel válido" });

  if (await hayConflicto(habitacionId, inicio, fin)) {
    return res.status(409).json({ error: "La habitación no está disponible en ese rango" });
  }

  const reserva = await Reserva.create({
    userId,
    habitacionId,
    fechaInicio: inicio,
    fechaFin: fin,
    estado: "confirmada",
  });

  res.status(201).json(reserva);
}

async function misReservas(req, res) {
  const userId = Number(req.user?.id);
  if (!userId) return res.status(401).json({ error: "Token inválido" });

  const reservas = await Reserva.findAll({
    where: { userId },
    order: [["id", "DESC"]],
    include: [
      {
        model: Habitacion,
        attributes: ["id", "numero", "hotelId"],
        include: [{ model: Hotel, attributes: ["id", "nombre"] }],
      },
    ],
    attributes: ["id", "estado", "fechaInicio", "fechaFin", "habitacionId", "userId"],
  });

  // Aplanamos para que el front pueda leer hotelNombre / habitacionNumero
  const data = reservas.map(r => ({
    id: r.id,
    estado: r.estado,
    fechaInicio: r.fechaInicio,
    fechaFin: r.fechaFin,
    habitacionId: r.habitacionId,
    userId: r.userId,
    habitacionNumero: r.Habitacion?.numero ?? null,
    hotelId: r.Habitacion?.Hotel?.id ?? null,
    hotelNombre: r.Habitacion?.Hotel?.nombre ?? null,
  }));
  res.json(data);
}

async function listarReservas(_req, res) {
  const reservas = await Reserva.findAll({
    order: [["id", "DESC"]],
    include: [
      {
        model: Habitacion,
        attributes: ["id", "numero", "hotelId"],
        include: [{ model: Hotel, attributes: ["id", "nombre"] }],
      },
      { model: User, attributes: ["id", "nombre", "email"] },
    ],
    attributes: ["id", "estado", "fechaInicio", "fechaFin", "habitacionId", "userId"],
  });

  // Aplanar para que el front lea hotelNombre / habitacionNumero igual que en “mías”
  const data = reservas.map(r => ({
    id: r.id,
    estado: r.estado,
    fechaInicio: r.fechaInicio,
    fechaFin: r.fechaFin,
    habitacionId: r.habitacionId,
    userId: r.userId,

    habitacionNumero: r.Habitacion?.numero ?? null,
    hotelId: r.Habitacion?.Hotel?.id ?? null,
    hotelNombre: r.Habitacion?.Hotel?.nombre ?? null,

    // opcional: datos del usuario para admin
    usuarioNombre: r.User?.nombre ?? null,
    usuarioEmail: r.User?.email ?? null,
  }));

  res.json(data);
}

async function obtenerReserva(req, res) {
  const id = Number(req.params.id);
  const r = await Reserva.findByPk(id);
  if (!r) return res.status(404).json({ error: "Reserva no encontrada" });
  if (req.user.rol !== "admin" && Number(req.user.id) !== r.userId) {
    return res.status(403).json({ error: "No autorizado" });
  }
  res.json(r);
}

async function actualizarReserva(req, res) {
  const id = Number(req.params.id);
  const r = await Reserva.findByPk(id);
  if (!r) return res.status(404).json({ error: "Reserva no encontrada" });

  const body = { ...req.body };
  if (body.fechaInicio) body.fechaInicio = asISO(body.fechaInicio);
  if (body.fechaFin) body.fechaFin = asISO(body.fechaFin);

  await r.update(body);
  res.json({ message: "Reserva actualizada" });
}

async function cancelarReserva(req, res) {
  const id = Number(req.params.id);
  const r = await Reserva.findByPk(id);
  if (!r) return res.status(404).json({ error: "Reserva no encontrada" });
  if (req.user.rol !== "admin" && Number(req.user.id) !== r.userId) {
    return res.status(403).json({ error: "No autorizado" });
  }
  await r.update({ estado: "cancelada" });
  res.json(r);
}

async function eliminarReserva(req, res) {
  const id = Number(req.params.id);
  const deleted = await Reserva.destroy({ where: { id } });
  return deleted
    ? res.json({ message: "Reserva eliminada" })
    : res.status(404).json({ error: "Reserva no encontrada" });
}

module.exports = {
  crearReserva,
  misReservas,
  listarReservas,
  obtenerReserva,
  actualizarReserva,
  cancelarReserva,
  eliminarReserva,
};

