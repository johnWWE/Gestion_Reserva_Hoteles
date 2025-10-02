const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define("Reserva", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    fechaInicio: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    fechaFin: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    estado: {
      type: DataTypes.ENUM("pendiente", "confirmada", "cancelada"),
      defaultValue: "pendiente",
    },
  });
};
