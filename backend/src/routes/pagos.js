// backend/src/routes/pagos.js
const express = require("express");
const router = express.Router();
const { authenticateToken, authorizeRole } = require("../middlewares/authMiddleware");
const asyncHandler = require("../utils/asyncHandler");
const ctrl = require("../controllers/pagoController");

// Crear pago (dueño o admin)
router.post("/", authenticateToken, asyncHandler(ctrl.crearPago));

// Mis pagos (cliente)
router.get("/mios", authenticateToken, asyncHandler(ctrl.misPagos));

// Listar todos (admin)
router.get("/", authenticateToken, authorizeRole(["admin"]), asyncHandler(ctrl.listarPagos));

// Ver uno (dueño o admin)
router.get("/:id", authenticateToken, asyncHandler(ctrl.obtenerPago));

module.exports = router;
