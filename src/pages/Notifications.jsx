// src/pages/Notifications.jsx
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { FiBell, FiUsers, FiAlertCircle, FiShield, FiTrash2 } from "react-icons/fi";
import { FaBullhorn, FaWater } from "react-icons/fa";
import API from "../api";

// ✅ share the same layout/side bar CSS as ApproveAccounts
import "../css/ApproveAccounts.css";
import "../css/Notifications.css";

dayjs.extend(relativeTime);

const getNotificationIcon = (type) => {
  switch (type) {
    case "announcement":
      return <FaBullhorn className="text-green-600" size={22} />;
    case "visitor":
      return <FiUsers className="text-blue-600" size={22} />;
    case "flood":
      return <FaWater className="text-amber-600" size={22} />;
    case "incident":
      return <FiAlertCircle className="text-red-600" size={22} />;
    case "security":
      return <FiShield className="text-purple-600" size={22} />;
    default:
      return <FiBell className="text-gray-500" size={22} />;
  }
};

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const links = [
    {
      label: "Dashboard",
      route: "/dashboard",
      svg: (
        <svg className="appr-sidebar-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8v-10h-8v10zm0-18v6h8V3h-8z" />
        </svg>
      ),
    },
    {
      label: "Community Announcements",
      route: "/announcements",
      svg: (
        <svg className="appr-sidebar-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2 9h4l10-5v14l-10-5H2V9zm1 1v4h3v-4H3zm14-2.618L7.8 10H5v2h2.8L18 12.618V7.382z" />
        </svg>
      ),
    },
    {
      label: "Flood Tracker",
      route: "/flood-tracker",
      svg: (
        <svg className="appr-sidebar-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2 14c4-4 8 4 12 0 4-4 8 4 8 4v4H2v-4z" />
          <path d="M2 9c4-4 8 4 12 0 4-4 8 4 8 4v1H2V9z" />
        </svg>
      ),
    },
    {
      label: "Incident Report",
      route: "/incidentreport",
      svg: (
        <svg className="appr-sidebar-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 2h9l5 5v15H6V2zM15 3.5V8h4.5L15 3.5z" />
        </svg>
      ),
    },
    {
      label: "Visitor Management",
      route: "/visitorManagement",
      svg: (
        <svg className="appr-sidebar-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 1.2c-3.6 0-10.8 1.8-10.8 5.4V22h21.6v-3.6c0-3.6-7.2-5.4-10.8-5.4z" />
        </svg>
      ),
    },
    {
      label: "Approval Accounts",
      route: "/approve-accounts",
      svg: (
        <svg className="appr-sidebar-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 1.2c-3.6 0-10.8 1.8-10.8 5.4V22h21.6v-3.6c0-3.6-7.2-5.4-10.8-5.4z" />
        </svg>
      ),
    },
    // ✅ add Notifications item so this page can highlight itself
    {
      label: "Notifications",
      route: "/notifications",
      svg: (
        <svg className="appr-sidebar-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22zM19 17H5v-1l2-2v-3a5 5 0 0 1 10 0v3l2 2v1z" />
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
        {links.map((l) => (
          <div
            key={l.label}
            className={`appr-sidebar-link ${location.pathname === l.route ? "appr-active" : ""}`}
            onClick={() => navigate(l.route)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && navigate(l.route)}
          >
            {l.svg}
            <span>{l.label}</span>
          </div>
        ))}
      </nav>
    </aside>
  );
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [userRole, setUserRole] = useState("");
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await API.get("/api/notifications");
      setNotifications(res.data.notifications || []);
    } catch {
      setNotifications([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        setUserRole(JSON.parse(userData)?.role || "");
      } catch {}
    }
  }, []);

  const markAsRead = async (id) => {
    try {
      await API.post(`/api/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    } catch {}
  };

  const deleteNotification = async (id) => {
    try {
      await API.delete(`/api/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch {}
    setDeleteId(null);
  };

  const clearAll = async () => {
    setClearing(true);
    try {
      await API.delete("/api/notifications/clear-all");
      setNotifications([]);
    } catch {}
    setClearing(false);
    setShowConfirm(false);
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.read) await markAsRead(notif._id);

    switch (notif.type) {
      case "announcement":
        navigate(`/announcements/${notif.targetId}`);
        break;
      case "visitor":
        if (userRole === "resident") navigate(`/visitor-requests/${notif.targetId}`);
        else navigate(`/visitorManagement/${notif.targetId}`);
        break;
      case "flood":
        navigate(`/flood-tracker`);
        break;
      case "incident":
        navigate(`/incidentreport`);
        break;
      case "security":
        navigate(`/security-updates/${notif.targetId}`);
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className="appr-container">
        <Sidebar />
        <main className="appr-main flex items-center justify-center">
          <div className="notif-loading">
            <FiBell size={44} />
            <span>Loading notifications…</span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="appr-container">
      <Sidebar />

      <main className="appr-main">
        <header className="appr-header">
          <h1>Notifications</h1>
          <div className="appr-actions">
            <button
              className="btn-ghost-danger"
              onClick={() => setShowConfirm(true)}
              disabled={clearing || notifications.length === 0}
              title="Clear all notifications"
            >
              {clearing ? "Clearing…" : "Clear All"}
            </button>
          </div>
        </header>

        {notifications.length === 0 ? (
          <section className="notif-empty">
            <img
              src={`${process.env.PUBLIC_URL}/assets/empty-notifications.png`}
              alt="No notifications"
            />
            <h3>No notifications yet</h3>
            <p>We’ll notify you when something important happens.</p>
          </section>
        ) : (
          <ul className="notif-list">
            {notifications.map((n) => (
              <li
                key={n._id}
                className={`notif-card ${!n.read ? "unread" : ""}`}
                onClick={() => handleNotificationClick(n)}
              >
                <div className="notif-icon">
                  {getNotificationIcon(n.type)}
                  {!n.read && <span className="dot" />}
                </div>

                <div className="notif-body">
                  <div className="notif-title">{n.title}</div>
                  <div className="notif-text">{n.body}</div>
                  <div className="notif-time">{dayjs(n.createdAt).fromNow()}</div>
                </div>

                <button
                  className="notif-delete"
                  title="Delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteId(n._id);
                  }}
                >
                  <FiTrash2 size={18} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>

      {/* Clear all confirm */}
      {showConfirm && (
        <div className="confirm-overlay" onClick={() => setShowConfirm(false)}>
          <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
            <div className="message">Clear all notifications?</div>
            <div className="description">This action cannot be undone.</div>
            <div className="buttons">
              <button className="cancel" onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className="confirm" onClick={clearAll} disabled={clearing}>
                {clearing ? "Clearing…" : "Yes, Clear All"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete one confirm */}
      {deleteId && (
        <div className="confirm-overlay" onClick={() => setDeleteId(null)}>
          <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
            <div className="message">Delete this notification?</div>
            <div className="description">This action cannot be undone.</div>
            <div className="buttons">
              <button className="cancel" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="confirm" onClick={() => deleteNotification(deleteId)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
