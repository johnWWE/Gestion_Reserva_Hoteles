// backend/src/routes/reservas.js
const express = require("express");
const { Op } = require("sequelize");
const { Reserva, Habitacion, Hotel } = require("../models");
const { authenticateToken, authorizeRole } = require("../middlewares/authMiddleware");

const router = express.Router();

/** Normaliza fechas a YYYY-MM-DD desde YYYY-MM-DD | dd/mm/yyyy | Date-like */
function asISO(s) {
  if (!s) return null;
  const v = String(s).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;      // YYYY-MM-DD
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) {            // dd/mm/yyyy
    const [d, m, y] = v.split("/");
    return `${y}-${m}-${d}`;
  }
  const t = new Date(v);
  if (isNaN(+t)) return null;
  return t.toISOString().slice(0, 10);
}

/** Chequeo de solapamiento de reservas para una habitación */
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

/* =========================
   Crear reserva (usuario)
   ========================= */
router.post("/", authenticateToken, async (req, res) => {
  try {
    // IDs numéricos
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

    return res.status(201).json(reserva);
  } catch (error) {
    console.error("POST /api/reservas ERROR:", {
      name: error?.name,
      message: error?.message,
      detail: error?.original?.detail,
      stack: error?.stack,
    });
    const msg =
      error?.original?.detail ||
      error?.errors?.[0]?.message ||
      error?.message ||
      "Error interno al crear la reserva";
    return res.status(500).json({ error: msg });
  }
});

/* ==========================================
   Listar MIS reservas (usuario autenticado)
   ========================================== */
router.get("/mias", authenticateToken, async (req, res) => {
  try {
    const userId = Number(req.user?.id);
    if (!userId) return res.status(401).json({ error: "Token inválido" });
    const reservas = await Reserva.findAll({ where: { userId } });
    return res.json(reservas);
  } catch (error) {
    console.error("GET /api/reservas/mias ERROR:", error);
    return res.status(500).json({ error: "No se pudieron obtener tus reservas" });
  }
});

/* ====================================
   Listar TODAS las reservas (solo admin)
   ==================================== */
router.get("/", authenticateToken, authorizeRole(["admin"]), async (_req, res) => {
  try {
    const reservas = await Reserva.findAll();
    return res.json(reservas);
  } catch (error) {
    console.error("GET /api/reservas ERROR:", error);
    return res.status(500).json({ error: "No se pudieron obtener las reservas" });
  }
});

/* ==========================================
   Obtener una reserva (dueño o administrador)
   ========================================== */
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const r = await Reserva.findByPk(id);
    if (!r) return res.status(404).json({ error: "Reserva no encontrada" });

    // si no es admin, debe ser el dueño
    if (req.user.rol !== "admin" && Number(req.user.id) !== r.userId) {
      return res.status(403).json({ error: "No autorizado" });
    }
    return res.json(r);
  } catch (error) {
    console.error("GET /api/reservas/:id ERROR:", error);
    return res.status(500).json({ error: "Error obteniendo la reserva" });
  }
});

/* ================================
   Actualizar (solo admin)
   ================================ */
router.put("/:id", authenticateToken, authorizeRole(["admin"]), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const r = await Reserva.findByPk(id);
    if (!r) return res.status(404).json({ error: "Reserva no encontrada" });

    const body = { ...req.body };
    // Normaliza por si envían fechas en otros formatos
    if (body.fechaInicio) body.fechaInicio = asISO(body.fechaInicio);
    if (body.fechaFin) body.fechaFin = asISO(body.fechaFin);

    await r.update(body);
    return res.json({ message: "Reserva actualizada" });
  } catch (error) {
    console.error("PUT /api/reservas/:id ERROR:", error);
    const msg = error?.original?.detail || error?.message || "No se pudo actualizar la reserva";
    return res.status(500).json({ error: msg });
  }
});

/* ====================================================
   Cancelar (dueño o admin) -> cambia estado a cancelada
   ==================================================== */
router.patch("/:id/cancelar", authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const r = await Reserva.findByPk(id);
    if (!r) return res.status(404).json({ error: "Reserva no encontrada" });

    if (req.user.rol !== "admin" && Number(req.user.id) !== r.userId) {
      return res.status(403).json({ error: "No autorizado" });
    }

    await r.update({ estado: "cancelada" });
    return res.json(r);
  } catch (error) {
    console.error("PATCH /api/reservas/:id/cancelar ERROR:", error);
    return res.status(500).json({ error: "No se pudo cancelar la reserva" });
  }
});

/* ================================
   Eliminar (solo admin)
   ================================ */
router.delete("/:id", authenticateToken, authorizeRole(["admin"]), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const deleted = await Reserva.destroy({ where: { id } });
    return deleted
      ? res.json({ message: "Reserva eliminada" })
      : res.status(404).json({ error: "Reserva no encontrada" });
  } catch (error) {
    console.error("DELETE /api/reservas/:id ERROR:", error);
    return res.status(500).json({ error: "No se pudo eliminar la reserva" });
  }
});

module.exports = router;



