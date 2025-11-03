// backend/src/routes/external.js
const express = require("express");
const router = express.Router();
// (opcional) si quieres usar un geocoder público
const axios = require("axios");

// Ping básico para comprobar que la ruta carga
router.get("/ping", (req, res) => {
  res.json({ ok: true, service: "external" });
});

/**
 * Ejemplo: proxy muy simple a Nominatim
 * GET /api/external/geocode?q=Lima
 */
router.get("/geocode", async (req, res) => {
  const q = (req.query.q || "").toString().trim();
  if (!q) return res.status(400).json({ error: "Falta parámetro q" });
  try {
    const { data } = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      { params: { q, format: "json", addressdetails: 1, limit: 5 },
        headers: { "User-Agent": "ReservaHoteles/1.0" } }
    );
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: "Fallo geocoding", detail: e.message });
  }
});

module.exports = router;
