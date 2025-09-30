// src/components/FloodTracker.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import useDesktopNotification from "../hooks/useDesktopNotification";
// src/components/FloodTracker.jsx
import FloodReadingsTable from "./FloodReadingsTable"; 
import FloodReportsTable from "./FloodReportsTable";
import FloodAnalysisGraph from "../components/FloodAnalysisGraph";
import axios from "axios";


import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  Polyline,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import "../css/FloodTracker.css";

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
// ---- Flood thresholds (single source of truth) ----
const LOW_FT  = 1;
const MED_FT  = 2;
const HIGH_FT = 2.25;
const EPS     = 0.001; // rounding tolerance


const geojsonLineString = [
  [14.494416374245276, 121.00305909128258],
  [14.494081134506985, 121.00369914809767],
  [14.493461447593617, 121.00631183902738],
  [14.492415531179077, 121.00604079546207],
  [14.491569730217165, 121.00921867292169],
  [14.490852455801658, 121.00905189799727],
  [14.489750024922571, 121.01352372822282],
  [14.48714499086718, 121.01138561024635],
  [14.486823463391389, 121.01105757522924],
  [14.487930888620028, 121.00902136811072],
  [14.48648631918607, 121.00823970071878],
  [14.486366224560811, 121.00639463278827],
  [14.484585219606515, 121.0058925373346],
  [14.483609832422943, 121.00790731994755],
  [14.481992527052597, 121.00728738301518],
  [14.480959254733193, 121.01051194909871],
  [14.479618412713876, 121.01004562777746],
  [14.479146372898299, 121.01157882602087],
  [14.47999771636313, 121.01188839942262],
  [14.479398082248508, 121.01376469751324],
  [14.476797537819266, 121.01270618367528],
  [14.47860998529471, 121.00698557121842],
  [14.478082757500559, 121.00507240834759],
  [14.478515816424661, 121.00263902600778],
  [14.48037185418923, 121.00026348200481],
  [14.483595408078557, 121.00018385829145],
  [14.483895525323177, 120.99894398442484],
  [14.48676185616793, 121.00129658355337],
  [14.494475642344739, 121.00302095511921],
];

const geojsonPoints = [
  [14.494429267672885, 121.00303692152471],
  [14.478537582457562, 121.00265712320015],
  [14.491841264691814, 121.00829594057382],
];

// ─── Helpers ─────────────────────────────────────────
function formatTimestamp(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", hour12: true });
}
async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
    );
    const data = await res.json();
    return data.display_name || "Unknown location";
  } catch {
    return "Unknown location";
  }
}

// Click-to-report
function LocationMarker({ setNewAlert, setShowModal, sensor }) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      const now = new Date();
      const tzISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString();
      const locationName = await reverseGeocode(lat, lng);

      let severity = "";
      if (sensor && sensor.waterLevel) {
        const ft = sensor.waterLevel / 30.48;
        if (ft >= 2.9) severity = "High";
        else if (ft >= 2) severity = "Medium";
        else severity = "Low";
      }

      setNewAlert((prev) => ({
        ...prev,
        lat: lat.toFixed(6),
        lng: lng.toFixed(6),
        location: locationName,
        timestamp: tzISO,
        severity,
      }));
      setShowModal(true);
    },
  });
  return null;
}
function LiquidWaterGauge({
  valueCm = 0,
  lowFt = 1,
  medFt = 2,
  highFt = 3,
  size = 240,
}) {
  const valueFt = (Number(valueCm) || 0) / 30.48;
  const maxFt = highFt;
  const pct = Math.max(0, Math.min(100, (valueFt / maxFt) * 100));
  
  

  // Status + colors
  let status = "NONE";
  let color = "#9ca3af";
  if (valueFt >= highFt) { status = "HIGH"; color = "#dc2626"; }
  else if (valueFt >= medFt) { status = "MEDIUM"; color = "#f59e0b"; }
  else if (valueFt >= lowFt) { status = "LOW"; color = "#2563eb"; }

  // 🔸 dynamic water gradients per status
  const waterGradients = {
    LOW:     ["#cfe9ff", "#78b9ff"],   // light → blue
    MEDIUM:  ["#fde68a", "#f59e0b"],   // light → orange
    HIGH:    ["#fecaca", "#ef4444"],   // light → red
    NONE:    ["#e5e7eb", "#cbd5e1"],   // neutral (optional)
  };
  const [g1, g2] = waterGradients[status] || waterGradients.NONE;

  return (
    <div className="liq-wrap" style={{ width: size, height: size }}>
      <div className="liq-ring" />

      <div className="liq-circle">
        {/* water fill with dynamic color */}
        <div
          className="liq-water"
          style={{
            height: `${pct}%`,
            background: `linear-gradient(${g1}, ${g2})`,  
          }}
        >
          <div className="liq-wave" />
        </div>
        
        <div className="liq-center">
          <div className="liq-ft">{valueFt.toFixed(2)} ft</div>
           <div className="liq-pill">
             <span className="liq-dot" style={{ background: color }} />
             <span className="liq-pill-text" style={{ color }}>{status}</span>
            </div>
             <div className="liq-sub">Water Level</div>
              </div>
             </div>
             <div className="wl-legend" style={{ marginTop: 12 }}>
              <span className="wl-pill wl-low">1 ft (Low)</span>
        <span className="wl-pill wl-med">2 ft (Medium)</span>
        <span className="wl-pill wl-high">3 ft (High)</span>
      </div>
    </div>
  );
}



