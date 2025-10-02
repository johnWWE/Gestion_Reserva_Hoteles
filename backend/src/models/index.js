const { Sequelize } = require("sequelize");
const sequelize = require("../config/database");
const UserModel = require("./User");
const HotelModel = require("./Hotel");
const HabitacionModel = require("./Habitacion");
const ReservaModel = require("./Reserva");
//inciiar modelos
const User = UserModel(sequelize);
const Hotel = HotelModel(sequelize);
const Habitacion = HabitacionModel(sequelize);
const Reserva = ReservaModel(sequelize);

// Relaciones
Hotel.hasMany(Habitacion, { foreignKey: "hotelId" });
Habitacion.belongsTo(Hotel, { foreignKey: "hotelId" });

User.hasMany(Reserva, { foreignKey: "userId" });
Reserva.belongsTo(User, { foreignKey: "userId" });

Habitacion.hasMany(Reserva, { foreignKey: "habitacionId" });
Reserva.belongsTo(Habitacion, { foreignKey: "habitacionId" });

module.exports = { sequelize, User, Hotel, Habitacion, Reserva };
