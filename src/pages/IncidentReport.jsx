// src/pages/IncidentReport.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import { FiFilter } from "react-icons/fi";
import useDesktopNotification from "../hooks/useDesktopNotification";
import {
  FaPhoneAlt,
  FaLightbulb,
  FaShieldAlt,
  FaHospitalAlt,
  FaFireExtinguisher,
} from "react-icons/fa";
import { MdLocalPolice } from "react-icons/md";

import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import { motion, AnimatePresence } from "framer-motion";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../css/IncidentReport.css";
import { io } from 'socket.io-client';
import SOSMonitorModal from '../components/SOSMonitorModal';
import { FaUserCircle } from "react-icons/fa";


const API_URL =
  process.env.REACT_APP_API_URL || "https://communisafe-backend.onrender.com";

  axios.defaults.baseURL = API_URL;

export const photoUrlFromKey = (key, expires = 600, map) => {
  const fallback = `${process.env.PUBLIC_URL}/assets/multiico.png`;
  if (!key) return fallback;

  // kung meron na tayong signed URL galing backend, gamitin iyon
  if (map && map[key]) return map[key];

  // legacy fallbacks
  const s = String(key).trim();
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('/uploads/')) return `${API_URL}${s}`;
  if (s.startsWith('uploads/')) return `${API_URL}/${s}`;
  return `${API_URL}/api/files/signed-url-redirect?key=${encodeURIComponent(s)}&expires=${expires}`;
};




const socket = io(API_URL, { transports: ['websocket'], path: '/socket.io/' });


// ─── Fix Leaflet marker icon paths ────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const HOTLINES = [
  { name: "Barangay Moonwalk", number: "0945-771-5035", icon: <FaShieldAlt className="text-green-600" /> },
  { name: "Parañaque PNP", number: "0998-598-7926", icon: <MdLocalPolice className="text-blue-600" /> },
  { name: "Ospital ng Parañaque", number: "8825-4902", icon: <FaHospitalAlt className="text-red-600" /> },
  { name: "Parañaque BFP", number: "8826-9131", icon: <FaFireExtinguisher className="text-orange-600" /> },
];