export default function FloodTracker() {
  const notify = useDesktopNotification();
  const navigate = useNavigate();
  const location = useLocation();
  const [view, setView] = useState("live");

  const sidebarLinks = [
    {
      label: "Dashboard",
      route: "/dashboard",
      svg: (
        <svg className="appr-sidebar-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8v-10h-8v10zm0-18v6h8V3h-8z" />
        </svg>
      ),
    },
    {
      label: "Community Announcements",
      route: "/announcements",
      svg: (
        <svg className="appr-sidebar-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2 9h4l10-5v14l-10-5H2V9zm1 1v4h3v-4H3zm14-2.618L7.8 10H5v2h2.8L18 12.618V7.382z" />
        </svg>
      ),
    },
    {
      label: "Flood Tracker",
      route: "/flood-tracker",
      svg: (
        <svg className="appr-sidebar-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2 14c4-4 8 4 12 0 4-4 8 4 8 4v4H2v-4z" />
          <path d="M2 9c4-4 8 4 12 0 4-4 8 4 8 4v1H2V9z" />
        </svg>
      ),
    },
    {
      label: "Incident Report",
      route: "/incidentreport",
      svg: (
        <svg className="appr-sidebar-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 2h9l5 5v15H6V2zM15 3.5V8h4.5L15 3.5z" />
        </svg>
      ),
    },
    {
      label: "Visitor Management",
      route: "/visitorManagement",
      svg: (
        <svg className="appr-sidebar-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 1.2c-3.6 0-10.8 1.8-10.8 5.4V22h21.6v-3.6c0-3.6-7.2-5.4-10.8-5.4z" />
        </svg>
      ),
    },
    {
      label: "Approval Accounts",
      route: "/approve-accounts",
      svg: (
        <svg className="appr-sidebar-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 1.2c-3.6 0-10.8 1.8-10.8 5.4V22h21.6v-3.6c0-3.6-7.2-5.4-10.8-5.4z" />
        </svg>
      ),
    },
  ];

  const [alerts, setAlerts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);

  const [newAlert, setNewAlert] = useState({
    location: "",
    severity: "",
    description: "",
    contact: "",
    timestamp: "",
    lat: "",
    lng: "",
  });

  const [sensor, setSensor] = useState(null);
  const role = localStorage.getItem("role") || "";
  const canReport = role === "security" || role === "official";
  const token = localStorage.getItem("token");
  // history for the chart (time-series)
  const [series, setSeries] = useState([]); 
  const [labels, setLabels] = useState([]); 
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
  const MAX_POINTS = 60;
  const socketRef = useRef(null);
  const lastTsRef = useRef(0); 
  
  

  const [floodSensors, setFloodSensors] = useState([]);
  const [waterLevels, setWaterLevels] = useState([]);
  const [timestamps, setTimestamps] = useState([]);

const pushPoint = (value, ts = Date.now()) => {
  const t = typeof ts === "string" ? Date.parse(ts) : (Number(ts) || Date.now());
  const rounded = Math.floor(t / 1000);
  if (rounded === lastTsRef.current) return; 

  lastTsRef.current = rounded;


  setSeries((prev) => {
    const next = [...prev, Number(value || 0)];
    return next.length > MAX_POINTS ? next.slice(next.length - MAX_POINTS) : next;
  });

  setLabels((prev) => {
    const next = [
      ...prev,
      new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    ];
    return next.length > MAX_POINTS ? next.slice(next.length - MAX_POINTS) : next;
  });

  console.log("Pushed new data point:", value); 
};


useEffect(() => {
  (async () => {
    try {
      // 1) get any sensor (first one)
      const sRes = await axios.get(`${API_URL}/api/flood/sensors`, { headers: getAuthHeaders() });
      const first = Array.isArray(sRes.data) && sRes.data.length ? sRes.data[0] : null;
      if (!first) return; // no sensor configured yet
      setSensor(first);

      // 2) preload last 60 readings so the chart shows immediately
      const rRes = await axios.get(
        `${API_URL}/api/flood/readings?sensorId=${first._id}&limit=60`,
        { headers: getAuthHeaders() }
      );
      const items = (rRes.data?.items || []).slice().reverse(); // oldest → newest

      setSeries(items.map(r => Number(r.waterLevel || 0)));
      setLabels(items.map(r =>
        new Date(r.recordedAt || r.createdAt || Date.now())
          .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      ));

      if (items.length) {
        const last = items[items.length - 1];
        const t = new Date(last.recordedAt || Date.now()).getTime();
        lastTsRef.current = Math.floor(t / 1000);
      }
    } catch (e) {
      console.error('Init sensor/history failed:', e);
    }
  })();
}, []); // run once

useEffect(() => {
  if (!sensor?._id) return;

  const saveReading = async () => {
    try {
      await axios.post(`${API_URL}/api/flood/save-reading`, 
        { sensorId: sensor._id }, 
        { headers: getAuthHeaders() }
      );
      console.log("✅ Flood reading saved");
    } catch (err) {
      console.error("❌ Save reading failed:", err);
    }
  };

  // call once immediately
  saveReading();

  // repeat every 15 mins
  const interval = setInterval(saveReading, 15 * 60 * 1000);

  return () => clearInterval(interval);
}, [sensor?._id]);





useEffect(() => {
  if (!sensor?._id) return; 
  if (socketRef.current) {
    try {
      socketRef.current.close();
    } catch {}
  }

 const socket = io(API_URL, {
  path: "/socket.io/",
  transports: ["polling", "websocket"],
  withCredentials: true,
});


  socketRef.current = socket;

  socket.on("connect", () => {
    console.log("WebSocket connected");  
  });

socket.on("sensor_data_updated", (payload) => {
  console.log("Sensor Data Updated: ", payload);  
  setSensor((prev) => ({ ...(prev || {}), ...payload }));
  pushPoint(Number(payload.waterLevel ?? 0), payload.lastUpdated || Date.now());  
});

socket.on("flood_reading_created", (payload) => {
  pushPoint(Number(payload.waterLevel ?? 0), payload.recordedAt || payload.createdAt || Date.now());
});


  socket.on("disconnect", () => {
    console.log("WebSocket disconnected");
  });

  
  return () => {
    try {
      socket.close();
    } catch {}
    socketRef.current = null;
  };
}, [sensor?._id]);

// Poll every 15 minutes (900000 ms)
useEffect(() => {
  if (!sensor?._id) return;

  const fetchLatest = async () => {
    try {
      const rRes = await axios.get(
        `${API_URL}/api/flood/readings?sensorId=${sensor._id}&limit=1&sort=desc`,
        { headers: getAuthHeaders() }
      );
      const item = Array.isArray(rRes.data) ? rRes.data[0] : rRes.data?.items?.[0];
      if (item) {
        pushPoint(Number(item.waterLevel || 0), item.recordedAt || item.createdAt || Date.now());
        setSensor((prev) => ({ ...(prev || {}), ...item }));
      }
    } catch (e) {
      console.error("❌ Polling failed:", e);
    }
  };

  // run immediately once
  fetchLatest();

  // run every 15 min
  const interval = setInterval(fetchLatest, 15 * 60 * 1000);

  return () => clearInterval(interval);
}, [sensor?._id]);

  // Submit flood report
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    const latNum = parseFloat(newAlert.lat);
    const lngNum = parseFloat(newAlert.lng);
    if (isNaN(latNum) || isNaN(lngNum)) return alert("Latitude and Longitude must be valid numbers.");

    try {
      const payload = { severity: newAlert.severity, location: newAlert.location, description: newAlert.description, contact: newAlert.contact,  coordinates: { lat: latNum, lng: lngNum },};
      await axios.post(`${API_URL}/api/flood/reports`, payload, { headers: getAuthHeaders() }
);

      setShowModal(false);
      setNewAlert({ location: "", severity: "", description: "", contact: "", timestamp: "", lat: "", lng: "" });

      const res = await axios.get(`${API_URL}/api/flood/reports`, { headers: getAuthHeaders() }
)
;
      setAlerts(res.data);
    } catch (err) {
      console.error("❌ Failed to submit flood report:", err);
      alert("❌ Failed to submit flood report. Please make sure you are logged in.");
    }
  };

  const getSeverityColor = (severity) => {
    const v = String(severity || '').toUpperCase();
    if (v === "HIGH") return "red";
    if (v === "MEDIUM") return "orange";
    return "blue";
  };

