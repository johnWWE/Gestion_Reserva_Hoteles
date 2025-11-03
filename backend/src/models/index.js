// backend/src/models/index.js
const sequelize = require("../config/database");
const UserModel = require("./User");
const HotelModel = require("./Hotel");
const HabitacionModel = require("./Habitacion");
const ReservaModel = require("./Reserva");

// 👇 NUEVOS
const PagoModel = require("./Pago");
const LogModel = require("./Log");

// Instanciar modelos
const User = UserModel(sequelize);
const Hotel = HotelModel(sequelize);
const Habitacion = HabitacionModel(sequelize);
const Reserva = ReservaModel(sequelize);
// 👇 NUEVOS
const Pago = PagoModel(sequelize);
const Log = LogModel(sequelize);


// Relaciones
Hotel.hasMany(Habitacion, { foreignKey: "hotelId", onDelete: "CASCADE" });
Habitacion.belongsTo(Hotel, { foreignKey: "hotelId" });

User.hasMany(Reserva, { foreignKey: "userId", onDelete: "SET NULL" });
Reserva.belongsTo(User, { foreignKey: "userId" });

Habitacion.hasMany(Reserva, { foreignKey: "habitacionId", onDelete: "CASCADE" });
Reserva.belongsTo(Habitacion, { foreignKey: "habitacionId" });
// 👇 NUEVAS RELACIONES
Reserva.hasMany(Pago, { foreignKey: "reservaId", onDelete: "CASCADE" });
Pago.belongsTo(Reserva, { foreignKey: "reservaId" });

User.hasMany(Pago, { foreignKey: "userId", onDelete: "SET NULL" });
Pago.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Log, { foreignKey: "userId", onDelete: "SET NULL" });
Log.belongsTo(User, { foreignKey: "userId" });

module.exports = { sequelize, User, Hotel, Habitacion, Reserva, Pago, Log };
