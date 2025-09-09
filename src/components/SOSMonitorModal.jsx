// src/components/SOSMonitorModal.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";    

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
const blueMarker = L.icon({
  iconUrl:
    "https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-blue.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});


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

const severityBadge = (sev = "low") => {
  const s = String(sev || "").toLowerCase();
  const color = s === "high" ? "#dc2626" : s === "medium" ? "#d97706" : "#059669";
  return <span style={{ color, fontWeight: 700 }}>
    Severity: {s ? s[0].toUpperCase() + s.slice(1) : "Low"}
  </span>;
};

// client-only reverse geocode for display
async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=17&addressdetails=1`,
      { headers: { Accept: "application/json", "User-Agent": "CommuniSafe/1.0" } }
    );
    if (!res.ok) throw new Error();
    const j = await res.json();
    return j.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
  } catch {
    return `${Number(lat).toFixed(5)}, ${Number(lon).toFixed(5)}`;
  }
}

export default function SOSMonitorModal({ open, onClose, API_URL, token, notify }) {
  const [items, setItems] = useState([]);
  const [center, setCenter] = useState([14.4875, 121.0075]);
  const mapRef = useRef(null);
  const socketRef = useRef(null);
  const navigate = useNavigate();    

  const auth = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  // Fetch actives and enrich with displayLocation
  const loadSOS = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/sos/active`, auth);
      const list = Array.isArray(data) ? data : [];
      const enriched = await Promise.all(
        list.map(async (it) => {
          const displayLocation =
            Number(it.latitude) && Number(it.longitude)
              ? await reverseGeocode(it.latitude, it.longitude)
              : "Unknown location";
          return { ...it, displayLocation };
        })
      );
      setItems(enriched);
    } catch (e) {
      console.error("SOS fetch failed:", e);
      setItems([]);
    }
  };

  useEffect(() => {
    if (!open) return;
    socketRef.current = io(API_URL, { transports: ["websocket"], path: "/socket.io/" });
    const s = socketRef.current;

    const onNew = async (a) => {
      // backend emits: { id, name, latitude, longitude, timestamp, respondersCount }
      const displayLocation =
        Number(a?.latitude) && Number(a?.longitude)
          ? await reverseGeocode(a.latitude, a.longitude)
          : "Unknown location";
      const enriched = { ...a, displayLocation };
      setItems((prev) => [enriched, ...prev]);
      notify?.({
        title: "🚨 New SOS",
        body: `${enriched?.name || "Resident"} needs help`,
        icon: "/favicon.ico",
        url: "/incidentreport",
      });
      if (enriched?.latitude && enriched?.longitude) {
        const c = [enriched.latitude, enriched.longitude];
        setCenter(c);
        mapRef.current?.flyTo(c, 17);
      }
    };

    const onResolved = ({ id }) =>
      setItems((prev) => prev.filter((x) => String(x.id) !== String(id)));

    // RESPONDER event name from your backend:
    const onRespond = ({ id, status }) =>
      setItems((prev) =>
        prev.map((x) =>
          String(x.id) === String(id)
            ? { ...x, lastResponderStatus: status } // for UI if you want
            : x
        )
      );

    s.on("sos:new", onNew);
    s.on("sos:resolved", onResolved);
    s.on("sos:respond", onRespond);

    return () => {
      s.off("sos:new", onNew);
      s.off("sos:resolved", onResolved);
      s.off("sos:respond", onRespond);
      s.disconnect();
    };
  }, [open, API_URL, notify]);

  useEffect(() => {
    if (open) loadSOS();
  }, [open]); // eslint-disable-line

  const focus = (lat, lng) => {
    const c = [lat, lng];
    setCenter(c);
    mapRef.current?.flyTo(c, 17);
  };

  // ✅ Respond -> PUT /api/sos/:id/respond  { status: 'responding' }
  const handleRespond = async (item) => {
    try {
      await axios.put(
        `${API_URL}/api/sos/${item.id}/respond`,
        { status: "responding" },
        auth
      );
      setItems((prev) =>
        prev.map((x) => (String(x.id) === String(item.id) ? { ...x, lastResponderStatus: "responding" } : x))
      );
      notify?.({
        title: "🚑 Responding",
        body: `Marked as responding to ${item?.name || "SOS"}.`,
        icon: "/favicon.ico",
      });
    } catch (err) {
      console.error("Respond failed:", err?.response?.data || err.message);
      alert(
        `Failed to mark as responding.\n` +
          (err?.response?.data?.error ? `Server: ${err.response.data.error}` : "Check your token/CORS and route.")
      );
    }
  };

  // Optional: Resolve -> PUT /api/sos/:id/resolve  { code? }
  const handleResolve = async (item) => {
    try {
      await axios.put(`${API_URL}/api/sos/${item.id}/resolve`, {}, auth);
      setItems((prev) => prev.filter((x) => String(x.id) !== String(item.id)));
      notify?.({ title: "✅ Resolved", body: "SOS marked safe.", icon: "/favicon.ico" });
      onClose?.();
      navigate("/incidentarchive"); // ⬅️ go to Incident Archive
    } catch (err) {
      console.error("Resolve failed:", err?.response?.data || err.message);
      alert(`Failed to resolve SOS.`);
    }
  };

  if (!open) return null;

  const itemsDisplay = items.filter(
    (x) => Number.isFinite(Number(x.latitude)) && Number.isFinite(Number(x.longitude))
  );

  const StatusPill = ({ s }) => (
    <span
      className={`text-xs px-2 py-0.5 rounded-md ${
        s === "responding" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
      }`}
    >
      {s === "responding" ? "Responding" : "Pending"}
    </span>
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ width: "95vw", maxWidth: 1100, padding: 0, overflow: "hidden" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b bg-white">
          <h2 className="text-lg font-semibold text-red-600">🚨 SOS Monitor</h2>
          <button className="text-xl text-gray-500" onClick={onClose}>×</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3" style={{ minHeight: 520 }}>
          {/* LEFT: list */}
          <div className="border-r md:col-span-1 p-3 overflow-y-auto bg-white">
            {itemsDisplay.length === 0 ? (
              <div className="text-gray-500 text-sm">No active SOS.</div>
            ) : (
              itemsDisplay.map((it) => (
                <div
                  key={it.id}
                  className="w-full text-left p-3 mb-2 rounded-lg border hover:bg-red-50 transition"
                >
                  <div className="font-semibold text-gray-800">
                    {it.name || "Unknown"}
                  </div>

                  <div className="text-xs text-gray-600 mb-1">
                    {it.displayLocation || "Unknown location"}
                  </div>

                  <div className="text-xs mb-1">{severityBadge(it.severity)}</div>

                  <div className="text-xs text-gray-500 mb-2">
                    {new Date(it.timestamp || Date.now()).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </div>

                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1 rounded-md text-white"
                      style={{ background: "#16a34a" }}
                      onClick={() => {
                        if (it.latitude && it.longitude) focus(it.latitude, it.longitude);
                        handleRespond(it);
                      }}
                    >
                      Respond
                    </button>
                   
                    <button
                      className="px-3 py-1 rounded-md border"
                      onClick={() => handleResolve(it)}
                    >
                      Resolve
                    </button>
                  </div>
                </div>
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

              <Polyline positions={geojsonLineString} pathOptions={{ color: "blue", weight: 4, dashArray: "6 8" }} />
              {geojsonPoints.map((pos, idx) => (
  <Marker key={`g${idx}`} position={pos} icon={blueMarker}>
    <Popup>Checkpoint {idx + 1}</Popup>
  </Marker>
))}


              {itemsDisplay.map((x) => (
                <Marker key={x.id} position={[x.latitude, x.longitude]} icon={redMarker}>
                  <Popup>
                    <div style={{ minWidth: 200 }}>
                      <div style={{ fontWeight: 700 }}>{x.name || "Unknown"}</div>
                      <div className="text-xs" style={{ marginBottom: 4 }}>
                        {x.description || x.message || "SOS Request"}
                      </div>
                      <div className="text-xs" style={{ marginBottom: 4 }}>
                        {severityBadge(x.severity)}
                      </div>
                      <div className="text-xs" style={{ marginBottom: 6 }}>
                        <span className="font-semibold">Location:</span>{" "}
                        {x.displayLocation || "Unknown location"}
                      </div>
                      <div className="text-xs" style={{ color: "#6b7280", marginBottom: 8 }}>
                        {new Date(x.timestamp || Date.now()).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </div>

                      <div className="flex gap-6">
                        <button className="px-3 py-1 rounded-md text-white" style={{ background: "#16a34a" }} onClick={() => handleRespond(x)}>
                          Respond
                        </button>
                       
                        <button className="px-3 py-1 rounded-md border" onClick={() => handleResolve(x)}>
                          Resolve
                        </button>
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
