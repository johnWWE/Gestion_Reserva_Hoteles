const { Reserva, Habitacion, Pago } = require("../models");
const { logAction } = require("../utils/audit");

function noches(inicio, fin) {
  const a = new Date(inicio);
  const b = new Date(fin);
  const diff = Math.ceil((b - a) / (24*3600*1000));
  return Math.max(1, diff);
}

async function crearPago(req, res) {
  const userId = Number(req.user?.id);
  if (!userId) return res.status(401).json({ error: "Token inválido" });

  const reservaId = Number(req.body?.reservaId);
  if (!reservaId) return res.status(400).json({ error: "reservaId requerido" });

  const metodo = (req.body?.metodo || "tarjeta").toString();
  const moneda = (req.body?.moneda || "PEN").toString();
  const txnId  = req.body?.txnId || null;

  const r = await Reserva.findByPk(reservaId);
  if (!r) return res.status(404).json({ error: "Reserva no encontrada" });

  const isAdmin = req.user.rol === "admin";
  if (!isAdmin && r.userId !== userId) {
    return res.status(403).json({ error: "No autorizado" });
  }
  if (r.estado === "cancelada") {
    return res.status(409).json({ error: "No se puede pagar una reserva cancelada" });
  }

  const hab = await Habitacion.findByPk(r.habitacionId);
  if (!hab) return res.status(409).json({ error: "La reserva tiene una habitación inválida" });

  const n = noches(r.fechaInicio, r.fechaFin);
  let monto = Number(n) * Number(hab.precio || 0);
  if (isAdmin && req.body?.monto != null) {
    const m = Number(req.body.monto);
    if (!isNaN(m) && m >= 0) monto = m;
  }

  const pago = await Pago.create({
    userId: r.userId,
    reservaId: r.id,
    monto,
    moneda,
    metodo,
    estado: "completado",
    txnId
  });

  await r.update({ estado: "pagada" });

  await logAction({
    userId,
    accion: "pagar_reserva",
    entidad: "Pago",
    entidadId: pago.id,
    detalle: { reservaId: r.id, monto, moneda, metodo, txnId }
  });

  res.status(201).json({ message: "Pago registrado", pago, reserva: r });
}

async function misPagos(req, res) {
  const userId = Number(req.user?.id);
  if (!userId) return res.status(401).json({ error: "Token inválido" });
  const pagos = await Pago.findAll({ where: { userId } });
  res.json(pagos);
}

async function listarPagos(_req, res) {
  const pagos = await Pago.findAll();
  res.json(pagos);
}

async function obtenerPago(req, res) {
  const id = Number(req.params.id);
  const p = await Pago.findByPk(id);
  if (!p) return res.status(404).json({ error: "Pago no encontrado" });
  const isAdmin = req.user.rol === "admin";
  if (!isAdmin && p.userId !== Number(req.user.id)) {
    return res.status(403).json({ error: "No autorizado" });
  }
  res.json(p);
}

module.exports = { crearPago, misPagos, listarPagos, obtenerPago };
