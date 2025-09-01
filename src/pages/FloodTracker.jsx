// src/components/FloodTracker.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useDesktopNotification from "../hooks/useDesktopNotification";
import FloodReadingsTable from "./FloodReadingsTable";
import axios from "axios";

// Leaflet
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Circle,
  CircleMarker,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import "../css/FloodTracker.css";

// Chart
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

// ─────────────────────────────────────────────────────────────
// Village route (same lat,lng order as your mobile)
// ─────────────────────────────────────────────────────────────
const VILLAGE_LINE = [
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

// Fixed pins (always drawn, like on mobile)
const FIXED_PINS = [
  { name: "Sensor A", lat: 14.494429267672885, lng: 121.00303692152471 },
  { name: "Sensor B", lat: 14.478537582457562, lng: 121.00265712320015 },
  { name: "Sensor C", lat: 14.491841264691814, lng: 121.00829594057382 },
];

// ─── Helpers ─────────────────────────────────────────
function formatTimestamp(isoString) {
  if (!isoString) return "-";
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

// attach token, consistently
const authHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Click-to-report
function LocationMarker({ setNewAlert, setShowModal, sensor }) {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => map.invalidateSize(true), 150);
  }, [map]);

  useMap().on("click", async (e) => {
    const { lat, lng } = e.latlng;
    const now = new Date();
    const tzISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString();
    const locationName = await reverseGeocode(lat, lng);

    let severity = "";
    if (sensor && sensor.waterLevel != null) {
      const ft = Number(sensor.waterLevel) / 30.48;
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
  });
  return null;
}

// Fit map to everything we render
function FitToData({ village, pins, hotspots, alerts }) {
  const map = useMap();
  useEffect(() => {
    const bounds = [];
    if (village?.length) bounds.push(L.polyline(village).getBounds());
    (pins || []).forEach((p) => bounds.push(L.latLngBounds([[p.lat, p.lng], [p.lat, p.lng]])));
    (hotspots || []).forEach((h) => bounds.push(L.circle([h.lat, h.lng], { radius: 140 }).getBounds()));
    (alerts || []).forEach((a) => {
      const lat = Number(a.lat), lng = Number(a.lng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        bounds.push(L.latLngBounds([[lat, lng], [lat, lng]]));
      }
    });

    if (!bounds.length) return;
    try {
      const group = bounds.reduce((acc, b) => (acc ? acc.extend(b) : b), null);
      map.fitBounds(group, { padding: [16, 16], maxZoom: 18 });
      setTimeout(() => map.invalidateSize(true), 50);
    } catch {}
  }, [map, village, pins, hotspots, alerts]);
  return null;
}

