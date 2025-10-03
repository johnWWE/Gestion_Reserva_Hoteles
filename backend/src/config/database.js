const { Sequelize } = require("sequelize");
require("dotenv").config(); // Para leer variables de entorno desde .env

// Creamos la conexión a PostgreSQL
const sequelize = new Sequelize(
  process.env.DB_NAME,     // Nombre de la BD
  process.env.DB_USER,     // Usuario
  process.env.DB_PASSWORD, // Contraseña
  {
    host: process.env.DB_HOST, // Host (localhost normalmente)
    dialect: "postgres",
    logging: false, // Para que no muestre logs enormes en consola
  }
);

module.exports = sequelize;
