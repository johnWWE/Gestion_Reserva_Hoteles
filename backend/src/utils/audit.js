// backend/src/utils/audit.js
const { Log } = require("../models");

async function logAction({ userId = null, accion, entidad, entidadId = null, detalle = null }) {
  try {
    await Log.create({ userId, accion, entidad, entidadId, detalle });
  } catch (e) {
    console.warn("⚠️ No se pudo registrar log:", e.message);
  }
}

module.exports = { logAction };
