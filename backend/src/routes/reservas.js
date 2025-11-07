// backend/src/routes/reservas.js
const express = require("express");
const router = express.Router();
const { authenticateToken, authorizeRole } = require("../middlewares/authMiddleware");
const asyncHandler = require("../utils/asyncHandler");
const ctrl = require("../controllers/reservaController");

// Crear (usuario)
router.post("/", authenticateToken, asyncHandler(ctrl.crearReserva));

// Mías (usuario)
router.get("/mias", authenticateToken, asyncHandler(ctrl.misReservas));

// Todas (admin)
router.get("/", authenticateToken, authorizeRole(["admin"]), asyncHandler(ctrl.listarReservas));

// Una (dueño o admin)
router.get("/:id", authenticateToken, asyncHandler(ctrl.obtenerReserva));

// Actualizar (admin)
router.put("/:id", authenticateToken, authorizeRole(["admin"]), asyncHandler(ctrl.actualizarReserva));

// Cancelar (dueño o admin)
router.patch("/:id/cancelar", authenticateToken, asyncHandler(ctrl.cancelarReserva));

// Eliminar (admin)
router.delete("/:id", authenticateToken, authorizeRole(["admin"]), asyncHandler(ctrl.eliminarReserva));
// Listar TODAS las reservas (solo admin)
router.get("/", authenticateToken, authorizeRole(["admin"]), async (_req, res) => {
  try {
    const reservas = await Reserva.findAll({
      order: [["id", "ASC"]],
      include: [
        {
          model: Habitacion,
          attributes: ["id", "numero", "hotelId"],
          include: [
            { model: Hotel, attributes: ["id", "nombre"] }
          ],
        },
      ],
    });

    // (opcional) aplanar para front
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

    return res.json(data);
  } catch (error) {
    console.error("GET /api/reservas ERROR:", error);
    return res.status(500).json({ error: "No se pudieron obtener las reservas" });
  }
});


module.exports = router;



