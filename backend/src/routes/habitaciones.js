/*backend/src/routes/habitaciones.js*/
const express = require("express");
const router = express.Router();

const { authenticateToken, authorizeRole } = require("../middlewares/authMiddleware");
const habitacionCtrl = require("../controllers/habitacionController");

// Público
router.get("/", habitacionCtrl.listHabitaciones);
router.get("/disponibilidad", habitacionCtrl.disponibilidad);
router.get("/:id/ocupadas", habitacionCtrl.rangosOcupados);
router.get("/:id", habitacionCtrl.getHabitacion);

// Admin
router.post("/", authenticateToken, authorizeRole(["admin"]), habitacionCtrl.createHabitacion);
router.put("/:id", authenticateToken, authorizeRole(["admin"]), habitacionCtrl.updateHabitacion);
router.delete("/:id", authenticateToken, authorizeRole(["admin"]), habitacionCtrl.deleteHabitacion);

module.exports = router;

