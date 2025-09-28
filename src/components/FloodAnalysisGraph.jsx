// src/components/FloodAnalysisGraph.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const API_URL = process.env.REACT_APP_API_URL || "https://communisafe-backend.onrender.com";

const getAuthHeaders = () => {
  const t = localStorage.getItem("token");
  return t ? { Authorization: `Bearer ${t}` } : {};
};

// simple helpers
const fmt = (d) =>
  new Date(d).toLocaleString([], { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });

function sma(values, period = 5) {
  if (!values?.length) return [];
  const out = [];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    out.push(i >= period - 1 ? +(sum / period).toFixed(2) : null);
  }
  return out;
}
// format Date -> "YYYY-MM-DDTHH:mm" (for datetime-local) in LOCAL time
const toLocalInput = (d) => {
  const pad = (n) => String(n).padStart(2, "0");
  const dt = new Date(d);
  return `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
};
// parse from datetime-local value (local) -> ISO string (UTC) ONLY when sending to server
const localInputToISO = (val) => {
  // val like "2025-09-15T08:44"
  const dt = new Date(val);
  return dt.toISOString();
};


// threshold band plugin (optional nice background)
const thresholdBands = (bands) => ({
  id: "thresholdBands",
  beforeDraw: (chart) => {
    const { ctx, chartArea, scales } = chart;
    if (!chartArea || !bands?.length) return;
    const { left, right, top, bottom } = chartArea;
    const yScale = scales.y;

    ctx.save();
    bands.forEach(({ from, to, fill }) => {
      const yTop = yScale.getPixelForValue(to);
      const yBottom = yScale.getPixelForValue(from);
      ctx.fillStyle = fill;
      ctx.fillRect(left, yTop, right - left, yBottom - yTop);
    });
    ctx.restore();
  },
});

export default function FloodAnalysisGraph({ sensorId }) {
  const [range, setRange] = useState("24h");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // compute default from/to for quick ranges
  const quickRange = (key) => {
    const now = new Date();
    const end = now.toISOString();
    const start = new Date(now);
    if (key === "1h") start.setHours(now.getHours() - 1);
    if (key === "6h") start.setHours(now.getHours() - 6);
    if (key === "24h") start.setDate(now.getDate() - 1);
    if (key === "7d") start.setDate(now.getDate() - 7);
    setFrom(start.toISOString());
    setTo(end);
    setRange(key);
  };

  // kick off with default 24h
  useEffect(() => {
    quickRange("24h");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sensorId]);

useEffect(() => {
    if (!sensorId || !from || !to) return;

    

    const fromISO = localInputToISO(from);
     const toISO   = localInputToISO(to);
    if (!fromISO || !toISO) return;

    const normalize = (arr) =>
      (arr || [])
        .filter((r) => Number.isFinite(Number(r?.waterLevel)))
        .map((r) => ({
          t: r.recordedAt || r.createdAt || r.timestamp || r.time || r.date || Date.now(),
          y: Number(r.waterLevel),
        }))
        .sort((a, b) => new Date(a.t) - new Date(b.t));

    const tryFetch = async () => {
      setLoading(true);
      try {
        // 0) Log what we’re sending
        console.log("[Analysis] sensorId:", sensorId, "from:", fromISO, "to:", toISO);

        // 1) Primary: /api/flood/readings with sensor + from/to
        let res = await axios.get(`${API_URL}/api/flood/readings`, {
          params: { sensor: sensorId, from: fromISO, to: toISO, sort: "asc", limit: 5000 },
          headers: getAuthHeaders(),
        });
        let items = Array.isArray(res.data) ? res.data : res.data?.items || [];
        if (items.length) return setRows(normalize(items));
        // 2) Alternate param name: sensorId
        res = await axios.get(`${API_URL}/api/flood/readings`, {
          params: { sensorId: sensorId, from: fromISO, to: toISO, sort: "asc", limit: 5000 },
          headers: getAuthHeaders(),
        });
        items = Array.isArray(res.data) ? res.data : res.data?.items || [];
        if (items.length) return setRows(normalize(items));

        // 3) Alternate route shape (common patterns)
        try {
          res = await axios.get(`${API_URL}/api/flood/sensors/${sensorId}/readings`, {
            params: { from: fromISO, to: toISO, sort: "asc", limit: 5000 },
            headers: getAuthHeaders(),
          });
          items = Array.isArray(res.data) ? res.data : res.data?.items || [];
          if (items.length) return setRows(normalize(items));
        } catch {}

        // 4) Fallback: latest N without date filters (so at least may makita ka)
        res = await axios.get(`${API_URL}/api/flood/readings`, {
          params: { sensor: sensorId, sort: "desc", limit: 120 },
          headers: getAuthHeaders(),
        });
        items = Array.isArray(res.data) ? res.data : res.data?.items || [];
        if (items.length) return setRows(normalize(items));

        setRows([]); // still nothing
      } catch (e) {
        console.error("[Analysis] fetch failed:", e);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    tryFetch();
  }, [sensorId, from, to]);

  const labels = useMemo(() => rows.map((r) => fmt(r.t)), [rows]);
  const values = useMemo(() => rows.map((r) => r.y), [rows]);
  const avg = useMemo(() => (values.length ? +(values.reduce((a, b) => a + b, 0) / values.length).toFixed(2) : 0), [values]);
  const min = useMemo(() => (values.length ? Math.min(...values) : 0), [values]);
  const max = useMemo(() => (values.length ? Math.max(...values) : 0), [values]);
  const last = values.at(-1) ?? 0;
  const prev = values.length > 1 ? values.at(-2) : last;
  const delta = +(last - prev).toFixed(2);

  const THRESH = { low: 30, medium: 60, high: 90 };
  const bandPlugin = thresholdBands([
    { from: 0, to: THRESH.low, fill: "rgba(59,130,246,0.06)" },     // blue-ish
    { from: THRESH.low, to: THRESH.medium, fill: "rgba(251,146,60,0.08)" }, // orange-ish
    { from: THRESH.medium, to: 9999, fill: "rgba(239,68,68,0.06)" }, // red-ish
  ]);

  const data = {
    labels,
    datasets: [
      {
        label: "Water Level (cm)",
        data: values,
        borderWidth: 2,
        tension: 0.25,
        pointRadius: 0,
      
      segment: {
        borderColor: (ctx) => {
          const y = ctx.p0?.parsed?.y;
          if (y <= THRESH.low) return "blue";
          if (y <= THRESH.medium) return "orange";
          return "red";
        },
      },
    },
      {
        label: "5-pt Moving Avg",
        data: sma(values, 5),
        borderWidth: 2,
        tension: 0.25,
        pointRadius: 0,
        borderDash: [6, 6],
        borderColor: "gray",
      },
    ],
  };

  const options = {
    responsive: true,
    animation: false,
    spanGaps: true,
    plugins: {
      legend: { display: true },
      tooltip: { mode: "index", intersect: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: "Water Level (cm)" },
        ticks: { stepSize: 10 },
      },
      x: {
        title: { display: true, text: "Timestamp" },
        ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 10 },
      },
    },
  };

  const downloadCSV = () => {
    const header = "timestamp,waterLevel(cm)\n";
    const body = rows.map((r) => `${new Date(r.t).toISOString()},${r.y}`).join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `flood_readings_${sensorId}_${new Date().toISOString().slice(0, 19)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="appr-card" style={{ padding: 16 }}>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-700">Analysis: Water Level Over Time</h3>
          <p className="text-sm text-gray-500">
            Choose a range, or pick exact dates to generate a downloadable analysis.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-2">
          <button className={`btn-submit ${range === "1h" ? "opacity-80" : ""}`} onClick={() => quickRange("1h")}>
            Last 1h
          </button>
          <button className={`btn-submit ${range === "6h" ? "opacity-80" : ""}`} onClick={() => quickRange("6h")}>
            Last 6h
          </button>
          <button className={`btn-submit ${range === "24h" ? "opacity-80" : ""}`} onClick={() => quickRange("24h")}>
            Last 24h
          </button>
          <button className={`btn-submit ${range === "7d" ? "opacity-80" : ""}`} onClick={() => quickRange("7d")}>
            Last 7d
          </button>
        </div>
      </div>

      {/* Custom range */}
      <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-2">
        <div className="col-span-2">
          <label className="text-sm text-gray-600">From</label>
          <input
            className="appr-input w-full"
            type="datetime-local"
            value={from ? toLocalInput(from) : ""}
             onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div className="col-span-2">
          <label className="text-sm text-gray-600">To</label>
          <input
            className="appr-input w-full"
            type="datetime-local"
             value={to ? toLocalInput(to) : ""}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
        <div className="appr-chip">Points: <strong>{rows.length}</strong></div>
        <div className="appr-chip">Min: <strong>{min} cm</strong></div>
        <div className="appr-chip">Max: <strong>{max} cm</strong></div>
        <div className="appr-chip">Avg: <strong>{avg} cm</strong></div>
        <div className="appr-chip">Δ Last: <strong>{delta >= 0 ? `+${delta}` : delta} cm</strong></div>
      </div>

      {/* Chart */}
      <div className="rounded-2xl overflow-hidden border border-green-100 bg-white mt-3" style={{ height: 360 }}>
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-500">Loading…</div>
        ) : rows.length ? (
          <Line data={data} options={options} plugins={[bandPlugin]} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">No data for selected range.</div>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <button className="btn-submit" onClick={downloadCSV}>Download CSV</button>
        <span className="text-xs text-gray-500 self-center">
          Range: {from ? fmt(from) : "—"} – {to ? fmt(to) : "—"}
        </span>
      </div>
    </section>
  );
}
