const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Habitacion = sequelize.define(
    "Habitacion",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      numero: { type: DataTypes.STRING, allowNull: false },
      capacidad: { type: DataTypes.INTEGER, allowNull: false },
      precio: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      hotelId: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      tableName: "habitaciones", // 👈 plural correcto y minúscula
      timestamps: true,
    }
  );
  return Habitacion;
};

