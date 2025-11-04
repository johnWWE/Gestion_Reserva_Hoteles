// backend/src/routes/hoteles.js
const express = require("express");
const router = express.Router();
const { authenticateToken, authorizeRole } = require("../middlewares/authMiddleware");
const asyncHandler = require("../utils/asyncHandler");
const ctrl = require("../controllers/hotelController");

// Público
router.get("/", asyncHandler(ctrl.listHoteles));
router.get("/:id", asyncHandler(ctrl.getHotel)); // tu hotel.html lo usa público

// Admin
router.post("/", authenticateToken, authorizeRole(["admin"]), asyncHandler(ctrl.createHotel));
router.put("/:id", authenticateToken, authorizeRole(["admin"]), asyncHandler(ctrl.updateHotel));
router.delete("/:id", authenticateToken, authorizeRole(["admin"]), asyncHandler(ctrl.deleteHotel));

module.exports = router;





