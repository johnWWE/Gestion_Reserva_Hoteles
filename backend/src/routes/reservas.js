const express = require("express");
const router = express.Router();
const { Reserva } = require("../models");
const authMiddleware = require("../middlewares/authMiddleware");

// Crear reserva (cliente)
router.post("/", authMiddleware(["cliente", "admin"]), async (req, res) => {
  const reserva = await Reserva.create({
    ...req.body,
    userId: req.user.id,
  });
  res.status(201).json(reserva);
});

// Ver reservas de un usuario
router.get("/", authMiddleware(["cliente", "admin"]), async (req, res) => {
  const reservas = await Reserva.findAll({
    where: { userId: req.user.id },
  });
  res.json(reservas);
});

module.exports = router;
