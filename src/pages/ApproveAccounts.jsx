// src/pages/ApproveAccounts.jsx
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "../css/ApproveAccounts.css";

export default function ApproveAccounts() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [imgModal, setImgModal] = useState({ open: false, src: null });

  const navigate = useNavigate();
  const location = useLocation();

 const API_URL =
  process.env.REACT_APP_API_URL || "https://communisafe-backend.onrender.com";
  axios.defaults.baseURL = API_URL;


  const authHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/auth/pending-users?role=resident`, { headers: authHeader() });
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("fetchPending error:", e?.response?.data || e.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // optional: redirect if no token
    if (!localStorage.getItem("token")) {
      // navigate("/login"); // uncomment if you want to force login
    }
    fetchPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const approveReject = async (userId, status) => {
    try {
      setLoading(true);
      await axios.put(
        `${API_URL}/api/auth/user-status/${userId}`,
        { status, role: "resident" },
        { headers: authHeader() }
      );
      await fetchPending(); // refresh list after update
    } catch (e) {
      console.error("approveReject error:", e?.response?.data || e.message);
      alert("Failed to update user.");
      setLoading(false); // fetchPending didn't run, so close spinner
    }
  };

  const filtered = users.filter((u) => {
    const n = (u.username || u.name || "").toLowerCase();
    const e = (u.email || "").toLowerCase();
    const q = search.toLowerCase();
    return n.includes(q) || e.includes(q);
  });

  // Sidebar (same items, same routes)
  const sidebarLinks = [
    { label: "Dashboard", route: "/dashboard", svg: (
      <svg className="appr-sidebar-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8v-10h-8v10zm0-18v6h8V3h-8z" />
      </svg>
    )},
    { label: "Community Announcements", route: "/announcements", svg: (
      <svg className="appr-sidebar-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M2 9h4l10-5v14l-10-5H2V9zm1 1v4h3v-4H3zm14-2.618L7.8 10H5v2h2.8L18 12.618V7.382z" />
      </svg>
    )},
    { label: "Flood Tracker", route: "/flood-tracker", svg: (
      <svg className="appr-sidebar-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M2 14c4-4 8 4 12 0 4-4 8 4 8 4v4H2v-4z" />
        <path d="M2 9c4-4 8 4 12 0 4-4 8 4 8 4v1H2V9z" />
      </svg>
    )},
    { label: "Incident Report", route: "/incidentreport", svg: (
      <svg className="appr-sidebar-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 2h9l5 5v15H6V2zM15 3.5V8h4.5L15 3.5z" />
      </svg>
    )},
    { label: "Visitor Management", route: "/visitorManagement", svg: (
      <svg className="appr-sidebar-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 1.2c-3.6 0-10.8 1.8-10.8 5.4V22h21.6v-3.6c0-3.6-7.2-5.4-10.8-5.4z" />
      </svg>
    )},
    { label: "Approval Accounts", route: "/approve-accounts", svg: (
      <svg className="appr-sidebar-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 1.2c-3.6 0-10.8 1.8-10.8 5.4V22h21.6v-3.6c0-3.6-7.2-5.4-10.8-5.4z" />
      </svg>
    )},
  ];

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
          <h1>Approval Accounts</h1>
          <div className="appr-actions">
            <div className="appr-search">
              <input
                type="text"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
           
          </div>
        </header>

        <section className="appr-card">
          {loading ? (
            <div className="appr-loading">Loading…</div>
          ) : (
            <table className="appr-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email Address</th>
                  <th>Role</th>
                  <th>ID Image</th>
                  <th>Status</th>
                  <th className="appr-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td className="appr-nodata" colSpan={6}>
                      No pending residents.
                    </td>
                  </tr>
                ) : (
                  filtered.map((u) => {
                    const raw = String(u.filePath || "");
                    const file = raw.replace(/^uploads[\\/]/, "");
                    const src = file ? `${API_URL}/api/uploads/${file}` : null;
                    const fallback = file ? `${API_URL}/uploads/${file}` : null;

                    return (
                      <tr key={u._id}>
                        <td>{u.username || u.name || "-"}</td>
                        <td>{u.email || "-"}</td>
                        <td>{u.role || "resident"}</td>
                        <td>
                          {src ? (
                            <img
                              src={src}
                              alt="ID"
                              className="appr-thumb"
                              onClick={() => setImgModal({ open: true, src })}
                              onError={(e) => {
                                if (fallback && e.currentTarget.src !== fallback) {
                                  e.currentTarget.src = fallback;
                                }
                              }}
                            />
                          ) : (
                            <span className="appr-muted">No ID</span>
                          )}
                        </td>
                        <td>
                          <span
                            className={`appr-status ${
                              u.status === "active"
                                ? "appr-status--ok"
                                : u.status === "rejected"
                                ? "appr-status--bad"
                                : "appr-status--pending"
                            }`}
                          >
                            {(u.status || "pending").replace(/\b\w/g, (c) => c.toUpperCase())}
                          </span>
                        </td>
                        <td className="appr-center">
                          {u.status === "pending" ? (
                            <>
                              <button
                                className="appr-btn appr-btn--approve"
                                onClick={() => approveReject(u._id, "active")}
                                disabled={loading}
                              >
                                Approve
                              </button>
                              <button
                                className="appr-btn appr-btn--reject"
                                onClick={() => approveReject(u._id, "rejected")}
                                disabled={loading}
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <span className="appr-muted">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </section>
      </main>

      {/* Image modal */}
      {imgModal.open && imgModal.src && (
        <div className="appr-modal-backdrop" onClick={() => setImgModal({ open: false, src: null })}>
          <div className="appr-modal" onClick={(e) => e.stopPropagation()}>
            <img src={imgModal.src} alt="ID Preview" />
            <button className="appr-close" onClick={() => setImgModal({ open: false, src: null })}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