// ─── "View Map" Leaflet Modal ─────────────────────────────────────────────
function IncidentMapModal({ open, onClose, incident }) {
  const lat = incident?.latitude;
  const lng = incident?.longitude;
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if (open && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserLocation(null)
      );
    }
  }, [open]);

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

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            className="modal-content"
            style={{ width: "95vw", maxWidth: "32rem", padding: 0 }}
            initial={{ scale: 0.8, y: 100 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-green-700">Incident Location</h2>
              <button onClick={onClose} className="text-gray-500 text-xl hover:text-red-500">×</button>
            </div>
            <div style={{ height: "min(70vh, 420px)", width: "100%" }}>

              {(lat && lng) || userLocation ? (
                <MapContainer
                  center={lat && lng ? [lat, lng] : userLocation ? [userLocation.lat, userLocation.lng] : [14.5995, 120.9842]}
                  zoom={16}
                  style={{ height: "100%", width: "100%" }}
                  scrollWheelZoom
                  dragging
                  doubleClickZoom={false}
                  zoomControl
                >
                  <TileLayer
                    attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {lat && lng && (
                    <Marker position={[lat, lng]}>
                      <Popup>
                        <div>
                          <strong>{incident.type}</strong>
                          <br />
                          {incident.location}
                          <br />
                          {incident.description}
                        </div>
                      </Popup>
                    </Marker>
                  )}
                  {userLocation && (
                    <Marker
                      position={[userLocation.lat, userLocation.lng]}
                      icon={L.icon({
                        iconUrl:
                          "https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-blue.png",
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                        shadowUrl:
                          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
                        shadowSize: [41, 41],
                      })}
                    >
                      <Popup><strong>Your Location</strong></Popup>
                    </Marker>
                  )}
                  {lat && lng && userLocation && (
                    <Polyline positions={[[userLocation.lat, userLocation.lng], [lat, lng]]} color="blue" />
                  )}
                  <Polyline positions={geojsonLineString} pathOptions={{ color: "blue", weight: 4, dashArray: "6 8" }} />
                  {geojsonPoints.map((pos, idx) => <Marker key={`g${idx}`} position={pos} />)}
                </MapContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">No coordinates for this incident.</div>
              )}
            </div>
            <div className="px-6 py-4 border-t text-sm text-gray-600">
              <div><span className="font-semibold">Location:</span> {incident.location}</div>
              <div><span className="font-semibold">Date:</span> {incident.date}</div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Sidebar (same look/behavior as your Visitor/Approve pages) ───────────
function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

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
      label: "Incident Archive",
      route: "/incidentarchive",
      svg: (
        <svg className="appr-sidebar-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 4h16v2H4zm0 5h16v2H4zm0 5h10v2H4z" />
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

  return (
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
  );
}

// ─── Main Component ───────────────────────────────────────────────────────
export default function IncidentReport() {
  const { id } = useParams();
  const notify = useDesktopNotification();
  const [showSOSModal, setShowSOSModal] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [previewModal, setPreviewModal] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [mapModalIncident, setMapModalIncident] = useState(null);
  const [respondingId, setRespondingId] = useState(null);
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatModal, setChatModal] = useState({ open: false, incident: null });
  // add with your other useState hooks
// add with your other useState/useEffect
const [activeIdx, setActiveIdx] = useState(0);
const [imgLoaded, setImgLoaded] = useState(true);
// map of { key: presignedUrl }
const [signedUrlMap, setSignedUrlMap] = useState({});


useEffect(() => {
  if (previewModal?._id) {
    setActiveIdx(0);
    setImgLoaded(false);
  }
}, [previewModal?._id]);

const handleNextPhoto = (e) => {
  e?.stopPropagation?.();
  const arr = Array.isArray(previewModal?.photos) ? previewModal.photos : [];
  if (!arr.length) return;
  setImgLoaded(false);
  setActiveIdx((i) => (i + 1) % arr.length);
};

// keyboard: ArrowRight = next
useEffect(() => {
  if (!previewModal) return;
  const onKey = (e) => { if (e.key === 'ArrowRight') handleNextPhoto(); };
  document.addEventListener('keydown', onKey);
  return () => document.removeEventListener('keydown', onKey);
}, [previewModal, handleNextPhoto]);



  const [formData, setFormData] = useState({
    name: "",
    contactNumber: "",
    date: "",
    type: "",
    location: "",
    description: "",
    image: null,
    latitude: null,
    longitude: null,
  });

  const [incidents, setIncidents] = useState([]);

// 👇 replace your current useEffect(...) notification block with this one
useEffect(() => {
  // avoid duplicate toasts if same event fires multiple times
  const seen = new Set(); // keys like `${id}:${responderId}:${status}`

  const onNotif = (data) => {
    if (data?.type === 'incident' || data?.type === 'sos') {
      notify({
        title: data.title || (data.type === 'sos' ? '🚨 SOS Alert' : 'New Incident'),
        body:  data.body  || (data.type === 'sos'
          ? `${data.name || 'Resident'} needs help!`
          : 'You have a new incident report'),
        icon: '/favicon.ico',
        url:  '/incidentreport'
      });
    }
  };

  // from /api/notifications (your existing pipe)
  socket.on('newNotification', onNotif);

  // direct realtime SOS (backend emits these in sosController)
  socket.on('sos:new', (a) => {
    notify({
      title: '🚨 SOS Alert',
      body:  `${a?.name || 'Resident'} needs help`,
      icon:  '/favicon.ico',
      url:   '/incidentreport'
    });
  });

  socket.on('sos:respond', ({ id, responder, status }) => {
    const key = `${id}:${responder?.id || responder?._id}:${status}`;
    if (seen.has(key)) return;
    seen.add(key);

    // human text
    const who = responder?.name || 'An official';
    const txt = status === 'responding'
      ? `${who} is responding to an SOS`
      : `${who} viewed an SOS`;

    notify({
      title: status === 'responding' ? '🚓 Responder On The Way' : '👀 SOS Viewed',
      body:  txt,
      icon:  '/favicon.ico',
      url:   '/incidentreport'
    });
  });

  socket.on('sos:resolved', ({ id }) => {
    const key = `${id}:resolved`;
    if (!seen.has(key)) {
      seen.add(key);
      notify({
        title: '✅ SOS Resolved',
        body:  'An SOS has been marked as resolved.',
        icon:  '/favicon.ico',
        url:   '/incidentreport'
      });
    }
  });

  return () => {
    socket.off('newNotification', onNotif);
    socket.off('sos:new');
    socket.off('sos:respond');
    socket.off('sos:resolved');
  };
}, [notify]);


  // Populate initial formData and user info
  useEffect(() => {
    const name = localStorage.getItem("name");
    const contactNumber = localStorage.getItem("contactNumber");
    setFormData((prev) => ({
      ...prev,
      name: name || "",
      contactNumber: contactNumber || "",
      date: new Date().toISOString().slice(0, 10),
    }));

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setFormData((prev) => ({
            ...prev,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          })),
        () => {}
      );
    }
  }, []);

  // Fetch all incidents on mount
