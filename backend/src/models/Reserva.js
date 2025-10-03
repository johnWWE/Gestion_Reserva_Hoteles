const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Reserva = sequelize.define(
    "Reserva",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      fechaInicio: { type: DataTypes.DATE, allowNull: false },
      fechaFin: { type: DataTypes.DATE, allowNull: false },
      estado: { type: DataTypes.STRING, defaultValue: "pendiente" },
      userId: { type: DataTypes.INTEGER, allowNull: false },
      habitacionId: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      tableName: "reservas", // 👈 nombre fijo en minúscula
      timestamps: true,
    }
  );
  return Reserva;
};
