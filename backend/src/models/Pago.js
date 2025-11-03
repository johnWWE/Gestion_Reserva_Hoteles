// backend/src/models/Pago.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Pago = sequelize.define(
    "Pago",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      // quién pagó (cliente). Puede ser null si paga el admin manualmente
      userId: { type: DataTypes.INTEGER, allowNull: true },

      reservaId: { type: DataTypes.INTEGER, allowNull: false },
      monto: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      moneda: { type: DataTypes.STRING(8), allowNull: false, defaultValue: "PEN" },

      metodo: { type: DataTypes.STRING(30), allowNull: false, defaultValue: "tarjeta" },
      estado: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "completado", // "pendiente" | "completado" | "fallido"
        validate: { isIn: { args: [["pendiente", "completado", "fallido"]], msg: "Estado de pago inválido" } }
      },
      txnId: { type: DataTypes.STRING(100), allowNull: true }, // id transacción pasarela, si aplicara
    },
    { tableName: "pagos", timestamps: true }
  );

  return Pago;
};
