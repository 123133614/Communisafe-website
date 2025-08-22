// src/components/Dashboard.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiBell, FiUser, FiEdit2 } from "react-icons/fi";
import { motion } from "framer-motion";
import axios from "axios";
import io from "socket.io-client";
import "../css/Dashboard.css";

// ─── API base ──────────────────────────────────────────────────────────────
const API_URL =
  process.env.REACT_APP_API_URL || "https://communisafe-backend.onrender.com";

// ─── Helpers ───────────────────────────────────────────────────────────────
function formatTimestamp(isoString) {
  const d = new Date(isoString);
  return d.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: true,
  });
}

export default function Dashboard() {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userInfo, setUserInfo] = useState({ name: "", email: "", role: "" });
  const [currentTime, setCurrentTime] = useState(new Date());

  // data feeds
  const [announcements, setAnnouncements] = useState([]);
  const [floodAlerts, setFloodAlerts] = useState([]);
  const [users, setUsers] = useState([]);
  const [incidents, setIncidents] = useState([]);

  // counts shown on the green cards
  const [activeUsersCount, setActiveUsersCount] = useState(0);
  const [activeAdminsCount, setActiveAdminsCount] = useState(0);
  const [recentIncidentsCount, setRecentIncidentsCount] = useState(0);

  // for local fallback computation
  const [incidentCount, setIncidentCount] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role") || "guest";
  const socketRef = useRef(null);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Auth check
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!token || !userId) return navigate("/login");

    axios
      .get(`${API_URL}/api/auth/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (res.data.status !== "active") {
          localStorage.clear();
          navigate("/pending");
        }
      })
      .catch(() => {
        localStorage.clear();
        navigate("/login");
      });
  }, [navigate, token]);

  // Load user info
  useEffect(() => {
    setUserInfo({
      name: localStorage.getItem("name") || "Unknown",
      email: localStorage.getItem("email") || "No Email",
      role,
    });
  }, [role]);

  // Fetch initial data (lists) + sockets for real-time streams
  useEffect(() => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    axios
      .get(`${API_URL}/api/announcements`, { headers })
      .then((res) => setAnnouncements(res.data))
      .catch(() => {});

    axios
      .get(`${API_URL}/api/flood/reports`)
      .then((res) => setFloodAlerts(res.data))
      .catch(() => {});

    axios
      .get(`${API_URL}/api/users`, { headers })
      .then((res) => setUsers(res.data))
      .catch(() => {});

    axios
      .get(`${API_URL}/api/incidents`, { headers })
      .then((res) => setIncidents(res.data))
      .catch(() => {});

    // sockets
    socketRef.current = io(API_URL, {
      transports: ["websocket"],
      auth: token ? { token } : undefined,
    });

    // live streams you already had
    socketRef.current.on("newAnnouncement", (a) =>
      setAnnouncements((p) => [a, ...p])
    );
    socketRef.current.on("newFloodReport", (f) =>
      setFloodAlerts((p) => [f, ...p])
    );

    // refresh stats when accounts/incidents change
    const refetchEvents = [
      "account_approved",
      "account_status_changed",
      "user_deleted",
      "incident_created",
      "incident_status_changed",
    ];
    refetchEvents.forEach((evt) =>
      socketRef.current.on(evt, () => {
        loadStats(); // defined below
      })
    );

    return () => {
      if (socketRef.current) {
        refetchEvents.forEach((evt) =>
          socketRef.current.off(evt)
        );
        socketRef.current.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Compute local incident open count (fallback for Recent Incidents)
  useEffect(() => {
    setIncidentCount(
      incidents.filter((i) =>
        !["resolved", "solved"].includes((i.status || "").toLowerCase())
      ).length
    );
  }, [incidents]);

  // Load counts from backend stats endpoint; fallback to local computation
  const loadStats = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/stats/active-counts`);
      setActiveUsersCount(data.activeUsers ?? 0);
      setActiveAdminsCount(data.activeAdmins ?? 0);
      setRecentIncidentsCount(
        typeof data.recentIncidents === "number"
          ? data.recentIncidents
          : incidentCount
      );
    } catch (err) {
      // fallback if stats API not available yet
      const activeUsersLocal = users.filter((u) => u.status === "active" && u.role !== "official").length
        + users.filter((u) => u.status === "active" && (u.role === "resident" || u.role === "security")).length
        - users.filter((u) => u.status === "active" && u.role === "official").length; // ensure admins not counted here
      const activeAdminsLocal = users.filter(
        (u) => u.status === "active" && u.role === "official"
      ).length;

      setActiveUsersCount(
        Number.isFinite(activeUsersLocal)
          ? activeUsersLocal
          : users.filter((u) => u.status === "active").length
      );
      setActiveAdminsCount(activeAdminsLocal);
      setRecentIncidentsCount(incidentCount);
    }
  };

  // Call loadStats when lists/incidentCount change or on first mount
  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, incidentCount]);

  const timeString = currentTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const dateString = currentTime.toLocaleDateString([], {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const greeting =
    role === "official"
      ? "Admin"
      : role === "security"
      ? "Security"
      : role === "resident"
      ? "User"
      : "Guest";

  // ─── Sidebar Links ───────────────────────────────────────────────────────
  const sidebarLinks = [
    {
      label: "Dashboard",
      route: "/dashboard",
      svg: (
        <svg
          className="appr-sidebar-icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8v-10h-8v10zm0-18v6h8V3h-8z" />
        </svg>
      ),
    },
    {
      label: "Community Announcements",
      route: "/announcements",
      svg: (
        <svg
          className="appr-sidebar-icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M2 9h4l10-5v14l-10-5H2V9zm1 1v4h3v-4H3zm14-2.618L7.8 10H5v2h2.8L18 12.618V7.382z" />
        </svg>
      ),
    },
    {
      label: "Flood Tracker",
      route: "/flood-tracker",
      svg: (
        <svg
          className="appr-sidebar-icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M2 14c4-4 8 4 12 0 4-4 8 4 8 4v4H2v-4z" />
          <path d="M2 9c4-4 8 4 12 0 4-4 8 4 8 4v1H2V9z" />
        </svg>
      ),
    },
    {
      label: "Incident Report",
      route: "/incidentreport",
      svg: (
        <svg
          className="appr-sidebar-icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M6 2h9l5 5v15H6V2zM15 3.5V8h4.5L15 3.5z" />
        </svg>
      ),
    },
    {
      label: "Visitor Management",
      route: role === "resident" ? "/visitor-requests" : "/visitorManagement",
      svg: (
        <svg
          className="appr-sidebar-icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 1.2c-3.6 0-10.8 1.8-10.8 5.4V22h21.6v-3.6c0-3.6-7.2-5.4-10.8-5.4z" />
        </svg>
      ),
    },
    {
      label: "Approval Accounts",
      route: "/approve-accounts",
      svg: (
        <svg
          className="appr-sidebar-icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 1.2c-3.6 0-10.8 1.8-10.8 5.4V22h21.6v-3.6c0-3.6-7.2-5.4-10.8-5.4z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="appr-container">
      {/* Sidebar */}
      <aside
        className="appr-sidebar"
        style={{ backgroundImage: "url(/assets/sidebar.png)" }}
      >
        <nav className="appr-sidebar-nav">
          {sidebarLinks.map((link) => (
            <div
              key={link.label}
              className={`appr-sidebar-link ${
                location.pathname === link.route ? "appr-active" : ""
              }`}
              onClick={() => navigate(link.route)}
            >
              {link.svg}
              <span>{link.label}</span>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main area */}
      <main className="appr-main">
        {/* Topbar */}
        <div className="topbar-container">
          <h1 className="topbar-title">Welcome, {greeting}!</h1>
          <div className="flex items-center gap-6">
            <div
              onClick={() => navigate("/notifications")}
              className="icon-button"
              title="Notifications"
            >
              <FiBell size={28} />
            </div>
            <div
              onClick={() => setShowProfileModal(true)}
              className="icon-button user-icon"
              title="Profile"
            >
              <FiUser size={28} />
            </div>
            <div className="clock-inline">
              <div className="clock-time">{timeString}</div>
              <div className="clock-date">{dateString}</div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <section className="summary-cards-grid mb-8">
          <div
            className="summary-card bg-gradient-to-r from-lime-400 to-green-400"
            style={{ position: "relative" }}
          >
            <div className="summary-card-title">Active Users</div>
            <div className="summary-card-value">{activeUsersCount}</div>
            <div
              style={{
                position: "absolute",
                bottom: "1.2rem",
                right: "1.5rem",
                fontSize: "2.8rem",
                color: "white",
                opacity: 0.95,
              }}
            >
              <svg width="48" height="48" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05C17.16 13.4 19 14.28 19 15.5V19h5v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </svg>
            </div>
          </div>

          <div
            className="summary-card bg-gradient-to-r from-lime-400 to-green-400"
            style={{ position: "relative" }}
          >
            <div className="summary-card-title">Active Admins</div>
            <div className="summary-card-value">{activeAdminsCount}</div>
            <div
              style={{
                position: "absolute",
                bottom: "1.2rem",
                right: "1.5rem",
                fontSize: "2.8rem",
                color: "white",
                opacity: 0.95,
              }}
            >
              <svg width="48" height="48" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 1.2c-3.6 0-10.8 1.8-10.8 5.4V22h21.6v-3.6c0-3.6-7.2-5.4-10.8-5.4zm-2.4 5.4l1.2-3.6h2.4l1.2 3.6h-4.8z"/>
              </svg>
            </div>
          </div>

          <div
            className="summary-card bg-gradient-to-r from-lime-400 to-green-400"
            style={{ position: "relative" }}
          >
            <div className="summary-card-title">Recent Incidents</div>
            <div className="summary-card-value">{recentIncidentsCount}</div>
            <div
              style={{
                position: "absolute",
                bottom: "1.2rem",
                right: "1.5rem",
                fontSize: "2.8rem",
                color: "white",
                opacity: 0.95,
              }}
            >
              <svg width="48" height="48" fill="currentColor" viewBox="0 0 24 24">
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
              </svg>
            </div>
          </div>
        </section>

        {/* Latest Announcements */}
        <section className="mt-4">
          <h2 className="text-xl font-semibold mb-4">Latest from CommuniSafe</h2>

          {announcements.length === 0 ? (
            <div className="text-center text-gray-500 py-6">
              No announcements found.
            </div>
          ) : (
            <motion.div
              key={announcements[0]._id}
              className="latest-announcement-card flex flex-col md:flex-row bg-white shadow-md rounded-lg overflow-hidden mb-6"
              whileHover={{ boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}
            >
              {/* Text */}
              <div className="flex flex-col justify-between p-6 flex-1">
                <p className="text-xs font-medium text-gray-500 mb-1">
                  {announcements[0].category}
                </p>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  {announcements[0].title}
                </h3>
                <p className="text-sm text-gray-600 mb-4 whitespace-pre-line">
                  {announcements[0].description}
                </p>
                <small className="text-gray-500 text-xs">
                  {formatTimestamp(
                    announcements[0].createdAt || announcements[0].timestamp
                  )}
                </small>
              </div>

              {/* Image */}
              {/* Image */}
{(() => {
  const a = announcements[0] || {};
  const raw = a.imageUrl || a.image;        
  const base = (process.env.REACT_APP_API_URL || "https://communisafe-backend.onrender.com").replace(/\/$/, "");

  let imgSrc = "/assets/multiico.png";
  if (raw) {
    if (raw.startsWith("http")) {
      imgSrc = raw;                          
    } else if (raw.startsWith("/assets/")) {
      imgSrc = raw;                          
    } else {
      imgSrc = `${base}/api/uploads/${raw}`; 
    }
  }

  return (
    <div className="flex-1 max-w-md bg-gray-100 flex items-center justify-center p-4">
      <img
        src={imgSrc}
        alt={a.title || "Announcement"}
        className="w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = "/assets/multiico.png";
        }}
      />
    </div>
  );
})()}

            </motion.div>
          )}
        </section>
      </main>

      {/* Profile Modal */}
      {showProfileModal && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="profile-modal"
          onClick={() => setShowProfileModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="profile-modal-content"
          >
            <div className="profile-header">
              <div className="profile-avatar">
                <img
                  src={
                    localStorage.getItem("profileImage") ||
                    "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                  }
                  alt="Profile"
                />
              </div>
              <div className="profile-info">
                <h2>{userInfo.name}</h2>
                <p>{userInfo.email}</p>
                <span className="profile-role">
                  🟢 {userInfo.role.charAt(0).toUpperCase() + userInfo.role.slice(1)}
                </span>
              </div>
            </div>

            <div className="profile-options">
              <div
                className="profile-option"
                onClick={() => {
                  setShowProfileModal(false);
                  navigate("/personal-info");
                }}
              >
                <FiEdit2 className="profile-option-icon" />
                <span className="profile-option-text">Personal Information</span>
              </div>
              <div
                className="profile-option"
                onClick={() => {
                  setShowProfileModal(false);
                  navigate("/settings");
                }}
              >
                <FiEdit2 className="profile-option-icon" />
                <span className="profile-option-text">Settings</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
