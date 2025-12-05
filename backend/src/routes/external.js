// backend/src/routes/external.js
const express = require("express");
const router = express.Router();
const axios = require("axios");

// Ping básico para comprobar que la ruta carga
router.get("/ping", (req, res) => {
  res.json({ ok: true, service: "external" });
});

/**
 * Geocoding simple usando Nominatim (OpenStreetMap)
 * GET /api/external/geocode?q=Lima
 */
router.get("/geocode", async (req, res) => {
  const q = (req.query.q || "").toString().trim();
  if (!q) return res.status(400).json({ error: "Falta parámetro q" });

  try {
    const { data } = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          q,
          format: "json",
          addressdetails: 1,
          limit: 5,
        },
        headers: { "User-Agent": "ReservaHoteles/1.0" },
      }
    );
    res.json(data);
  } catch (e) {
    console.error("ERROR geocode:", e.message);
    res.status(502).json({ error: "Fallo geocoding", detail: e.message });
  }
});

/**
 * Clima actual usando OpenWeatherMap
 * GET /api/external/weather?city=Lima
 */
router.get("/weather", async (req, res) => {
  const city = (req.query.city || "").toString().trim();
  if (!city) return res.status(400).json({ error: "Falta parámetro city" });

  const apiKey = process.env.OPENWEATHER_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "Falta OPENWEATHER_KEY en .env",
    });
  }

  try {
    const { data } = await axios.get(
      "https://api.openweathermap.org/data/2.5/weather",
      {
        params: {
          q: city,
          appid: apiKey,
          units: "metric", // °C
          lang: "es",
        },
      }
    );

    const respuesta = {
      name: data.name,
      country: data.sys?.country,
      temp: data.main?.temp,
      temp_min: data.main?.temp_min,
      temp_max: data.main?.temp_max,
      icon: data.weather?.[0]?.icon,
      description: data.weather?.[0]?.description,
    };

    res.json(respuesta);
  } catch (e) {
    console.error("ERROR weather:", e.response?.data || e.message);
    res.status(502).json({
      error: "No se pudo obtener clima",
      detail: e.message,
    });
  }
});

module.exports = router;





