// backend/src/middlewares/authMiddleware.js
const jwt = require("jsonwebtoken");

// Verificar token
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Acceso denegado, token faltante" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Token inválido" });
    req.user = user;
    next();
  });
}

// Verificar rol
function authorizeRole(roles = []) {
  return (req, res, next) => {
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ error: "No tienes permisos para acceder a esta ruta" });
    }
    next();
  };
}

module.exports = { authenticateToken, authorizeRole };






