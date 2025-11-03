/*
const express = require("express");
const { User, Hotel, Habitacion, Reserva } = require("../models");

const router = express.Router();

// Crear usuario
router.post("/users", async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Listar usuarios
router.get("/users", async (req, res) => {
  const users = await User.findAll();
  res.json(users);
});

module.exports = router;
*/
