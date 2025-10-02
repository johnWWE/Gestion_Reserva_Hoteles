const jwt = require("jsonwebtoken");

const authMiddleware = (rolesPermitidos = []) => {
  return (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Token requerido" });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.status(403).json({ error: "Token inválido" });

      if (rolesPermitidos.length && !rolesPermitidos.includes(user.rol)) {
        return res.status(403).json({ error: "Acceso denegado" });
      }

      req.user = user;
      next();
    });
  };
};

module.exports = authMiddleware;
