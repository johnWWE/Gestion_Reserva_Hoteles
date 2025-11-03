// frontend/js/admin-reports.js
import { request } from "./api.js";

const $ = s => document.querySelector(s);

// Contenedores de tablas
const tblIng = $("#tbl-ingresos");
const tblRxH = $("#tbl-rxh");
const tblOcu = $("#tbl-ocu");

// Canvases (gráficos)
const cIng = $("#chart-ingresos");
const cRxH = $("#chart-rxh");
const cOcu = $("#chart-ocu");

// ============================
// Formatos bonitos
// ============================
const PEN = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });
const PCT = new Intl.NumberFormat("es-PE", { style: "percent", maximumFractionDigits: 2 });

function fmt(key, val) {
  if (val == null) return "";
  if (key === "total") return PEN.format(Number(val));              // S/ 100.00
  if (key === "ocupacionPct") return PCT.format(Number(val) / 100); // 12.5 %
  if (!isNaN(val) && key !== "periodo") return Number(val);
  return val;
}

// ============================
// Render genérico de tablas
// ============================
function renderTable(el, headers, rows) {
  if (!rows?.length) {
    el.innerHTML = "<p class='muted'>Sin datos.</p>";
    return;
  }
  const thead = `<thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead>`;
  const tbody = `<tbody>${
    rows.map(r =>
      `<tr>${headers.map(h => `<td>${fmt(h, r[h])}</td>`).join("")}</tr>`
    ).join("")
  }</tbody>`;
  el.innerHTML = `<table class="table">${thead}${tbody}</table>`;
}

// ============================
// Chart helpers
// ============================
let chartIng, chartRxH, chartOcu;

function makeOrUpdateChart(chartRef, ctx, type, data, options = {}) {
  // Asegura que Chart.js esté cargado (UMD en window.Chart)
  if (!window.Chart) {
    console.error("Chart.js no está cargado. Verifica el <script> en admin-reports.html");
    return chartRef;
  }
  if (chartRef) {
    chartRef.data = data;
    chartRef.options = options;
    chartRef.update();
    return chartRef;
  }
  return new window.Chart(ctx, { type, data, options });
}

const tooltipCurrency = {
  callbacks: {
    label: (ctx) => {
      const v = ctx.raw ?? 0;
      return ` ${PEN.format(Number(v))}`;
    }
  }
};

const tooltipPercent = {
  callbacks: {
    label: (ctx) => ` ${PCT.format((Number(ctx.raw) || 0) / 100)}`
  }
};

// ============================
// Estado para PDF (últimos datasets y filtros usados)
// ============================
let lastIngresos = { rows: [], desde: "", hasta: "" };
let lastRxH = { rows: [] };
let lastOcup = { rows: [], inicio: "", fin: "" };

// ============================
// Ingresos por mes (tabla + línea)
// ============================
$("#f-ingresos").addEventListener("submit", async (e) => {
  e.preventDefault();
  const d = $("#ing-desde").value || "";
  const h = $("#ing-hasta").value || "";
  const q = new URLSearchParams();
  if (d) q.set("desde", d);
  if (h) q.set("hasta", h);

  const data = await request(`/api/reportes/ingresos?${q.toString()}`);
  lastIngresos = { rows: data, desde: d, hasta: h };
  renderTable(tblIng, ["periodo", "total", "pagos"], data);

  const labels = data.map(x => x.periodo);
  const valores = data.map(x => Number(x.total || 0));

  const ds = {
    labels,
    datasets: [{
      label: "Ingresos",
      data: valores,
      borderWidth: 2,
      tension: 0.25,
      fill: true
    }]
  };
  const opts = {
    plugins: { tooltip: tooltipCurrency, legend: { display: false } },
    scales: {
      y: { ticks: { callback: (v) => PEN.format(Number(v)) } }
    }
  };
  chartIng = makeOrUpdateChart(chartIng, cIng, "line", ds, opts);
});

