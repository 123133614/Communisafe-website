// src/components/SOSMonitorModal.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import { io } from "socket.io-client";

// ─── SAME RED MARKER ──────────────────────────────────────────────
const redMarker = L.icon({
  iconUrl:
    "https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// ─── MULTI BOUNDARY (gaya ng nasa FloodTracker mo) ───────────────
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

// ─── helper: point-in-polygon (ray casting) ──────────────────────
function insidePolygon(lat, lng, ring) {
  // ring: [[lat,lng], ...] (closed or open)
  let x = lng, y = lat;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][1], yi = ring[i][0];
    const xj = ring[j][1], yj = ring[j][0];
    const intersect =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi + 0.0) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

const severityBadge = (sev = "low") => {
  const s = String(sev || "").toLowerCase();
  const color =
    s === "high" ? "#dc2626" : s === "medium" ? "#d97706" : "#059669";
  return (
    <span style={{ color, fontWeight: 700 }}>
      Severity: {s ? s[0].toUpperCase() + s.slice(1) : "Low"}
    </span>
  );
};

export default function SOSMonitorModal({ open, onClose, API_URL, token, notify }) {
  const [items, setItems] = useState([]);
  const [center, setCenter] = useState([14.4875, 121.0075]); // loob ng Multi
  const mapRef = useRef(null);
  const socketRef = useRef(null);

  const auth = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  const loadSOS = async () => {
    try {
     
      const { data } = await axios.get(`${API_URL}/api/sos/active`, auth);
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("SOS fetch failed:", e);
    }
  };

  useEffect(() => {
    if (!open) return;
    socketRef.current = io(API_URL, { transports: ["websocket"], path: "/socket.io/" });
    const s = socketRef.current;

    const onNew = (a) => {
  

  setItems(prev => [a, ...prev]);
  notify?.({
    title: "🚨 New SOS",
    body: `${a?.name || "Resident"} needs help`,
    icon: "/favicon.ico",
    url: "/incidentreport",
  });
  if (a?.latitude && a?.longitude) {
    setCenter([a.latitude, a.longitude]);
    mapRef.current?.flyTo([a.latitude, a.longitude], 17);
  }
 };
    const onResolved = ({ id }) =>
      setItems((prev) => prev.filter((x) => String(x.id || x._id) !== String(id)));

    s.on("sos:new", onNew);
    s.on("sos:resolved", onResolved);

    return () => {
      s.off("sos:new", onNew);
      s.off("sos:resolved", onResolved);
      s.disconnect();
    };
  }, [open, API_URL, notify]);

  useEffect(() => {
    if (open) loadSOS();
  }, [open]); // eslint-disable-line

  const focus = (lat, lng) => {
    setCenter([lat, lng]);
    const map = mapRef.current;
    if (map && typeof map.flyTo === "function") map.flyTo([lat, lng], 17);
  };

  if (!open) return null;

  // filter markers to those INSIDE Multi polygon
  const itemsDisplay = items.filter(
   (x) => Number.isFinite(Number(x.latitude)) && Number.isFinite(Number(x.longitude))
 );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ width: "95vw", maxWidth: 1100, padding: 0, overflow: "hidden" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <h2 className="text-lg font-semibold text-red-600">🚨 SOS Monitor</h2>
          <button className="text-xl text-gray-500" onClick={onClose}>×</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3" style={{ minHeight: 520 }}>
          {/* LEFT: list */}
          <div className="border-r md:col-span-1 p-3 overflow-y-auto">
            {itemsDisplay.length === 0 ? (
              <div className="text-gray-500 text-sm">No active SOS inside Multi.</div>
            ) : (
              itemsDisplay.map((it) => (
                <button key={it.id || it._id}
                  className="w-full text-left p-3 mb-2 rounded-lg hover:bg-red-50 border"
                  onClick={() => it.latitude && it.longitude && focus(it.latitude, it.longitude)}
                >
                  <div className="font-semibold text-gray-800">{it.name || "Unknown"}</div>
                  <div className="text-xs text-gray-600 mb-1">
                    {(it.location && String(it.location)) || "Unknown location"}
                  </div>
                  <div className="text-xs">{severityBadge(it.severity)}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(it.createdAt || it.date || Date.now()).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* RIGHT: map */}
          <div className="md:col-span-2">
            <MapContainer
              center={center}
              zoom={16}
              style={{ height: "100%", minHeight: 520, width: "100%" }}
              whenCreated={(m) => (mapRef.current = m)}
              scrollWheelZoom
            >
              <TileLayer
                attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* 🔵 boundary line gaya ng FloodTracker */}
              <Polyline
                positions={geojsonLineString}
                pathOptions={{ color: "blue", weight: 4, dashArray: "6 8" }}
              />
              {geojsonPoints.map((pos, idx) => (
                <Marker key={`g${idx}`} position={pos} />
              ))}

              {/* 🔴 SOS markers (inside Multi lang) */}
              {itemsDisplay.map((x) => (
                <Marker key={x.id || x._id} position={[x.latitude, x.longitude]} icon={redMarker}>
                  <Popup>
                    <div style={{ minWidth: 180 }}>
                      <div style={{ fontWeight: 700 }}>{x.name || "Unknown"}</div>
                      <div className="text-xs" style={{ marginBottom: 4 }}>
                        {x.description || x.message || "SOS Request"}
                      </div>
                      <div className="text-xs" style={{ marginBottom: 4 }}>
                        {severityBadge(x.severity)}
                      </div>
                      <div className="text-xs" style={{ color: "#6b7280" }}>
                        {new Date(x.createdAt || x.date || Date.now()).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
