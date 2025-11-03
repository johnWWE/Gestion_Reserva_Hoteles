// backend/src/models/Reserva.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Reserva = sequelize.define(
    "Reserva",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      userId: { type: DataTypes.INTEGER, allowNull: true }, // SET NULL en FK si borran usuario
      habitacionId: { type: DataTypes.INTEGER, allowNull: false },
      fechaInicio: { type: DataTypes.DATEONLY, allowNull: false },
      fechaFin: { type: DataTypes.DATEONLY, allowNull: false },
      estado: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "confirmada",
        validate: { isIn: { args: [["pendiente","confirmada","cancelada","pagada"]], msg: "Estado inválido" } }
      },
    },
    { tableName: "reservas", timestamps: true }
  );
  return Reserva;
};