// ============================
// Reservas por hotel (tabla + barras horizontales)
// ============================
$("#btn-rxh").addEventListener("click", async () => {
  const data = await request("/api/reportes/reservas-por-hotel");
  lastRxH = { rows: data };
  renderTable(tblRxH, ["hotelNombre","reservas","hotelId"], data);

  const labels = data.map(x => x.hotelNombre);
  const valores = data.map(x => Number(x.reservas || 0));

  const ds = {
    labels,
    datasets: [{
      label: "Reservas",
      data: valores
    }]
  };
  const opts = {
    plugins: { legend: { display: false } },
    indexAxis: "y"
  };
  chartRxH = makeOrUpdateChart(chartRxH, cRxH, "bar", ds, opts);
});

// ============================
// Ocupación por rango (tabla + barras %)
// ============================
$("#f-ocu").addEventListener("submit", async (e) => {
  e.preventDefault();
  const i = $("#ocu-inicio").value;
  const f = $("#ocu-fin").value;
  if (!i || !f) return alert("Indica inicio y fin.");

  const data = await request(`/api/reportes/ocupacion?inicio=${i}&fin=${f}`);
  lastOcup = { rows: data, inicio: i, fin: f };

  renderTable(
    tblOcu,
    ["hotelNombre","ocupacionPct","nochesOcupadas","nochesTotalesHotel","habitaciones","hotelId"],
    data
  );

  const labels = data.map(x => x.hotelNombre);
  const valores = data.map(x => Number(x.ocupacionPct || 0));

  const ds = {
    labels,
    datasets: [{
      label: "Ocupación (%)",
      data: valores
    }]
  };
  const opts = {
    plugins: { tooltip: tooltipPercent, legend: { display: false } },
    scales: {
      y: {
        max: 100,
        ticks: { callback: (v) => PCT.format(Number(v)/100) }
      }
    }
  };
  chartOcu = makeOrUpdateChart(chartOcu, cOcu, "bar", ds, opts);
});

// ============================
// Exportar PDF SERIO (solo resultados) con encabezado
// ============================
async function loadImageAsDataURL(url) {
  try {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function chartToDataURL(chart) {
  try {
    if (!chart) return null;
    if (typeof chart.toBase64Image === "function") return chart.toBase64Image();
    const canvas = chart.canvas || chart.ctx?.canvas;
    return canvas ? canvas.toDataURL("image/png", 1.0) : null;
  } catch {
    return null;
  }
}

function addHeader(pdf, { logo, title, subtitle }) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 12;
  const headerHeight = 18;

  if (logo) {
    const imgW = 24, imgH = 24;
    pdf.addImage(logo, "PNG", margin, margin - 4, imgW, imgH);
  }

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.setTextColor(20);
  pdf.text(title, logo ? margin + 30 : margin, margin + 2);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(80);
  if (subtitle) pdf.text(subtitle, logo ? margin + 30 : margin, margin + 8);

  pdf.setDrawColor(200);
  pdf.line(margin, margin + headerHeight, pageWidth - margin, margin + headerHeight);

  return margin + headerHeight + 6; // y inicial
}

function addSectionTitle(pdf, y, text) {
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.setTextColor(30);
  pdf.text(text, 12, y);
  return y + 6;
}

function addChart(pdf, imgData, y) {
  if (!imgData) return y;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 12;
  const maxW = pageWidth - margin * 2;
  const estH = maxW * 0.42; // alto estimado
  pdf.addImage(imgData, "PNG", margin, y, maxW, estH);
  return y + estH + 6;
}

function addTable(pdf, y, columns, rows) {
  if (!rows?.length) {
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(10);
    pdf.setTextColor(120);
    pdf.text("Sin datos.", 12, y + 4);
    return y + 10;
  }
  const startY = y;

  // jsPDF y AutoTable deben estar disponibles vía UMD
  const jsPDFCtor = window?.jspdf?.jsPDF;
  const hasAutoTable = !!(window.jspdf && jsPDFCtor && typeof (new jsPDFCtor()).autoTable === "function");

  if (!hasAutoTable) {
    // Fallback: tabla simple como texto si autotable no cargó
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(10); pdf.setTextColor(30);
    let x = 12, yTxt = y + 4;
    pdf.text(columns.join(" | "), x, yTxt);
    pdf.setFont("helvetica", "normal"); pdf.setTextColor(50);
    rows.forEach((r, idx) => {
      yTxt += 6;
      const line = columns.map(c => String(r[c] ?? "")).join(" | ");
      if (yTxt > pdf.internal.pageSize.getHeight() - 12) {
        pdf.addPage(); yTxt = addHeader(pdf, { logo: null, title: "Continuación", subtitle: "" }) + 4;
      }
      pdf.text(line, x, yTxt);
      if (idx === rows.length - 1) yTxt += 4;
    });
    return yTxt + 6;
  }

  // eslint-disable-next-line no-undef
  pdf.autoTable({
    startY,
    head: [columns],
    body: rows.map(r => columns.map(c => r[c] ?? "")),
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [59,130,246] }, // azul suave
    margin: { left: 12, right: 12 }
  });
  return pdf.lastAutoTable.finalY + 6;
}

