// backend/src/models/Log.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Log = sequelize.define(
    "Log",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      userId: { type: DataTypes.INTEGER, allowNull: true }, // quién hizo la acción
      accion: { type: DataTypes.STRING(50), allowNull: false }, // ej: 'crear_reserva', 'pagar_reserva'
      entidad: { type: DataTypes.STRING(50), allowNull: false }, // ej: 'Reserva', 'Pago', 'Hotel'
      entidadId: { type: DataTypes.INTEGER, allowNull: true },
      detalle: { type: DataTypes.JSONB || DataTypes.JSON, allowNull: true }, // Postgres JSONB si aplica
    },
    { tableName: "logs", timestamps: true }
  );
  return Log;
};
