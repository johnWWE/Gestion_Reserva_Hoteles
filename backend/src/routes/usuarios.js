// backend/src/routes/usuarios.js
const express = require("express");
const { User } = require("../models");
const { authenticateToken, authorizeRole } = require("../middlewares/authMiddleware");

const router = express.Router();

// Listado SOLO admin
router.get("/", authenticateToken, authorizeRole(["admin"]), async (_req, res) => {
  const users = await User.findAll({
    attributes: ["id", "nombre", "email", "rol", "createdAt"]
  });
  res.json(users);
});

// Perfil propio
router.get("/me", authenticateToken, async (req, res) => {
  const me = await User.findByPk(req.user.id, {
    attributes: ["id", "nombre", "email", "rol", "createdAt"]
  });
  res.json(me);
});

module.exports = router;