useEffect(() => {
  const token = localStorage.getItem("token");

  async function load() {
    try {
      const { data } = await axios.get(`${API_URL}/api/incidents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIncidents(data);

      // collect unique S3 keys
      const keys = [];
      for (const inc of data) {
        if (Array.isArray(inc.photos)) {
          for (const k of inc.photos) if (k && !keys.includes(k)) keys.push(k);
        }
      }

      if (keys.length) {
        // batch sign from backend
        const r = await axios.post(
          `${API_URL}/api/files/signed-urls`,
          { keys, expires: 600 },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const m = {};
        (r.data?.urls || []).forEach(({ key, url }) => (m[key] = url));
        setSignedUrlMap(m);
      }
    } catch (err) {
      console.error("Error fetching incidents or signing URLs:", err);
    }
  }

  load();
}, []);


  // If URL has an ID, fetch that single incident
  useEffect(() => {
    if (!id) {
      setIncident(null);
      setLoading(false);
      return;
    }
    const fetchIncident = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/api/incidents/${id}`);
        setIncident(res.data.incident);
      } catch {
        setIncident(null);
      }
      setLoading(false);
    };
    fetchIncident();
  }, [id]);

  // Handle file input change
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData((prev) => ({ ...prev, image: files }));
    setSelectedImage(files.map((file) => URL.createObjectURL(file)));
  };

  // Submit a new incident
  const handleAddIncident = async () => {
    if (
      !formData.name ||
      !formData.contactNumber ||
      !formData.date ||
      !formData.type ||
      !formData.location ||
      !formData.description ||
      !formData.image ||
      (Array.isArray(formData.image) && formData.image.length === 0)
    ) {
      alert("Please fill out all fields and attach at least one photo.");
      return;
    }

    let { latitude, longitude } = formData;
    if (!latitude || !longitude) {
      latitude = 14.594891;
      longitude = 120.978261;
    }

    try {
      const form = new FormData();
      Object.entries({ ...formData, latitude, longitude }).forEach(([key, value]) => {
        if (key !== "image" && value) form.append(key, value);
      });

      if (Array.isArray(formData.image)) {
        formData.image.forEach((file) => form.append("photos", file));
      } else if (formData.image) {
        form.append("photos", formData.image);
      }

      const token = localStorage.getItem("token");
      const response = await axios.post(`${API_URL}/api/incidents`, form, {
        headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` },
      });

      setIncidents((prev) => [response.data.incident, ...prev]);
      setFormData({
        name: "",
        contactNumber: "",
        date: new Date().toISOString().slice(0, 10),
        type: "",
        location: "",
        description: "",
        image: null,
        latitude: null,
        longitude: null,
      });
      setSelectedImage(null);
      setShowModal(false);

      notify({
        title: "New Incident Reported",
        body: `${response.data.incident.type} at ${response.data.incident.location}`,
        icon: "/favicon.ico",
        url: "/incidentreport",
      });

      if (window.Notification && Notification.permission === "granted") {
        new Notification("New Incident Reported", {
          body: `${response.data.incident.type} at ${response.data.incident.location}`,
          icon: "/favicon.ico",
        });
      } else if (window.Notification && Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification("New Incident Reported", {
              body: `${response.data.incident.type} at ${response.data.incident.location}`,
              icon: "/favicon.ico",
            });
          }
        });
      }
    } catch (err) {
      console.error("Error submitting incident:", err);
    }
  };

  // Mark as resolved (moves to archive on your backend)
  const handleMarkAsSolved = async (incidentId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_URL}/api/incidents/${incidentId}`,
        { status: "resolved" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIncidents((prev) => prev.filter((inc) => inc._id !== incidentId));
      alert("✅ Case marked as resolved and moved to Archive.");
    } catch (err) {
      console.error("❌ Failed to update status:", err);
    }
  };

  // Filters
  const filteredIncidents = incidents
    .filter(
      (incident) =>
        incident.status?.toLowerCase() !== "solved" &&
        incident.status?.toLowerCase() !== "resolved"
    )
    .filter((incident) =>
      `${incident.type} - ${incident.location}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const getStatusColors = (status) => {
    if (status === "Pending") return { borderColor: "border-yellow-400" };
    return { borderColor: "border-green-500" };
    // (statusColor not used in the markup; left minimal)
  };

  const handleCopy = (number) => {
    navigator.clipboard.writeText(number);
    alert("Hotline number copied!");
  };

  if (id) {
    if (loading) return <div className="flex justify-center items-center h-96">Loading...</div>;
    if (!incident) return <div className="text-center text-gray-500 mt-10">Incident not found.</div>;
  }



  return (
    <div className="appr-container">
      {/* Sidebar (green gradient w/ active white pill) */}
      <Sidebar />

      {/* Main */}
      <main className="appr-main">
        {/* Header */}
        <header className="appr-header">
          <h1>Incident Report</h1>
          <div className="appr-actions">
            <div className="appr-search">
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="search-icon-btn" aria-label="filter">
                <FiFilter size={18} />
              </button>
            </div>
            <button 
             className="ml-3 bg-red-600 text-white px-4 py-2 rounded-full hover:bg-red-700"
               onClick={() => setShowSOSModal(true)}>  🚨 SOS Monitor </button>

            
          </div>
        </header>

        {/* Report Incident Modal */}
        {showModal && (
          <div className="modal-backdrop">
            <div className="modal-content w-[95vw] max-w-[640px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
              <div className="flex justify-between items-center border-b pb-2 mb-4">
                <h2 className="text-lg font-semibold text-green-700">Report Issue</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-500 text-xl">×</button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="border rounded p-2"
                  required
                />
                <input
                  type="text"
                  placeholder="Contact"
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  className="border rounded p-2"
                  required
                />
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="border rounded p-2"
                  required
                />
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="border rounded p-2"
                  required
                >
                  <option value="">Select Incident Type</option>
                  <option value="Fire">Fire</option>
                  <option value="Medical">Medical</option>
                  <option value="Crime">Crime</option>
                  <option value="Flood">Flood</option>
                  <option value="Other">Other</option>
                </select>
                <input
                  type="text"
                  placeholder="Location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="border rounded p-2 col-span-2"
                  required
                />
                <input type="file" accept="image/*" multiple onChange={handleFileChange} className="col-span-2" />
                {selectedImage && (
                  <div className="flex gap-2 mt-2 col-span-2">
                    {selectedImage.map((img, idx) => (
                      <img key={idx} src={img} alt="preview" className="w-16 h-16 object-cover rounded" />
                    ))}
                  </div>
                )}
                <textarea
                  placeholder="Describe the Incident"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="border rounded p-2 col-span-2"
                  rows={4}
                  required
                />
              </div>

              <div className="text-center mt-6">
                <button onClick={handleAddIncident} className="bg-green-600 text-white px-6 py-2 rounded-full hover:bg-green-700">
                  Submit Report
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {previewModal && (
          <div
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-6"
            onClick={() => setPreviewModal(null)}
          >
            <div
  className="bg-white rounded-2xl shadow-2xl overflow-hidden w-[95vw] max-w-4xl max-h-[90vh] grid grid-cols-1 md:grid-cols-2"
  onClick={(e) => e.stopPropagation()}
  style={{ minHeight: 420 }}
>
  {/* LEFT: Image viewer */}
  <div className="relative bg-neutral-900 md:min-h-[420px] flex items-center justify-center">
    {/* skeleton shimmer while loading */}
    {!imgLoaded && (
      <div className="absolute inset-0 animate-pulse bg-neutral-800" />
    )}

    {/* fade image in/out */}
    <motion.img
      key={`${previewModal?._id}-${activeIdx}`}
      initial={{ opacity: 0.2, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      onLoad={() => setImgLoaded(true)}
      onError={(e) => {
        e.currentTarget.src = `${process.env.PUBLIC_URL}/assets/multiico.png`;
        setImgLoaded(true);
      }}
       src={photoUrlFromKey( Array.isArray(previewModal?.photos) && previewModal.photos.length 
        ? previewModal.photos[Math.min(activeIdx, previewModal.photos.length - 1)]
        : null,
        600,
        signedUrlMap
       )}
      alt="Incident"
      className="object-contain w-full h-full select-none cursor-pointer"
      title="Click image or press → to view next"
      onClick={handleNextPhoto}
    />

    {/* subtle gradient bottom bar */}
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />

    {/* Counter badge */}
    {Array.isArray(previewModal?.photos) && previewModal.photos.length > 1 && (
      <span className="absolute bottom-3 left-3 bg-black/70 text-white text-xs px-2 py-0.5 rounded-full">
        {activeIdx + 1}/{previewModal.photos.length}
      </span>
    )}

    {/* Single “Next ›” button */}
    {Array.isArray(previewModal?.photos) && previewModal.photos.length > 1 && (
      <button
        type="button"
        aria-label="Next photo"
        onClick={handleNextPhoto}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/70 text-white
                   w-11 h-11 rounded-full text-xl leading-[44px] text-center
                   hover:bg-black/80 focus:outline-none"
      >
        ›
      </button>
    )}
  </div>

  {/* RIGHT: Details */}
  <div className="p-5 sm:p-6 flex flex-col overflow-y-auto">
    <h2 className="text-2xl font-semibold text-emerald-700 mb-2">{previewModal.type}</h2>

    <dl className="text-sm text-gray-700 space-y-2 mb-4">
      <div className="flex">
        <dt className="w-24 shrink-0 text-gray-500">Location:</dt>
        <dd className="font-medium">{previewModal.location}</dd>
      </div>
      <div className="flex">
        <dt className="w-24 shrink-0 text-gray-500">Date:</dt>
        <dd className="font-medium">{previewModal.date}</dd>
      </div>
      <div>
        <dt className="text-gray-500 mb-1">Description:</dt>
        <dd className="bg-gray-50 rounded-md p-3 text-gray-800">
          {previewModal.description}
        </dd>
      </div>
    </dl>

    <div className="mt-auto flex flex-wrap gap-2 justify-end">
      <button
  className="bg-blue-600 text-white px-4 py-1.5 rounded-full hover:bg-blue-700"
  onClick={() => {
    // CLOSE preview first, then open Chat
    const inc = previewModal;           // keep reference
    setPreviewModal(null);              // <-- isara muna yung Preview Modal
    setChatModal({ open: true, incident: inc }); // tapos buksan yung Chat Modal
  }}
>
  Chat
</button>


      {previewModal.status?.toLowerCase() !== "solved" &&
        previewModal.status?.toLowerCase() !== "resolved" && (
          <>
            <button
              className={`bg-amber-500 text-white px-4 py-1.5 rounded-full hover:bg-amber-600 ${
                respondingId === previewModal._id || previewModal.status?.toLowerCase() === "responding"
                  ? "opacity-60 cursor-not-allowed"
                  : ""
              }`}
              disabled={respondingId === previewModal._id || previewModal.status?.toLowerCase() === "responding"}
              onClick={async () => {
                setRespondingId(previewModal._id);
                try {
                  const token = localStorage.getItem("token");
                  await axios.put(
                    `${API_URL}/api/incidents/${previewModal._id}/respond`,
                    { status: "responding" },
                    { headers: { Authorization: `Bearer ${token}` } }
                  );
                  setIncidents((prev) =>
                    prev.map((inc) => (inc._id === previewModal._id ? { ...inc, status: "responding" } : inc))
                  );
                  alert("You are now responding to this incident!");
                } catch {
                  alert("Failed to respond to incident.");
                } finally {
                  setRespondingId(null);
                }
              }}
            >
              Respond
            </button>

            <button
              className="bg-emerald-600 text-white px-4 py-1.5 rounded-full hover:bg-emerald-700"
              onClick={() => handleMarkAsSolved(previewModal._id)}
            >
              Mark as Solved
            </button>
          </>
        )}
    </div>
  </div>
</div>

          </div>
        )}

        {/* Map Modal */}
        <IncidentMapModal open={!!mapModalIncident} onClose={() => setMapModalIncident(null)} incident={mapModalIncident || {}} />

        {/* Cards */}
        <section className="incident-cards-wrapper">
          {filteredIncidents.map((inc, idx) => {
            const { borderColor } = getStatusColors(inc.status);
            const dateStr = new Date(inc.createdAt).toLocaleString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

           const photoUrl = photoUrlFromKey(inc?.photos?.[0], 600, signedUrlMap);



            return (
              <motion.div
                key={idx}
                onClick={() => setPreviewModal(inc)}
                className={`cursor-pointer bg-white rounded-xl shadow-lg ${borderColor} flex flex-col md:flex-row overflow-hidden hover:shadow-2xl transition-all`}
                whileHover={{ scale: 1.01 }}
                layout
                style={{ minHeight: 220 }}
              >
                <div className="md:w-1/3 w-full h-48 md:h-auto flex-shrink-0 bg-gray-100 flex items-center justify-center">
                  <img src={photoUrl} alt="Incident" onError={(e) => { e.currentTarget.src = `${process.env.PUBLIC_URL}/assets/multiico.png`; }}
                  className="object-cover w-full h-full"
                  style={{ minHeight: 180, maxHeight: 240 }}/>

                </div>
                <div className="flex-1 p-5 flex flex-col justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-1 text-green-700">
                      {inc.type} - {inc.location}
                    </h2>
                    <div className="flex flex-wrap gap-2 items-center text-sm text-gray-500 mt-2">
                      <span>{dateStr}</span>
                      <span
                        className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${
                          inc.status?.toLowerCase() === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : inc.status?.toLowerCase() === "solved"
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {inc.status ? inc.status.charAt(0).toUpperCase() + inc.status.slice(1) : "Unknown"}
                      </span>
                    </div>
                    <p className="mt-2 text-gray-700 line-clamp-2">{inc.description}</p>
                  </div>
                  <div className="flex gap-2 mt-4 justify-end">
                    <button
                      className="bg-blue-600 text-white px-4 py-1 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMapModalIncident(inc);
                      }}
                    >
                      View Map
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </section>
      </main>

      {/* Floating Hotline Button */}
      <div
        onClick={() => setShowEmergencyModal(true)}
        className="fixed bottom-6 right-6 z-50 bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-lg cursor-pointer"
      >
        <FaPhoneAlt className="text-xl" />
      </div>

      {/* Emergency Hotline Modal */}
      {showEmergencyModal && (
        <div className="modal-backdrop">
          <div
            className="modal-content"
            style={{ maxWidth: "28rem", padding: "1.5rem", maxHeight: "90vh", overflowY: "auto" }}
          >
            <button onClick={() => setShowEmergencyModal(false)} className="absolute top-3 right-4 text-gray-500 text-xl font-bold">
              ×
            </button>
            <h2 className="text-lg font-bold text-center mb-4">Emergency Hotline</h2>
            <div className="divide-y">
              {HOTLINES.map((hotline, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center py-3 cursor-pointer hover:bg-green-50 rounded"
                  onClick={() => handleCopy(hotline.number)}
                  title="I-click para kopyahin ang number"
                >
                  <span className="flex items-center gap-2 font-semibold text-green-700">
                    {hotline.icon} {hotline.name}
                  </span>
                  <span className="text-gray-700">{hotline.number}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t pt-3 text-sm text-gray-600">
              <div className="flex items-start gap-2 text-green-700 mb-1">
                <FaLightbulb className="mt-1" /> Kapag may baha, pumunta sa mataas na lugar at iwasan ang paglakad sa baha.
              </div>
              <div className="flex items-start gap-2 text-green-700 mb-1">
                <FaLightbulb className="mt-1" /> Kapag may sunog, huwag gumamit ng elevator at lumabas ng mahinahon.
              </div>
              <div className="flex items-start gap-2 text-green-700">
                <FaLightbulb className="mt-1" /> Laging ihanda ang mga emergency supplies (flashlight, first aid kit, atbp).
              </div>
            </div>
            
          </div>

          
        </div>
      )}
      <SOSMonitorModal open={showSOSModal}  onClose={() => setShowSOSModal(false)} API_URL={API_URL} token={localStorage.getItem("token")}  notify={notify}/>

      {/* Chat Modal */}
      {chatModal.open && (
        <div className="modal-backdrop" onClick={() => setChatModal({ open: false, incident: null })}>
          <div className="modal-content chat-pro" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} >
             <ChatBox
              incident={chatModal.incident}
               onClose={() => setChatModal({ open: false, incident: null })}
      />
    </div>
  </div>
)}

    </div>
  );
}

function ChatBox({ incident, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const chatBodyRef = useRef(null);
  const seenRef = useRef(new Set());

  // Try to identify current user for "fromSelf"
  const meId =
    JSON.parse(localStorage.getItem("user"))?.id ||
    localStorage.getItem("userId") ||
    JSON.parse(localStorage.getItem("user"))?._id ||
    null;

  // Normalize any backend message to our UI shape
  const normalize = (m) => ({
  id: m._id || m.id || crypto.randomUUID(),
  name: m.senderName || m.name || m.userName || "User",
  avatar: m.avatar || m.senderAvatar || "",
  text: m.text ?? m.message ?? m.content ?? "",
  time: m.time ?? m.createdAt ?? Date.now(),
  fromSelf:
    m.fromSelf ??
    (m.senderId ? String(m.senderId) === String(meId) : false),
});


  // Auto-scroll to last message
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  // Fetch history + join socket room
useEffect(() => {
  if (!incident?._id) return;

  const token = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  // seen set + short-time window for identical messages
  // - seenRef: remembers ids/keys we've already added
  // - lastSeenAtRef: throttles same (sender+text) within N ms
  const lastSeenAtRef = { current: new Map() };
  const WINDOW_MS = 5000; // ignore identical msg within 5s window

  const makeKey = (m) =>
    m.clientMessageId ||
    m.id ||
    `${m.senderId || m.name}|${(m.text || "").trim().toLowerCase()}`;

  axios
    .get(`/api/incidents/${incident._id}/chat`, config)
    .then((res) => {
      const raw = res.data?.messages || res.data || [];
      const norm = raw.map(normalize);
      norm.forEach((m) =>
        seenRef.current.add(m.id || makeKey(m))
      );
      setMessages(norm);
    })
    .catch(() => setMessages([]));

  socket.emit("join_incident_chat", { incidentId: incident._id });

  const onIncoming = (payload) => {
    const msg = normalize(payload?.message ?? payload);
    const key = makeKey(msg);

    // 1) absolute dedupe: already seen id/key
    if (seenRef.current.has(key)) return;

    // 2) time-window dedupe: same sender+text within WINDOW_MS
    const now = Date.now();
    const last = lastSeenAtRef.current.get(key) || 0;
    if (now - last < WINDOW_MS) return;
    lastSeenAtRef.current.set(key, now);

    // 3) avoid echo of our optimistic message (best-effort)
    const isFromSelf =
      msg.fromSelf || (msg.senderId && String(msg.senderId) === String(meId));
    if (isFromSelf) {
      const lastLocal = messages[messages.length - 1];
      if (
        lastLocal &&
        lastLocal.text === msg.text &&
        Math.abs(new Date(msg.time) - new Date(lastLocal.time)) < 3000
      ) {
        // treat as duplicate echo
        return;
      }
    }

    seenRef.current.add(key);
    setMessages((prev) => [...prev, msg]);
  };

  // ☝️ ensure we don't accumulate duplicate handlers
  socket.off("receive_incident_message", onIncoming);
  socket.on("receive_incident_message", onIncoming);

  return () => {
    socket.off("receive_incident_message", onIncoming);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [incident?._id]);



const sendMessage = () => {
  const text = input.trim();
  if (!text) return;

  const clientMessageId = crypto.randomUUID();
  setInput("");

  socket.emit("send_incident_message", {
    incidentId: incident._id,
    senderId: meId,
    senderName: JSON.parse(localStorage.getItem("user"))?.name || "Me",
    text,
    clientMessageId,
  });
};



  return (
    <div
      className="chat-messenger-modal"
      onClick={(e) => e.stopPropagation()} // keep clicks inside modal from closing parent backdrop
    >
      <div className="chat-messenger-header">
        <span>
          {incident?.name ? `Chat with ${incident.name}` : "Chat"}
        </span>
        <button onClick={onClose} className="chat-messenger-close" aria-label="Close chat">
          &times;
        </button>
      </div>

      <div className="chat-messenger-body" ref={chatBodyRef}>
  {([...messages]
    .sort((a, b) => new Date(a.time) - new Date(b.time))  // ensure oldest → newest
  ).map((msg) => (
    <div
      key={msg.id}
      className={`chat-bubble-row ${msg.fromSelf ? "chat-bubble-self" : "chat-bubble-user"}`}
    >
      {!msg.fromSelf && (
  <FaUserCircle size={32} className="text-gray-400 mr-2" />
)}
      <div className="chat-bubble">
        {!msg.fromSelf && <div className="chat-name">{msg.name}</div>}
        {msg.text}
        <div className="chat-bubble-time">
          {new Date(msg.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  ))}
</div>


      <div className="chat-messenger-input-row">
        <input
          className="chat-messenger-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
            if (e.key === "Escape") onClose();
          }}
        />
        <button className="chat-messenger-send" onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
}
