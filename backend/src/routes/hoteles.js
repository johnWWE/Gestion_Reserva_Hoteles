// backend/src/routes/hoteles.js
const express = require("express");
const router = express.Router();

const { authenticateToken, authorizeRole } = require("../middlewares/authMiddleware");
const asyncHandler = require("../utils/asyncHandler");
const upload = require("../middlewares/upload");
const hotelController = require("../controllers/hotelController");

// Subir imagen
router.post(
  "/upload-image/:id",
  authenticateToken,
  authorizeRole(["admin"]),
  upload.single("imagen"),
  hotelController.subirImagen
);

// Público
router.get("/", asyncHandler(hotelController.listHoteles));
router.get("/:id", asyncHandler(hotelController.getHotel));

// Admin
router.post("/", authenticateToken, authorizeRole(["admin"]), asyncHandler(hotelController.createHotel));
router.put("/:id", authenticateToken, authorizeRole(["admin"]), asyncHandler(hotelController.updateHotel));
router.delete("/:id", authenticateToken, authorizeRole(["admin"]), asyncHandler(hotelController.deleteHotel));

module.exports = router;
