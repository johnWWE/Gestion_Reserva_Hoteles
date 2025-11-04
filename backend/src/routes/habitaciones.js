// backend/src/routes/habitaciones.js
const express = require("express");
const router = express.Router();
const { authenticateToken, authorizeRole } = require("../middlewares/authMiddleware");
const asyncHandler = require("../utils/asyncHandler");
const ctrl = require("../controllers/habitacionController");

// Público
router.get("/", asyncHandler(ctrl.listHabitaciones));
router.get("/disponibilidad", asyncHandler(ctrl.disponibilidad));
router.get("/:id", asyncHandler(ctrl.getHabitacion));

// Admin
router.post("/", authenticateToken, authorizeRole(["admin"]), asyncHandler(ctrl.createHabitacion));
router.put("/:id", authenticateToken, authorizeRole(["admin"]), asyncHandler(ctrl.updateHabitacion));
router.delete("/:id", authenticateToken, authorizeRole(["admin"]), asyncHandler(ctrl.deleteHabitacion));

module.exports = router;


