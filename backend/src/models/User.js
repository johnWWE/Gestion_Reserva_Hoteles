// backend/src/models/User.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const User = sequelize.define(
    "User",
    {
      nombre: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      rol: {
        type: DataTypes.ENUM("admin", "cliente"),
        defaultValue: "cliente",
      },
    },
    {
      tableName: "users", // 👈 en minúscula, para evitar errores
      timestamps: true,
    }
  );

  return User;
};

