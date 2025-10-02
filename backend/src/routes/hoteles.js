const express = require("express");
const router = express.Router();


const {Hotel} = require("../models");
const authMiddleware = require("../middlewares/authMiddleware");

// Obtener todos los hoteles
router.get("/", async (req, res) => {
  const hoteles = await Hotel.findAll();
  res.json(hoteles);
});

// Crear hotel (solo admin)
router.post("/", authMiddleware(["admin"]), async (req, res) => {
  const hotel = await Hotel.create(req.body);
  res.status(201).json(hotel);
});

module.exports = router;
