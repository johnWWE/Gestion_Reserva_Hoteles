// backend/src/routes/pagos.js
const express = require("express");
const { authenticateToken, authorizeRole } = require("../middlewares/authMiddleware");
const { Reserva, Habitacion, Pago, Hotel } = require("../models");
const { Op } = require("sequelize");
const { logAction } = require("../utils/audit");

const router = express.Router();

function asISO(s) {
  if (!s) return null;
  const v = String(s).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) {
    const [d, m, y] = v.split("/");
    return `${y}-${m}-${d}`;
  }
  const t = new Date(v);
  if (isNaN(+t)) return null;
  return t.toISOString().slice(0,10);
}

function noches(inicio, fin) {
  const a = new Date(inicio);
  const b = new Date(fin);
  const diff = Math.ceil((b - a) / (24*3600*1000));
  return Math.max(1, diff);
}

// ================================
// Crear pago de una reserva
// ================================
// POST /api/pagos
// body: { reservaId, metodo?, moneda?, monto? (admin-only), txnId? }
// - Cliente: solo puede pagar sus reservas
// - Admin: puede pagar cualquier reserva y forzar monto/estado
router.post("/", authenticateToken, async (req, res) => {
  try {
    const userId = Number(req.user?.id);
    if (!userId) return res.status(401).json({ error: "Token inválido" });

    const reservaId = Number(req.body?.reservaId);
    if (!reservaId) return res.status(400).json({ error: "reservaId requerido" });

    const metodo = (req.body?.metodo || "tarjeta").toString();
    const moneda = (req.body?.moneda || "PEN").toString();
    const txnId  = req.body?.txnId || null;

    const r = await Reserva.findByPk(reservaId);
    if (!r) return res.status(404).json({ error: "Reserva no encontrada" });

    // Dueño o admin
    const isAdmin = req.user.rol === "admin";
    if (!isAdmin && r.userId !== userId) {
      return res.status(403).json({ error: "No autorizado" });
    }

    // No pagar canceladas
    if (r.estado === "cancelada") {
      return res.status(409).json({ error: "No se puede pagar una reserva cancelada" });
    }

    // Precio x noches
    const hab = await Habitacion.findByPk(r.habitacionId);
    if (!hab) return res.status(409).json({ error: "La reserva tiene una habitación inválida" });

    const n = noches(r.fechaInicio, r.fechaFin);
    let monto = Number(n) * Number(hab.precio || 0);

    // Admin puede forzar monto (p. ej., descuentos/promos)
    if (isAdmin && req.body?.monto != null) {
      const m = Number(req.body.monto);
      if (!isNaN(m) && m >= 0) monto = m;
    }

    // Crear pago
    const pago = await Pago.create({
      userId: r.userId,     // el dueño de la reserva
      reservaId: r.id,
      monto,
      moneda,
      metodo,
      estado: "completado",
      txnId
    });

    // (Opcional) marcar reserva como 'pagada'
    // Si quieres mantener 'confirmada' está bien; si no, usa 'pagada'
    await r.update({ estado: "pagada" }); // agrega 'pagada' a validación de Reserva si aún no

    // Log
    await logAction({
      userId,
      accion: "pagar_reserva",
      entidad: "Pago",
      entidadId: pago.id,
      detalle: { reservaId: r.id, monto, moneda, metodo, txnId }
    });

    return res.status(201).json({ message: "Pago registrado", pago, reserva: r });
  } catch (error) {
    console.error("POST /api/pagos ERROR:", error);
    const msg = error?.original?.detail || error?.message || "Error al registrar el pago";
    return res.status(500).json({ error: msg });
  }
});

// ================================
// Mis pagos (cliente)
// ================================
router.get("/mios", authenticateToken, async (req, res) => {
  try {
    const userId = Number(req.user?.id);
    if (!userId) return res.status(401).json({ error: "Token inválido" });
    const pagos = await Pago.findAll({ where: { userId } });
    return res.json(pagos);
  } catch (error) {
    console.error("GET /api/pagos/mios ERROR:", error);
    return res.status(500).json({ error: "No se pudieron obtener tus pagos" });
  }
});

// ================================
// Listar todos (admin)
// ================================
router.get("/", authenticateToken, authorizeRole(["admin"]), async (_req, res) => {
  try {
    const pagos = await Pago.findAll();
    return res.json(pagos);
  } catch (error) {
    console.error("GET /api/pagos ERROR:", error);
    return res.status(500).json({ error: "No se pudieron obtener los pagos" });
  }
});

// ================================
// Ver uno (admin o dueño)
// ================================
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const p = await Pago.findByPk(id);
    if (!p) return res.status(404).json({ error: "Pago no encontrado" });

    const isAdmin = req.user.rol === "admin";
    if (!isAdmin && p.userId !== Number(req.user.id)) {
      return res.status(403).json({ error: "No autorizado" });
    }
    return res.json(p);
  } catch (error) {
    console.error("GET /api/pagos/:id ERROR:", error);
    return res.status(500).json({ error: "No se pudo obtener el pago" });
  }
});

module.exports = router;
