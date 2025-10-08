// backend/src/controllers/authController.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User } = require("../models");
require("dotenv").config();

const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || "10", 10);

// ==========================================================
// REGISTRO DE USUARIO
// ==========================================================
async function register(req, res) {
  try {
    const { nombre, email, password, rol } = req.body;

    // Validaciones básicas
    if (!nombre || !email || !password) {
      return res.status(400).json({ message: "Faltan datos requeridos" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres" });
    }

    // Verificar si el correo ya está registrado
    const exists = await User.findOne({ where: { email } });
    if (exists) {
      return res.status(400).json({ message: "Email ya registrado" });
    }

    // Hashear contraseña
    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    // Crear usuario
    const user = await User.create({
      nombre,
      email,
      password: hash,
      rol: rol || "cliente",
    });

    // Respuesta sin incluir la contraseña
    return res.status(201).json({
      message: "Usuario registrado exitosamente",
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
      },
    });
  } catch (err) {
    console.error("Error en registro:", err);
    return res.status(500).json({ message: "Error del servidor" });
  }
}

// ==========================================================
// LOGIN DE USUARIO
// ==========================================================
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Faltan credenciales" });
    }

    // Buscar usuario con el campo password incluido
    const user = await User.findOne({
      where: { email },
      attributes: { include: ["password", "id", "nombre", "email", "rol"] },
    });

    if (!user) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    // Comparar contraseñas
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    // Crear token
    const payload = { id: user.id, rol: user.rol };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    });

    // Devolver usuario sin contraseña
    return res.json({
      message: "Login correcto",
      token,
      user: {
        id: user.id,
        nombre: user.nombre, // 👈 campo correcto
        email: user.email,
        rol: user.rol,
      },
    });
  } catch (err) {
    console.error("Error en login:", err);
    return res.status(500).json({ message: "Error del servidor" });
  }
}

module.exports = { register, login };

