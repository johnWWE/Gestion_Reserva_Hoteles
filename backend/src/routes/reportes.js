const express = require("express");
const { Op, fn, col, literal } = require("sequelize");
const { authenticateToken, authorizeRole } = require("../middlewares/authMiddleware");
const { sequelize, Reserva, Pago, Hotel, Habitacion } = require("../models");


const router = express.Router();

function asISO(s) {
  if (!s) return null;
  const v = String(s).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  if (/^\d{4}-\d{2}-\d{2}T/.test(v)) return v.slice(0,10);
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) { const [d,m,y]=v.split("/"); return `${y}-${m}-${d}`; }
  const m = v.match(/^(\d{4}-\d{2}-\d{2})/); if (m) return m[1];
  return null;
}

// ---------- 1) Ingresos por mes (pagos completados) ----------
router.get("/ingresos", authenticateToken, authorizeRole(["admin"]), async (req, res) => {
  // filtros opcionales ?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
  const desde = asISO(req.query.desde);
  const hasta = asISO(req.query.hasta);
  const where = { estado: "completado" };
  if (desde) where.createdAt = { [Op.gte]: new Date(`${desde}T00:00:00Z`) };
  if (hasta) where.createdAt = { ...(where.createdAt||{}), [Op.lte]: new Date(`${hasta}T23:59:59Z`) };

  const rows = await Pago.findAll({
    attributes: [
      // YYYY-MM
      [literal(`to_char("Pago"."createdAt",'YYYY-MM')`), "periodo"],
      [fn("SUM", col("monto")), "total"],
      [fn("COUNT", col("id")), "pagos"]
    ],
    where,
    group: [literal(`to_char("Pago"."createdAt",'YYYY-MM')`)],
    order: [[literal(`to_char("Pago"."createdAt",'YYYY-MM')`), "ASC"]]
  });

  res.json(rows.map(r => ({
    periodo: r.get("periodo"),
    total: Number(r.get("total")),
    pagos: Number(r.get("pagos")),
  })));
});

// ---------- 2) Reservas por hotel ----------
// ---------- 2) Reservas por hotel (SQL robusto, tablas reales: hotels, habitaciones, reservas) ----------
router.get("/reservas-por-hotel", authenticateToken, authorizeRole(["admin"]), async (_req, res) => {
  try {
    const [rows] = await sequelize.query(`
      SELECT
        ho.id            AS "hotelId",
        ho.nombre        AS "hotelNombre",
        COALESCE(COUNT(r.id), 0) AS "reservas"
      FROM hotels ho
      LEFT JOIN habitaciones h ON h."hotelId" = ho.id
      LEFT JOIN reservas r ON r."habitacionId" = h.id
                             AND r.estado <> 'cancelada'
      GROUP BY ho.id, ho.nombre
      ORDER BY "reservas" DESC, ho.nombre ASC
    `);

    // normaliza tipos numéricos
    const data = rows.map(r => ({
      hotelId: Number(r.hotelId),
      hotelNombre: r.hotelNombre,
      reservas: Number(r.reservas),
    }));

    res.json(data);
  } catch (err) {
    console.error("GET /api/reportes/reservas-por-hotel ERROR:", err);
    res.status(500).json({ error: "No se pudo obtener el conteo de reservas por hotel" });
  }
});
// ---------- 3) Ocupación por rango (noches reservadas / noches disponibles) ----------
router.get("/ocupacion", authenticateToken, authorizeRole(["admin"]), async (req, res) => {
  // rango requerido
  const inicio = asISO(req.query.inicio);
  const fin    = asISO(req.query.fin);
  if (!inicio || !fin || new Date(inicio) >= new Date(fin)) {
    return res.status(400).json({ error: "inicio y fin válidos (YYYY-MM-DD) son requeridos" });
  }
  const totalNochesRango = Math.ceil((new Date(fin)-new Date(inicio))/(24*3600*1000)); // [inicio, fin)

  // habitaciones totales
  const habitaciones = await Habitacion.findAll({ attributes:["id","hotelId"], include:[{model:Hotel,attributes:["nombre"]}] });
  const habPorHotel = new Map();
  for (const h of habitaciones) {
    const hid = Number(h.hotelId);
    habPorHotel.set(hid, (habPorHotel.get(hid)||{count:0, nombre:h.Hotel?.nombre}).count+1
      ? { count:(habPorHotel.get(hid)?.count||0)+1, nombre:h.Hotel?.nombre }
      : { count:1, nombre:h.Hotel?.nombre });
  }

  // reservas que solapan el rango (regla semiabierta)
  const reservas = await Reserva.findAll({
    where: {
      [Op.and]: [
        { fechaInicio: { [Op.lt]: fin } },
        { fechaFin:   { [Op.gt]: inicio } },
        { estado: { [Op.ne]: "cancelada" } }
      ]
    },
    include: [{ model: Habitacion, attributes:["hotelId"] }]
  });

  // noches ocupadas por hotel (suma de intersección por reserva)
  const nochesOcupadas = new Map(); // hotelId -> noches
  for (const r of reservas) {
    const hi = r.fechaInicio; const hf = r.fechaFin;
    const interIni = new Date(Math.max(new Date(hi), new Date(inicio)));
    const interFin = new Date(Math.min(new Date(hf), new Date(fin)));
    const noches = Math.max(0, Math.ceil((interFin - interIni)/(24*3600*1000)));
    if (noches > 0) {
      const hid = Number(r.Habitacion?.hotelId);
      nochesOcupadas.set(hid, (nochesOcupadas.get(hid) || 0) + noches);
    }
  }

  // armar respuesta
  const out = [];
  for (const [hotelId, info] of habPorHotel.entries()) {
    const nochesTotalesHotel = info.count * totalNochesRango;
    const ocupadas = nochesOcupadas.get(hotelId) || 0;
    const ocupacion = nochesTotalesHotel ? +(100 * ocupadas / nochesTotalesHotel).toFixed(2) : 0;
    out.push({
      hotelId,
      hotelNombre: info.nombre,
      habitaciones: info.count,
      nochesTotalesHotel,
      nochesOcupadas: ocupadas,
      ocupacionPct: ocupacion
    });
  }

  // hoteles sin habitaciones (por si acaso)
  if (!out.length) return res.json([]);

  // ordenar por ocupación
  out.sort((a,b)=>b.ocupacionPct - a.ocupacionPct);
  res.json(out);
});

module.exports = router;