const waterLevelFt = (Number(sensor?.waterLevel) || 0) / 30.48;
let floodLevel = "NONE";
if (waterLevelFt >= HIGH_FT - EPS) floodLevel = "HIGH";
else if (waterLevelFt >= MED_FT - EPS) floodLevel = "MEDIUM";
else if (waterLevelFt >= LOW_FT  - EPS) floodLevel = "LOW";



const THRESH = {
  low: LOW_FT * 30.48,
  medium: MED_FT * 30.48,
  high: HIGH_FT * 30.48,
};

const levelColor = (value) => {
  if (value >= THRESH.high) return "red";    
  if (value >= THRESH.medium) return "orange";  
  if (value >= THRESH.low) return "blue";   
  return "green";  
};


const chartData = {
  labels,
  datasets: [
    {
      label: "Water Level (cm)",
      data: series.length ? series : [0],
      borderWidth: 3,
      tension: 0.3,
      pointRadius: 0,
      fill: false,
      segment: {
        borderColor: (ctx) => {
          const y = ctx.p0.parsed.y;
          if (y >= THRESH.high) return "red";
          if (y >= THRESH.medium) return "orange";
          if (y >= THRESH.low) return "blue";
          return "green";
        },
      },
    },
  ],
};

const chartOptions = {
  responsive: true,
  animation: false,
  scales: {
    y: {
      beginAtZero: true,
      ticks: { stepSize: 10 },
      title: { display: true, text: "Water Level (cm)" },
    },
    x: { title: { display: true, text: "Time" } },
  },
  plugins: { legend: { display: false } },
};

  return (
    <div className="appr-container">
    
      <aside
        className="appr-sidebar"
        style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/assets/sidebar.png)` }}
      >
        <nav className="appr-sidebar-nav">
          {sidebarLinks.map((link) => (
            <div
              key={link.label}
              className={`appr-sidebar-link ${location.pathname === link.route ? "appr-active" : ""}`}
              onClick={() => navigate(link.route)}
            >
              {link.svg}
              <span>{link.label}</span>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main */}
     <main className="appr-main">
  <header className="appr-header">
    <h1>Flood Tracker</h1>
  </header>

  {/* View toggle */}
  <div className="flex gap-2 mb-3">
    <button
      className="btn-submit"
      onClick={() => setView("live")}
      disabled={view === "live"}
    >
      Live
    </button>
    <button
      className="btn-cancel"
      onClick={() => setView("records")}
      disabled={view === "records"}
    >
      Records
    </button>
     <button className="btn-cancel" onClick={() => setView("analysis")} disabled={view === "analysis"}>Analysis</button>


     <button
     className="btn-cancel"
     onClick={() => setView("reports")}
     disabled={view === "reports"}>
      Reports
     </button>
  </div>


  {view === "live" ? (
  <>
    {/* Map Card */}
    <section className="appr-card" style={{ padding: 16 }}>
      <h2 className="text-lg font-bold text-gray-700 mb-2">Flood Map</h2>
      <div
        className="rounded-2xl overflow-hidden border border-green-100 bg-white"
        style={{ height: 340 }}
      >
        <MapContainer
          center={[14.4875, 121.0075]}
          zoom={17}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          {canReport && (
            <LocationMarker
              setNewAlert={setNewAlert}
              setShowModal={setShowModal}
              sensor={sensor}
            />
          )}

          {alerts.map((alert, i) => {
            const iconColor = getSeverityColor(alert.severity);
            const customIcon = new L.Icon({
              iconUrl: `https://maps.google.com/mapfiles/ms/icons/${iconColor}-dot.png`,
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowUrl: markerShadow,
              shadowSize: [41, 41],
            });

            const lat = Number(alert?.coordinates?.lat);
            const lng = Number(alert?.coordinates?.lng);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
            return (
              <Marker
                key={i}
                position={[lat, lng]}
                icon={customIcon}
              >
                <Popup>
                  <strong>{alert.location}</strong>
                  <br />
                  {alert.description}
                  <br />
                  <span
                    style={{
                      color: getSeverityColor(alert.severity),
                      fontWeight: "bold",
                    }}
                  >
                    Severity: {alert.severity}
                  </span>
                  <br />
                  {formatTimestamp(alert.createdAt)}
                </Popup>
              </Marker>
            );
          })}

          <Polyline
            positions={geojsonLineString}
            pathOptions={{ color: "blue", weight: 4, dashArray: "6 8" }}
          />
          {sensor && (
            <Marker position={geojsonPoints[0]}>
              <Popup>
                <strong>{sensor.name}</strong>
                <br />
                {sensor.address}
                <br />
                Water Level: {sensor.waterLevel} cm / {waterLevelFt.toFixed(2)} ft
                <br />
                Flood Level: {floodLevel}
              </Popup>
            </Marker>
          )}
          {geojsonPoints.slice(1).map((pos, idx) => (
            <Marker key={idx + 1} position={pos} />
          ))}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-2 text-sm">
        <div className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-green-600" /> Sensor
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-blue-600" /> Low
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-orange-400" /> Medium
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-red-600" /> High
        </div>
      </div>
    </section>

    {/* Real-Time Water Level (chart + gauge side-by-side) */}