async function exportPDF() {
  try {
    // ✅ REFERENCIA UMD SEGURA a jsPDF
    const jsPDFCtor = window?.jspdf?.jsPDF;
    if (!jsPDFCtor) {
      alert("No se pudo cargar jsPDF. Verifica el <script> de jsPDF en admin-reports.html");
      return;
    }

    const pdf = new jsPDFCtor({ unit: "mm", format: "a4" });
    const logo = await loadImageAsDataURL("assets/logo.png"); // opcional
    const hoy = new Date().toLocaleString();

    // ENCABEZADO
    let y = addHeader(pdf, {
      logo,
      title: "Reporte de Gestión",
      subtitle: `ReservaHoteles · Generado: ${hoy}`
    });

    // ===== Ingresos por mes
    y = addSectionTitle(pdf, y, "Ingresos por mes");
    pdf.setFont("helvetica", "normal"); pdf.setFontSize(9); pdf.setTextColor(100);
    const rangoIng = (lastIngresos.desde || lastIngresos.hasta)
      ? `Rango: ${lastIngresos.desde || "—"} a ${lastIngresos.hasta || "—"}`
      : "Rango: (no especificado)";
    pdf.text(rangoIng, 12, y); y += 5;

    y = addChart(pdf, chartToDataURL(chartIng), y);
    y = addTable(pdf, y, ["periodo","total","pagos"], lastIngresos.rows);

    // Nueva página
    pdf.addPage();
    y = addHeader(pdf, { logo, title: "Reporte de Gestión", subtitle: `ReservaHoteles · Generado: ${hoy}` });

    // ===== Reservas por hotel
    y = addSectionTitle(pdf, y, "Reservas por hotel");
    y = addChart(pdf, chartToDataURL(chartRxH), y);
    y = addTable(pdf, y, ["hotelNombre","reservas","hotelId"], lastRxH.rows);

    // Nueva página
    pdf.addPage();
    y = addHeader(pdf, { logo, title: "Reporte de Gestión", subtitle: `ReservaHoteles · Generado: ${hoy}` });

    // ===== Ocupación por rango
    y = addSectionTitle(pdf, y, "Ocupación por rango");
    const rangoOcu = (lastOcup.inicio && lastOcup.fin)
      ? `Rango: ${lastOcup.inicio} a ${lastOcup.fin}`
      : "Rango: (no especificado)";
    pdf.setFont("helvetica", "normal"); pdf.setFontSize(9); pdf.setTextColor(100);
    pdf.text(rangoOcu, 12, y); y += 5;

    y = addChart(pdf, chartToDataURL(chartOcu), y);
    y = addTable(pdf, y, ["hotelNombre","ocupacionPct","nochesOcupadas","nochesTotalesHotel","habitaciones","hotelId"], lastOcup.rows);

    pdf.save(`reportes_${new Date().toISOString().slice(0,10)}.pdf`);
  } catch (err) {
    console.error("Export PDF error:", err);
    alert("No se pudo generar el PDF. Revisa la consola para más detalles.");
  }
}

// Botón principal PDF
$("#btn-export-pdf")?.addEventListener("click", exportPDF);
