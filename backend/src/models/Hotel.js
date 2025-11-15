// backend/src/models/Hotel.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Hotel = sequelize.define(
    "Hotel",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      nombre: { type: DataTypes.STRING, allowNull: false },
      direccion: { type: DataTypes.STRING, allowNull: false },
      estrellas: { type: DataTypes.INTEGER, allowNull: false },
      // Nueva columna opcional para foto pública
      fotoUrl: { type: DataTypes.STRING, allowNull: true },
    },
    { tableName: "hotels", timestamps: true }
  );
  return Hotel;
};
