// backend/routes/usuarios.js
const express = require("express");
const { User } = require("../models");
const bcrypt = require("bcrypt");

const router = express.Router();

// Crear usuario
router.post("/", async (req, res) => {
  try {
    const { nombre, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ nombre, email, password: hashedPassword });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Listar todos los usuarios
router.get("/", async (req, res) => {
  const users = await User.findAll();
  res.json(users);
});

// Obtener un usuario por ID
router.get("/:id", async (req, res) => {
  const user = await User.findByPk(req.params.id);
  user ? res.json(user) : res.status(404).json({ error: "Usuario no encontrado" });
});

// Actualizar usuario
router.put("/:id", async (req, res) => {
  try {
    const { nombre, email } = req.body;
    const [updated] = await User.update({ nombre, email }, { where: { id: req.params.id } });
    updated ? res.json({ message: "Usuario actualizado" }) : res.status(404).json({ error: "Usuario no encontrado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar usuario
router.delete("/:id", async (req, res) => {
  const deleted = await User.destroy({ where: { id: req.params.id } });
  deleted ? res.json({ message: "Usuario eliminado" }) : res.status(404).json({ error: "Usuario no encontrado" });
});

module.exports = router;
