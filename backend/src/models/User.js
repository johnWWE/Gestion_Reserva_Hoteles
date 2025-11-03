// backend/src/models/User.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const User = sequelize.define(
    "User",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true }, // 👈 INTEGER
      nombre: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      password: { type: DataTypes.STRING, allowNull: false },
      rol: { type: DataTypes.STRING, allowNull: false, defaultValue: "cliente" },

      // opcional: conserva el uuid antiguo si te sirve
      user_uuid: { type: DataTypes.UUID, allowNull: true },
    },
    { tableName: "users", timestamps: true }
  );
  return User;
};


