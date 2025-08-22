import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "./Sidebar";
import "../css/ActivityLog.css";

export default function ActivityLog() {
  const [logs, setLogs] = useState([]);

  const API_URL =
    process.env.REACT_APP_API_URL || "https://communisafe-backend.onrender.com";

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const platform = isMobile ? "mobile" : "web";

  useEffect(() => {
    const run = async () => {
      try {
        const token = localStorage.getItem("token");

        // Fetch logs
        const res = await axios.get(`${API_URL}/api/activity`, {
          headers: { Authorization: `Bearer ${token}`, "x-platform": platform },
        });
        setLogs(res.data || []);

        // Log the view
        await axios.post(
          `${API_URL}/api/activity`,
          { action: "Viewed Activity Log", type: "system" },
          { headers: { Authorization: `Bearer ${token}`, "x-platform": platform } }
        );
      } catch (err) {
        console.error("Error fetching/logging activity:", err);
      }
    };
    run();
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafb" }}>
      {/* Sidebar */}
      <Sidebar active="Activity Log" />

      {/* Main Content */}
      <div style={{ flex: 1, background: "#f8fafb" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "32px 48px 0 48px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: "#4caf50",
                margin: 0,
                letterSpacing: 1,
              }}
            >
              Super Admin Panel
            </h1>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "#388e3c",
                marginTop: 8,
              }}
            >
              Activity Log
            </div>
          </div>
          <div style={{ height: 40 }} />
        </div>

        {/* Table Card */}
        <div
          style={{
            margin: "32px 48px",
            background: "#fff",
            borderRadius: 18,
            boxShadow: "0 2px 12px #0001",
            padding: 32,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 18,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 22, color: "#444" }}>
              📝 CommuniSafe Activity Log
            </div>
          </div>

          <div className="activity-log-table-wrapper">
            <table className="activity-log-table" style={{ width: "100%" }}>
              <thead style={{ background: "#e8f5e9" }}>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Role</th>
                  <th>Type</th>
                  <th>Action</th>
                  <th>Platform</th>
                </tr>
              </thead>
              <tbody>
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log._id}>
                      <td>{new Date(log.timestamp).toLocaleString()}</td>
                      <td>{log.user?.name}</td>
                      <td>{log.user?.role}</td>
                      <td>{log.type || "-"}</td>
                      <td>{log.action}</td>
                      <td>{log.platform || "web"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="no-logs">
                      No recent activity yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
