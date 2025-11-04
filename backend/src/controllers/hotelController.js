const { Hotel } = require("../models");

async function listHoteles(_req, res) {
  const hoteles = await Hotel.findAll();
  res.json(hoteles);
}

async function getHotel(req, res) {
  const hotel = await Hotel.findByPk(req.params.id);
  if (!hotel) return res.status(404).json({ error: "Hotel no encontrado" });
  res.json(hotel);
}

async function createHotel(req, res) {
  const { nombre, direccion, estrellas } = req.body;
  if (!nombre || !direccion || !Number.isInteger(Number(estrellas))) {
    return res.status(400).json({ error: "Datos inválidos" });
  }
  const hotel = await Hotel.create({ nombre, direccion, estrellas: Number(estrellas) });
  res.status(201).json(hotel);
}

async function updateHotel(req, res) {
  const hotel = await Hotel.findByPk(req.params.id);
  if (!hotel) return res.status(404).json({ error: "Hotel no encontrado" });
  const { nombre, direccion, estrellas } = req.body;
  await hotel.update({
    nombre: nombre ?? hotel.nombre,
    direccion: direccion ?? hotel.direccion,
    estrellas: estrellas ?? hotel.estrellas,
  });
  res.json(hotel);
}

async function deleteHotel(req, res) {
  const hotel = await Hotel.findByPk(req.params.id);
  if (!hotel) return res.status(404).json({ error: "Hotel no encontrado" });
  await hotel.destroy();
  res.json({ message: "Hotel eliminado" });
}

module.exports = {
  listHoteles,
  getHotel,
  createHotel,
  updateHotel,
  deleteHotel,
};
