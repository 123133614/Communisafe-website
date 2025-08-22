// src/pages/AdminManagement.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "./Sidebar";
import { FiSearch, FiUserPlus, FiFilter } from "react-icons/fi";

const API_URL = process.env.REACT_APP_API_URL || "https://communisafe-backend.onrender.com";
axios.defaults.baseURL = API_URL; // <-- ensure all relative calls hit the cloud

// Helpers for images
const photoUrlFromKey = (key, expires = 600) =>
  `${API_URL}/api/files/signed-url-redirect?key=${encodeURIComponent(key)}&expires=${expires}`;

const legacyUploadUrl = (fname) =>
  `${API_URL}/uploads/${encodeURIComponent(fname)}`;

const authHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function AdminManagement() {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState("official");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [imgModal, setImgModal] = useState({ open: false, src: null });


    console.log("🔎 AdminManagement v2 mounted");
  // put this INSIDE the component so it can use setImgModal
  const openIdModal = (user) => {
    const key = user.idKey || (user.filePath?.includes("/") ? user.filePath : null);
    const src = key
      ? photoUrlFromKey(key)
      : user.filePath
      ? legacyUploadUrl(user.filePath)
      : `${process.env.PUBLIC_URL}/assets/multiico.png`;
    setImgModal({ open: true, src });
  };



  useEffect(() => {
    fetchPendingUsers(roleFilter);
    // eslint-disable-next-line
  }, [roleFilter]);

  const fetchPendingUsers = async (role) => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/auth/pending-users?role=${role}`, {
        headers: authHeader(),
      });
      setUsers(res.data || []);
    } catch (err) {
      console.error("pending-users error:", err?.response?.data || err.message);
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
      console.error("user-status error:", err?.response?.data || err.message);
      alert("Failed to update user status.");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (u.username || u.name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafb" }}>
      <Sidebar active="Admin Management" />
      <div style={{ flex: 1 }}>
        {/* ...header etc... */}
        <div style={{ margin: "32px 48px", background: "#fff", borderRadius: 18, boxShadow: "0 2px 12px #0001", padding: 32 }}>
          {/* table */}
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
                filteredUsers.map((user) => {
                  const thumbSrc = user.idKey
                    ? photoUrlFromKey(user.idKey)
                    : user.filePath
                    ? (user.filePath.includes("/") ? photoUrlFromKey(user.filePath) : legacyUploadUrl(user.filePath))
                    : null;

                  return (
                    <tr key={user._id} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={tdStyle}>{user.username || user.name}</td>
                      <td style={tdStyle}>{user.email}</td>
                      <td style={tdStyle}>{user.role}</td>
                      <td style={tdStyle}>
                        {thumbSrc ? (
                          <img
                            src={thumbSrc}
                            alt="ID"
                            style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 6, border: "1px solid #ccc", boxShadow: "0 2px 8px #0001", cursor: "pointer" }}
                            onClick={() => openIdModal(user)}
                            onError={(e) => { e.currentTarget.src = `${process.env.PUBLIC_URL}/assets/multiico.png`; }}
                          />
                        ) : (
                          <span style={{ color: "#aaa" }}>No ID</span>
                        )}
                      </td>
                      <td style={tdStyle}>
                        <span style={{ color: user.status === "active" ? "#388e3c" : user.status === "pending" ? "#f39c12" : "#e74c3c", fontWeight: 600 }}>
                          {user.status?.[0]?.toUpperCase() + user.status?.slice(1)}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        {user.status === "pending" ? (
                          <>
                            <button style={approveBtn} onClick={() => updateUserStatus(user._id, "active")}>Approve</button>
                            <button style={rejectBtn} onClick={() => updateUserStatus(user._id, "rejected")}>Reject</button>
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
        </div>

        {imgModal.open && (
          <div
            onClick={() => setImgModal({ open: false, src: null })}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
          >
            <img src={imgModal.src} alt="Full ID" style={{ maxWidth: "80%", maxHeight: "80%", borderRadius: 12, boxShadow: "0 4px 20px #0009" }} />
          </div>
        )}
      </div>
    </div>
  );
}

const thStyle = { padding: "14px 10px", fontWeight: 700, fontSize: 16, color: "#388e3c", borderBottom: "2px solid #c8e6c9", textAlign: "left" };
const tdStyle = { padding: "12px 10px", fontSize: 15, color: "#444", borderBottom: "1px solid #eee" };
const approveBtn = { background: "#4caf50", color: "#fff", border: "none", borderRadius: 6, padding: "6px 16px", marginRight: 8, fontWeight: 600, cursor: "pointer" };
const rejectBtn  = { background: "#e74c3c", color: "#fff", border: "none", borderRadius: 6, padding: "6px 16px", fontWeight: 600, cursor: "pointer" };
