// src/pages/UserAccounts.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Sidebar from "./Sidebar";
import { FiSearch, FiFilter } from "react-icons/fi";

const API_URL = process.env.REACT_APP_API_URL || "https://communisafe-backend.onrender.com";
axios.defaults.baseURL = API_URL;

// image helpers (same as AdminManagement)
const photoUrlFromKey = (key, expires = 600) =>
  `${API_URL}/api/files/signed-url-redirect?key=${encodeURIComponent(key)}&expires=${expires}`;
const legacyUploadUrl = (fname) =>
  `${API_URL}/uploads/${encodeURIComponent(fname)}`;

const authHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function UserAccounts() {
  const [roleFilter, setRoleFilter] = useState("all"); // all | official | security | resident
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [imgModal, setImgModal] = useState({ open: false, src: null });

  useEffect(() => { fetchUsers(); /* eslint-disable-next-line */ }, [roleFilter, search]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/admin/users", {
        headers: authHeader(),
        params: { role: roleFilter, search },
      });
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("accounts load error:", e.response?.data || e.message);
      setUsers([]);
    } finally { setLoading(false); }
  };

  const rows = useMemo(() => users, [users]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafb" }}>
      <Sidebar active="Accounts" />
      <div style={{ flex: 1 }}>
        {/* Top bar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "22px 48px", background: "#fff", boxShadow: "0 1px 8px #0001"
        }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#2e7d32" }}>Accounts</div>

          <div style={{ display: "flex", gap: 12 }}>
            {/* Search */}
            <div style={searchBox}>
              <FiSearch style={{ fontSize: 18, color: "#888" }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search user/email…"
                style={searchInput}
              />
            </div>

            {/* Role filter */}
            <div style={filterBox}>
              <FiFilter style={{ fontSize: 18, color: "#888" }} />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={selectStyle}
              >
                <option value="all">All</option>
                <option value="official">Officials</option>
                <option value="security">Security</option>
                <option value="resident">Residents</option>
              </select>
            </div>
          </div>
        </div>

        {/* Card / Table */}
        <div style={{ margin: "32px 48px", background: "#fff", borderRadius: 18, boxShadow: "0 2px 12px #0001", padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 20, color: "#444", marginBottom: 12 }}>
            User Lists
          </div>

          {loading ? (
            <div style={{ padding: 24, textAlign: "center" }}>Loading...</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#e8f5e9" }}>
                  <th style={thStyle}>Username</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Role</th>
                  <th style={thStyle}>ID Image</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Created</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: 24, color: "#aaa" }}>
                      No users found.
                    </td>
                  </tr>
                ) : (
                  rows.map((u) => {
                    const thumbSrc = u.idKey
                      ? photoUrlFromKey(u.idKey)
                      : u.filePath
                      ? (u.filePath.includes("/") ? photoUrlFromKey(u.filePath) : legacyUploadUrl(u.filePath))
                      : null;

                    return (
                      <tr key={u._id} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={tdStyle}>{u.username || u.name || "—"}</td>
                        <td style={tdStyle}>{u.email || "—"}</td>
                        <td style={tdStyle}>
                          <span style={roleBadge(u.role)}>{u.role}</span>
                        </td>
                        <td style={tdStyle}>
                          {thumbSrc ? (
                            <img
                              src={thumbSrc}
                              alt="ID"
                              onClick={() => setImgModal({ open: true, src: thumbSrc })}
                              onError={(e) => { e.currentTarget.src = `${process.env.PUBLIC_URL}/assets/multiico.png`; }}
                              style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 6, border: "1px solid #ccc", boxShadow: "0 2px 8px #0001", cursor: "pointer" }}
                            />
                          ) : (
                            <span style={{ color: "#aaa" }}>No ID</span>
                          )}
                        </td>
                        <td style={tdStyle}>
                          <span style={statusPill(u.status)}>{u.status}</span>
                        </td>
                        <td style={tdStyle}>
                          {u.createdAt ? new Date(u.createdAt).toLocaleString() : "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Image Modal */}
        {imgModal.open && (
          <div
            onClick={() => setImgModal({ open: false, src: null })}
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
              display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
            }}
            role="dialog" aria-modal="true"
          >
            <img
              src={imgModal.src}
              alt="Full ID"
              style={{ maxWidth: "80%", maxHeight: "80%", borderRadius: 12, boxShadow: "0 4px 20px #0009" }}
              onError={(e) => { e.currentTarget.src = `${process.env.PUBLIC_URL}/assets/multiico.png`; }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ===== styles (same feel as Admin) ===== */
const thStyle = {
  padding: "14px 10px",
  fontWeight: 700,
  fontSize: 16,
  color: "#388e3c",
  borderBottom: "2px solid #c8e6c9",
  textAlign: "left",
};
const tdStyle = {
  padding: "12px 10px",
  fontSize: 15,
  color: "#444",
  borderBottom: "1px solid #eee",
};

const searchBox = { display: "flex", alignItems: "center", background: "#fff", borderRadius: 10, padding: "6px 12px", boxShadow: "0 1px 4px #0001" };
const searchInput = { border: "none", outline: "none", marginLeft: 8, fontSize: 15, background: "none", width: 220 };
const filterBox = { display: "flex", alignItems: "center", background: "#fff", borderRadius: 10, padding: "6px 12px", boxShadow: "0 1px 4px #0001" };
const selectStyle = { border: "none", outline: "none", marginLeft: 8, fontSize: 15, background: "none", cursor: "pointer" };

const roleBadge = (role = "") => {
  const r = String(role).toLowerCase();
  const bg = r === "resident" ? "#e3f2fd"
    : r === "security" ? "#f3e5f5"
    : r === "superadmin" ? "#fff3e0"
    : "#e8f5e9";
  const fg = r === "resident" ? "#1565c0"
    : r === "security" ? "#6a1b9a"
    : r === "superadmin" ? "#ef6c00"
    : "#2e7d32";
  return {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    color: fg,
    background: bg,
    border: `1px solid ${fg}22`,
    textTransform: "lowercase",
  };
};

const statusPill = (status = "") => {
  const s = String(status).toLowerCase();
  const bg = s === "active" ? "#e8f5e9" : s === "pending" ? "#fff8e1" : "#ffebee";
  const fg = s === "active" ? "#2e7d32" : s === "pending" ? "#e67e22" : "#c62828";
  return {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    color: fg,
    background: bg,
    border: `1px solid ${fg}22`,
    textTransform: "lowercase",
  };
};
