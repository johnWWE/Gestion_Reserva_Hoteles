const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Hotel = sequelize.define(
    "Hotel",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      nombre: { type: DataTypes.STRING, allowNull: false },
      direccion: { type: DataTypes.STRING, allowNull: false },
      estrellas: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      tableName: "hotels", // 👈 nombre fijo en minúscula
      timestamps: true,
    }
  );
  return Hotel;
};
