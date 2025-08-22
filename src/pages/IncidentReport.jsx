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
import io from "socket.io-client";



const API_URL =
  process.env.REACT_APP_API_URL || "https://communisafe-backend.onrender.com";

  axios.defaults.baseURL = API_URL;

  export const photoUrlFromKey = (key) =>
    key
  ? `${API_URL}/api/files/signed-url?key=${encodeURIComponent(key)}`
  : `${process.env.PUBLIC_URL}/assets/multiico.png`;



const socket = io(API_URL, { transports: ["websocket"] });

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

  useEffect(() => {
    socket.on("newNotification", (data) => {
      if (data.type === "incident") {
        notify({
          title: data.title,
          body: data.body,
          icon: "/favicon.ico",
          url: "/incidentreport",
        });
      }
    });
    return () => socket.off("newNotification");
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
    axios
      .get(`${API_URL}/api/incidents`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setIncidents(res.data))
      .catch((err) => console.error("Error fetching incidents:", err));
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
            
          </div>
        </header>

        {/* Report Incident Modal */}
        {showModal && (
          <div className="modal-backdrop">
            <div className="modal-content" style={{ maxWidth: "40rem", padding: "1.5rem" }}>
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
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center"
            onClick={() => setPreviewModal(null)}
          >
            <div
              className="flex bg-white rounded-lg shadow-lg overflow-hidden max-w-4xl w-full preview-modal"
              onClick={(e) => e.stopPropagation()}
              style={{ minHeight: "400px" }}
            >
              <div className="preview-left w-full md:w-1/2 bg-gray-100 flex items-center justify-center">
                <img src={photoUrlFromKey(previewModal?.photos?.[0])}
                alt="Incident" onError={(e) => { e.currentTarget.src = `${process.env.PUBLIC_URL}/assets/multiico.png`; }}
                className="object-cover w-full h-full"/>
              </div>

             <div className="preview-right w-full md:w-1/2 p-6 flex flex-col">
                <h2 className="text-xl font-bold text-green-700 mb-2">{previewModal.type}</h2>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Location:</strong> {previewModal.location}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Date:</strong> {previewModal.date}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  <strong>Description:</strong>
                  <br />
                  {previewModal.description}
                </p>

                <div className="mt-auto flex flex-wrap gap-2 justify-end">
                  <button className="bg-blue-600 text-white px-4 py-1 rounded" onClick={() => setChatModal({ open: true, incident: previewModal })}>
                    Chat
                  </button>

                  {previewModal.status?.toLowerCase() !== "solved" &&
                    previewModal.status?.toLowerCase() !== "resolved" && (
                      <button
                        className={`bg-yellow-500 text-white px-4 py-1 rounded ${
                          respondingId === previewModal._id || previewModal.status?.toLowerCase() === "responding"
                            ? "opacity-50 cursor-not-allowed"
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
                        {respondingId === previewModal._id ? "Responding..." : "Respond"}
                      </button>
                    )}

                  {previewModal.status?.toLowerCase() !== "solved" &&
                    previewModal.status?.toLowerCase() !== "resolved" && (
                      <button className="bg-green-600 text-white px-4 py-1 rounded" onClick={() => handleMarkAsSolved(previewModal._id)}>
                        Mark as Solved
                      </button>
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

           const photoUrl = photoUrlFromKey(inc?.photos?.[0]);


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

      {/* Chat Modal */}
      {/* Chat Modal – professional */}
      {chatModal.open && (
          <div className="modal-backdrop" onClick={() => setChatModal({ open: false, incident: null })}>
             <div className="modal-content chat-pro" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} >
              <ChatBox
               incident={chatModal.incident}
               onClose={() => setChatModal({ open: false, incident: null })}/>
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

    // 1) Load history
    axios
      .get(`/api/chat/${incident._id}`, config)
      .then((res) => {
        const raw = res.data?.messages || res.data || [];
        setMessages(raw.map(normalize));
      })
      .catch(() => setMessages([]));

    // 2) Join room & listen for incoming
    socket.emit("chat:join", { roomId: incident._id });

    const onIncoming = (payload) => {
      // payload could be { message: {...} } or the message itself
      const msg = payload?.message ?? payload;
      setMessages((prev) => [...prev, normalize(msg)]);
    };

    socket.on("chat:newMessage", onIncoming);

    // Cleanup on unmount/close
    return () => {
      socket.emit("chat:leave", { roomId: incident._id });
      socket.off("chat:newMessage", onIncoming);
    };
  }, [incident?._id]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;

    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
      // Support backends expecting { text } OR { message }
      const res = await axios.post(
        `/api/chat/${incident._id}`,
        { text, message: text },
        config
      );

      const created =
        res.data?.message || res.data?.data || res.data || { text, senderId: meId, createdAt: Date.now(), fromSelf: true };

      // Optimistic update (normalized)
      setMessages((prev) => [...prev, normalize({ ...created, fromSelf: true })]);
      setInput("");

      // Also emit via socket for other clients (if your backend doesn’t echo immediately)
      socket.emit("chat:send", {
        roomId: incident._id,
        message: { text, senderId: meId, createdAt: Date.now() },
      });
    } catch (e) {
      console.error("Send failed:", e);
    }
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
        <img
          src={msg.avatar || "/default-avatar.png"}
          alt={msg.name}
          className="chat-avatar"
        />
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