export default function FloodTracker() {
  const notify = useDesktopNotification();
  const navigate = useNavigate();
  const location = useLocation();
  const [view, setView] = useState("live");

  // Guard: must be logged in (token present), else kick to login
  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) navigate("/login");
  }, [navigate]);

  // sidebar
  const sidebarLinks = [
    { label: "Dashboard", route: "/dashboard",
      svg: (<svg className="appr-sidebar-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8v-10h-8v10zm0-18v6h8V3h-8z"/></svg>) },
    { label: "Community Announcements", route: "/announcements",
      svg: (<svg className="appr-sidebar-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M2 9h4l10-5v14l-10-5H2V9zm1 1v4h3v-4H3zm14-2.618L7.8 10H5v2h2.8L18 12.618V7.382z"/></svg>) },
    { label: "Flood Tracker", route: "/flood-tracker",
      svg: (<svg className="appr-sidebar-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M2 14c4-4 8 4 12 0 4-4 8 4 8 4v4H2v-4z"/><path d="M2 9c4-4 8 4 12 0 4-4 8 4 8 4v1H2V9z"/></svg>) },
    { label: "Incident Report", route: "/incidentreport",
      svg: (<svg className="appr-sidebar-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6 2h9l5 5v15H6V2zM15 3.5V8h4.5L15 3.5z"/></svg>) },
    { label: "Visitor Management", route: "/visitorManagement",
      svg: (<svg className="appr-sidebar-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 1.2c-3.6 0-10.8 1.8-10.8 5.4V22h21.6v-3.6c0-3.6-7.2-5.4-10.8-5.4z"/></svg>) },
    { label: "Approval Accounts", route: "/approve-accounts",
      svg: (<svg className="appr-sidebar-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 1.2c-3.6 0-10.8 1.8-10.8 5.4V22h21.6v-3.6c0-3.6-7.2-5.4-10.8-5.4z"/></svg>) },
  ];

  const [alerts, setAlerts] = useState([]);
  const [showModal, setShowModal] = useState(false);

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
  const [sensors, setSensors] = useState([]);      // all sensors for map pins
  const [hotspots, setHotspots] = useState([]);    // red/orange map areas

  const role = localStorage.getItem("role") || "";
  const canReport = role === "security" || role === "official";

  // Chart state
  const [series, setSeries] = useState([]);
  const [labels, setLabels] = useState([]);

  // ── Fetch sensors + alerts + hotspots
  useEffect(() => {
    const load = async () => {
      try {
        const [sRes, aRes, hRes] = await Promise.all([
          axios.get(`${API_URL}/api/flood/sensors`,   { headers: authHeaders() }),
          axios.get(`${API_URL}/api/flood/reports`,   { headers: authHeaders() }),
          axios.get(`${API_URL}/api/flood/hotspots`,  { headers: authHeaders() }),
        ]);
        const sensorList = Array.isArray(sRes.data) ? sRes.data : [];
        setSensors(sensorList);
        setSensor(sensorList.length ? sensorList[0] : null);
        setAlerts(Array.isArray(aRes.data) ? aRes.data : []);
        setHotspots(hRes.data?.hotspots || []);
      } catch (e) {
        console.error("Init load error:", e?.response?.data || e.message);
      }
    };
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  // readings for selected sensor
  useEffect(() => {
    if (!sensor?._id) return;
    let stop = false;
    const tick = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/flood/readings`, {
          params: { sensorId: sensor._id, page: 1, limit: 60 },
          headers: authHeaders(),
        });
        if (stop) return;
        const items = (res.data.items || []).slice().reverse();
        setSeries(items.map((r) => Number(r.waterLevel || 0)));
        setLabels(
          items.map((r) =>
            new Date(r.recordedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          )
        );
      } catch (e) {
        console.error("readings load error:", e?.response?.data || e.message);
      }
    };
    tick();
    const id = setInterval(tick, 5000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [sensor?._id]);

  // Submit flood report (SEND coordinates object, not top-level lat/lng)
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    const latNum = parseFloat(newAlert.lat);
    const lngNum = parseFloat(newAlert.lng);
    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
      return alert("Latitude and Longitude must be valid numbers.");
    }
    try {
      const payload = {
        severity: newAlert.severity,
        location: newAlert.location,
        description: newAlert.description,
        contact: newAlert.contact,
        coordinates: { lat: latNum, lng: lngNum },
      };
      await axios.post(`${API_URL}/api/flood/reports`, payload, { headers: authHeaders() });

      setShowModal(false);
      setNewAlert({ location: "", severity: "", description: "", contact: "", timestamp: "", lat: "", lng: "" });

      const res = await axios.get(`${API_URL}/api/flood/reports`, { headers: authHeaders() });
      setAlerts(res.data);
    } catch (err) {
      console.error("❌ Failed to submit flood report:", err?.response?.data || err.message);
      alert("❌ Failed to submit flood report. Please make sure you are logged in.");
    }
  };

  const getSeverityColor = (sev) => {
    const s = String(sev || "").toLowerCase();
    if (s === "high") return "red";
    if (s === "medium") return "orange";
    if (s === "low") return "blue";
    return "blue";
  };

  // Sensor level summary
  const waterLevelFt = sensor?.waterLevel ? sensor.waterLevel / 30.48 : 0;
  let floodLevel = "NONE";
  if (waterLevelFt >= 2.9) floodLevel = "HIGH";
  else if (waterLevelFt >= 2.0) floodLevel = "MEDIUM";
  else if (waterLevelFt >= 1.0) floodLevel = "LOW";

  // Chart config
  const THRESH = { low: 30, medium: 60, high: 90 };
  const levelColor = (y) => {
    if (y >= THRESH.high) return "red";
    if (y >= THRESH.medium) return "orange";
    if (y >= THRESH.low) return "blue";
    return "green";
  };

  const chartData = useMemo(() => ({
    labels,
    datasets: [
      {
        label: "Water Level (cm)",
        data: series,
        borderWidth: 3,
        tension: 0.3,
        pointRadius: 0,
        fill: false,
        segment: {
          borderColor: (ctx) => {
            const y = ctx.p1?.parsed?.y ?? 0;
            return levelColor(y);
          },
        },
      },
    ],
  }), [labels, series]);

  const chartOptions = {
    responsive: true,
    animation: false,
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 10 }, title: { display: true, text: "Water Level (cm)" } },
      x: { title: { display: true, text: "Time" } },
    },
  };

  // build leaflet icons for alerts
  const alertIconCache = useMemo(() => ({}), []);
  const getAlertIcon = (sev) => {
    const color = getSeverityColor(sev);
    if (alertIconCache[color]) return alertIconCache[color];
    const icon = new L.Icon({
      iconUrl: `https://maps.google.com/mapfiles/ms/icons/${color}-dot.png`,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowUrl: markerShadow,
      shadowSize: [41, 41],
    });
    alertIconCache[color] = icon;
    return icon;
  };

  // Derive live map points from sensors (colored by severity)
  const liveSensorPoints = useMemo(() => {
    return (sensors || [])
      .map((s) => {
        const wl = Number(s.waterLevel ?? 0);
        let lat = s.coordinates?.lat != null ? Number(s.coordinates.lat) : NaN;
        let lng = s.coordinates?.lng != null ? Number(s.coordinates.lng) : NaN;
        if (Number.isFinite(lat) && Number.isFinite(lng) && lat > 100 && lng < 100) {
          const tmp = lat; lat = lng; lng = tmp;
        }
        const ft = wl / 30.48;
        const level = ft >= 3 ? "High" : ft >= 2 ? "Medium" : "Low";
        const color = level === "High" ? "#dc3545" : level === "Medium" ? "#3A5BA0" : "#28a745";
        return { name: s.name || "Sensor", lat, lng, wl, level, color, updated: s.lastUpdated || null };
      })
      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  }, [sensors]);

  return (
    <div className="appr-container">
      {/* Sidebar */}
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
          <button className="btn-submit" onClick={() => setView("live")} disabled={view === "live"}>
            Live
          </button>
          <button className="btn-cancel" onClick={() => setView("records")} disabled={view === "records"}>
            Records
          </button>
        </div>

        {view === "live" ? (
          <>
            {/* Map Card */}
            <section className="appr-card" style={{ padding: 16 }}>
              <h2 className="text-lg font-bold text-gray-700 mb-2">Flood Map</h2>
              <div className="rounded-2xl overflow-hidden border border-green-100 bg-white" style={{ height: 360 }}>
                <MapContainer
                  center={[14.4875, 121.0075]}
                  zoom={16}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
                  />

                  {/* click-to-report (security/official only) */}
                  {canReport && (
                    <LocationMarker
                      setNewAlert={setNewAlert}
                      setShowModal={setShowModal}
                      sensor={sensor}
                    />
                  )}

                  {/* Village line */}
                  <Polyline positions={VILLAGE_LINE} pathOptions={{ color: "#3A5BA0", weight: 4, dashArray: "6 8" }} />

                  {/* Fixed 3 pins (always visible) */}
                  {FIXED_PINS.map((p, idx) => (
                    <CircleMarker
                      key={`fixed-${idx}`}
                      center={[p.lat, p.lng]}
                      radius={9}
                      pathOptions={{ color: "#086a1a", weight: 3, fillColor: "#28a745", fillOpacity: 0.85 }}
                    >
                      <Popup><strong>{p.name}</strong></Popup>
                    </CircleMarker>
                  ))}

                  {/* Live sensor pins + red ring for High */}
                  {liveSensorPoints.map((p, idx) => (
                    <React.Fragment key={`live-${idx}`}>
                      <CircleMarker
                        center={[p.lat, p.lng]}
                        radius={11}
                        pathOptions={{ color: "#fff", weight: 2, fillColor: p.color, fillOpacity: 0.9 }}
                      >
                        <Popup>
                          <strong>{p.name}</strong><br />
                          {p.wl?.toFixed?.(2) ?? p.wl} cm •{" "}
                          <span style={{ color: p.color, fontWeight: "bold" }}>{p.level}</span><br />
                          <small>{formatTimestamp(p.updated)}</small>
                        </Popup>
                      </CircleMarker>
                      {p.level === "High" && (
                        <Circle center={[p.lat, p.lng]} radius={140} pathOptions={{ color: "#dc3545", fillColor: "#dc3545", fillOpacity: 0.25, weight: 2 }} />
                      )}
                    </React.Fragment>
                  ))}

                  {/* Alerts (user reports) — READ from coordinates; skip invalid */}
                  {alerts.map((alert, i) => {
                    const lat = Number(alert?.coordinates?.lat);
                    const lng = Number(alert?.coordinates?.lng);
                    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
                    return (
                      <Marker
                        key={`alert-${i}`}
                        position={[lat, lng]}
                        icon={getAlertIcon(alert.severity)}
                      >
                        <Popup>
                          <strong>{alert.location}</strong><br />
                          {alert.description}<br />
                          <span style={{ color: getSeverityColor(alert.severity), fontWeight: "bold" }}>
                            Severity: {alert.severity}
                          </span><br />
                          {formatTimestamp(alert.timestamp || alert.createdAt)}
                        </Popup>
                      </Marker>
                    );
                  })}

                  {/* Hotspots (orange/red) */}
                  {hotspots.map((h, i) => {
                    const lat = Number(h.coordinates?.lat);
                    const lng = Number(h.coordinates?.lng);
                    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
                    const color = h.level === "red" ? "red" : h.level === "orange" ? "orange" : null;
                    if (!color) return null;
                    return (
                      <Circle
                        key={`hs-${i}`}
                        center={[lat, lng]}
                        radius={140}
                        pathOptions={{ color, fillColor: color, fillOpacity: 0.28, weight: 2 }}
                      >
                        <Popup>
                          <strong>{h.label || "Area"}</strong><br />
                          {h.count || 0} reports (last window)
                        </Popup>
                      </Circle>
                    );
                  })}

                  {/* Auto-fit all layers */}
                  <FitToData
                    village={VILLAGE_LINE}
                    pins={FIXED_PINS}
                    hotspots={hotspots.map(h => ({ lat: Number(h.coordinates?.lat), lng: Number(h.coordinates?.lng) }))}
                    alerts={alerts.map(a => ({
                      lat: Number(a?.coordinates?.lat),
                      lng: Number(a?.coordinates?.lng)
                    }))}
                  />
                </MapContainer>
              </div>

              {/* Legend */}
              <div className="flex gap-4 mt-2 text-sm">
                <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-green-600" /> Fixed sensor pins</div>
                <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-[#28a745]" /> Low (live)</div>
                <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-[#3A5BA0]" /> Medium (live)</div>
                <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-red-600" /> High & red rings</div>
                <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-orange-400" /> ≥5 user reports</div>
                <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-red-600" /> ≥10 user reports</div>
              </div>
            </section>

            {/* Chart Card */}
            <section className="appr-card" style={{ padding: 16, marginTop: 16 }}>
              <h3 className="text-lg font-semibold text-green-700 mb-2">📈 Real-Time Water Level Chart</h3>
              <div style={{ height: 300 }}>
                <Line data={chartData} options={chartOptions} />
              </div>
            </section>

            {/* Sensor Data Card */}
            <section className="appr-card" style={{ padding: 16, marginTop: 16 }}>
              <h3 className="font-semibold text-gray-700 mb-2">Sensor Real-Time Data</h3>
              <div className="sensor-card" style={{ boxShadow: "none", border: "none", padding: 0 }}>
                {sensor ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <span><strong>Location:</strong> {sensor.address}</span>
                    <span><strong>Water Level:</strong> {sensor.waterLevel} cm / {waterLevelFt.toFixed(2)} ft</span>
                    <span><strong>Battery:</strong> {sensor.batteryLevel}%</span>
                    <span><strong>Signal:</strong> {sensor.signalStrength}</span>
                    <span><strong>Status:</strong> {sensor.status}</span>
                    <span><strong>Last Updated:</strong> {formatTimestamp(sensor.lastUpdated)}</span>
                    <span>
                      <strong>Flood Level:</strong>{" "}
                      <span
                        style={{
                          color:
                            floodLevel === "HIGH" ? "red" :
                            floodLevel === "MEDIUM" ? "orange" :
                            floodLevel === "LOW" ? "blue" : "gray",
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
        ) : (
          <FloodReadingsTable sensorId={sensor?._id} />
        )}
      </main>

      {/* Report Modal */}
      {showModal && (role === "security" || role === "official") && (
        <div className="modal-backdrop">
          <div className="modal-content flood-modal">
            <h2 className="modal-header text-green-700">Report Flood</h2>
            <form onSubmit={handleReportSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input type="text" value={newAlert.location} readOnly className="input-disabled" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Severity</label>
                <div className="input-disabled font-bold text-center" style={{ color: getSeverityColor(newAlert.severity) }}>
                  {newAlert.severity || "N/A"}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  placeholder="Describe the flood situation"
                  value={newAlert.description}
                  onChange={(e) => setNewAlert({ ...newAlert, description: e.target.value })}
                  required
                  className="textarea-input"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Latitude</label>
                  <input type="text" value={newAlert.lat} disabled className="input-disabled" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Longitude</label>
                  <input type="text" value={newAlert.lng} disabled className="input-disabled" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date & Time</label>
                <input type="datetime-local" value={newAlert.timestamp.slice(0, 16)} disabled className="input-disabled" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Contact Number</label>
                <input
                  type="text"
                  placeholder="Your contact number"
                  value={newAlert.contact}
                  onChange={(e) => setNewAlert({ ...newAlert, contact: e.target.value })}
                  required
                  className="text-input"
                />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-cancel">Cancel</button>
                <button type="submit" className="btn-submit">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
