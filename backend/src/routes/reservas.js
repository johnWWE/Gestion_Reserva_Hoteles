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

module.exports = router;



