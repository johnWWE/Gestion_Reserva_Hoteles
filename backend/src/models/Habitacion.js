const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define("Habitacion", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    numero: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    tipo: {
      type: DataTypes.STRING, // simple, doble, suite
      allowNull: false,
    },
    precio: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false,
    },
    disponible: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  });
};
