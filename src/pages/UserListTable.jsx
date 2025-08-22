// src/pages/UserListTable.jsx
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { FiSearch, FiFilter } from "react-icons/fi";

const API_URL = process.env.REACT_APP_API_URL || "https://communisafe-backend.onrender.com";
axios.defaults.baseURL = API_URL;

// Helpers (same style as AdminManagement.jsx)
const photoUrlFromKey = (key, expires = 600) =>
  `${API_URL}/api/files/signed-url-redirect?key=${encodeURIComponent(key)}&expires=${expires}`;

const legacyUploadUrl = (fname) =>
  `${API_URL}/uploads/${encodeURIComponent(fname)}`;

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
const approveBtn = {
  background: "#4caf50",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "6px 16px",
  marginRight: 8,
  fontWeight: 600,
  cursor: "pointer",
};
const rejectBtn = {
  background: "#e74c3c",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "6px 16px",
  fontWeight: 600,
  cursor: "pointer",
};

const authHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function UserListTable() {
  const [roleFilter, setRoleFilter] = useState("official");
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Modal state
  const [modal, setModal] = useState({ open: false, src: null });

  useEffect(() => {
    fetchPendingUsers(roleFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter]);

  const fetchPendingUsers = async (role) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/auth/pending-users?role=${role}`, { headers: authHeader() });
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("pending-users error:", err.response?.data || err.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const updateUserStatus = async (userId, status) => {
    setLoading(true);
    try {
      await axios.put(
        `/api/auth/user-status/${userId}`,
        { status, role: roleFilter },
        { headers: authHeader() }
      );
      await fetchPendingUsers(roleFilter);
    } catch (err) {
      console.error("user-status error:", err.response?.data || err.message);
      alert("Failed to update user status.");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        (u.username || u.name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q)
    );
  }, [users, search]);

  return (
    <div style={{ width: "100%" }}>
      {/* Search + Filter */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", background: "#fff", borderRadius: 8, padding: "6px 12px", boxShadow: "0 1px 4px #0001" }}>
            <FiSearch style={{ fontSize: 18, color: "#888" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              style={{ border: "none", outline: "none", marginLeft: 8, fontSize: 15, background: "none" }}
            />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", background: "#fff", borderRadius: 8, padding: "6px 12px", boxShadow: "0 1px 4px #0001" }}>
          <FiFilter style={{ fontSize: 18, color: "#888" }} />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ border: "none", outline: "none", marginLeft: 8, fontSize: 15, background: "none", cursor: "pointer" }}
          >
            <option value="official">Community Officials</option>
            <option value="security">Security Personnel</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 18, boxShadow: "0 2px 12px #0001", padding: 24 }}>
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
                <th style={thStyle}>Email Address</th>
                <th style={thStyle}>Role</th>
                <th style={thStyle}>ID Image</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 24, color: "#aaa" }}>
                    No users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  // Primary: S3 idKey → redirect URL
                  // Fallback: legacy filePath (S3-style key or local /uploads)
                  const thumbSrc = u.idKey
                    ? photoUrlFromKey(u.idKey)
                    : u.filePath
                    ? (u.filePath.includes("/")
                        ? photoUrlFromKey(u.filePath)
                        : legacyUploadUrl(u.filePath))
                    : null;

                  const safeStatus =
                    (u.status && String(u.status))
                      ? (u.status[0].toUpperCase() + u.status.slice(1))
                      : "—";

                  return (
                    <tr key={u._id} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={tdStyle}>{u.username || u.name}</td>
                      <td style={tdStyle}>{u.email}</td>
                      <td style={tdStyle}>{u.role}</td>
                      <td style={tdStyle}>
                        {thumbSrc ? (
                          <img
                            src={thumbSrc}
                            alt="ID"
                            onClick={() => setModal({ open: true, src: thumbSrc })}
                            onError={(e) => {
                              // last-resort fallback thumbnail
                              e.currentTarget.src = `${process.env.PUBLIC_URL}/assets/multiico.png`;
                            }}
                            style={{
                              width: 48, height: 48, objectFit: "cover",
                              borderRadius: 6, border: "1px solid #ccc",
                              boxShadow: "0 2px 8px #0001", cursor: "pointer"
                            }}
                          />
                        ) : (
                          <span style={{ color: "#aaa" }}>No ID</span>
                        )}
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 600 }}>{safeStatus}</span>
                      </td>
                      <td style={tdStyle}>
                        {u.status === "pending" ? (
                          <>
                            <button style={approveBtn} onClick={() => updateUserStatus(u._id, "active")}>Approve</button>
                            <button style={rejectBtn} onClick={() => updateUserStatus(u._id, "rejected")}>Reject</button>
                          </>
                        ) : (
                          <span style={{ color: "#bbb" }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modal.open && (
        <div
          onClick={() => setModal({ open: false, src: null })}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000, padding: 12
          }}
          role="dialog" aria-modal="true"
        >
          <img
            src={modal.src}
            alt="User ID"
            style={{ width: "min(900px, 100%)", height: "auto", maxHeight: "90svh", objectFit: "contain", borderRadius: 12, boxShadow: "0 6px 28px rgba(0,0,0,0.35)" }}
            onError={(e) => { e.currentTarget.src = `${process.env.PUBLIC_URL}/assets/multiico.png`; }}
          />
        </div>
      )}
    </div>
  );
}