<section className="appr-card" style={{ padding: 16, marginTop: 16 }}>
  <h3 className="font-semibold text-gray-700 mb-2">Real-Time Water Level</h3>

  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
    {/* Left: Line chart */}
    <div className="lg:col-span-8">
      <div className="chart-box rounded-2xl overflow-hidden border border-green-100 bg-white">
        {!sensor ? (
          <div className="p-4 text-gray-500">No sensor configured yet.</div>
        ) : (
          <Line key={labels.length} data={chartData} options={chartOptions} />
        )}
      </div>
    </div>

   {/* Right: Gauge */}
   <div className="lg:col-span-4">
  <div className="gauge-wrap rounded-2xl border border-green-100 bg-white">
    <LiquidWaterGauge
  valueCm={sensor?.waterLevel || 0}
  lowFt={LOW_FT}
  medFt={MED_FT}
  highFt={HIGH_FT}
  size={240}
/>

  </div>
</div>

  </div>
</section>



   

    {/* Sensor Data Card */}
    <section className="appr-card" style={{ padding: 16, marginTop: 16 }}>
      <h3 className="font-semibold text-gray-700 mb-2">Sensor Real-Time Data</h3>
      <div
        className="sensor-card"
        style={{ boxShadow: "none", border: "none", padding: 0 }}
      >
        {sensor ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <span>
              <strong>Location:</strong> {sensor.address}
            </span>
            <span>
              <strong>Water Level:</strong> {sensor.waterLevel} cm /{" "}
              {waterLevelFt.toFixed(2)} ft
            </span>
            <span>
              <strong>Battery:</strong> {sensor.batteryLevel}%
            </span>
            <span>
              <strong>Signal:</strong> {sensor.signalStrength}
            </span>
            <span>
              <strong>Status:</strong> {sensor.status}
            </span>
            <span>
              <strong>Last Updated:</strong>{" "}
              {sensor.lastUpdated ? formatTimestamp(sensor.lastUpdated) : "N/A"}
            </span>
            <span>
              <strong>Flood Level:</strong>{" "}
              <span
                style={{
                  color:
                    floodLevel === "HIGH"
                      ? "red"
                      : floodLevel === "MEDIUM"
                      ? "orange"
                      : floodLevel === "LOW"
                      ? "blue"
                      : "gray",
                  fontWeight: "bold",
                }}
              >
                {floodLevel}
              </span>
            </span>
          </div>
        ) : (
          <span className="text-gray-500">No sensor data available.</span>
        )}
      </div>
    </section>
  </>
) : view === "records" ? (
  <FloodReadingsTable sensorId={sensor?._id} />

)  : view === "analysis" ? (
  <FloodAnalysisGraph sensorId={sensor?._id} />
): (
  <FloodReportsTable />
)}

</main>


    </div>
  );
}
