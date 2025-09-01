// src/components/FloodReportsTable.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "https://communisafe-backend.onrender.com";

function formatTimestamp(isoString) {
  if (!isoString) return "N/A";
  const d = new Date(isoString);
  return d.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", hour12: true });
}

function SeverityBadge({ value }) {
  const v = (value || "").toUpperCase();
  const color =
    v === "HIGH" ? "#ef4444" : v === "MEDIUM" ? "#f59e0b" : v === "LOW" ? "#3b82f6" : "#6b7280";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        background: `${color}20`,
        color,
      }}
    >
      {v || "N/A"}
    </span>
  );
}

export default function FloodReportsTable() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  const token = localStorage.getItem("token");

  const load = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/flood/reports`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      // Sort newest first
      const items = (res.data || []).slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setReports(items);
    } catch (e) {
      console.error("Failed to load flood reports:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Optional: auto-refresh every 15s
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return reports;
    return reports.filter((r) =>
      [
        r.location,
        r.description,
        r.severity,
        r.contact,
        r.lat?.toString(),
        r.lng?.toString(),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [reports, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const slice = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  return (
    <section className="appr-card" style={{ padding: 16 }}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="text-lg font-semibold text-gray-700">🚨 Reported Flood Incidents</h2>
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search location / severity / desc..."
            className="text-input"
            style={{ minWidth: 260 }}
          />
          <button className="btn-submit" onClick={load}>Refresh</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="appr-table" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Date & Time</th>
              <th style={{ textAlign: "left" }}>Location</th>
              <th style={{ textAlign: "left" }}>Severity</th>
              <th style={{ textAlign: "left" }}>Description</th>
              <th style={{ textAlign: "left" }}>Reported by</th>
              <th style={{ textAlign: "left" }}>Contact</th>
              <th style={{ textAlign: "left" }}>Lat, Lng</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: 16, textAlign: "center", color: "#6b7280" }}>
                  Loading…
                </td>
              </tr>
            ) : slice.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 16, textAlign: "center", color: "#6b7280" }}>
                  No reports found.
                </td>
              </tr>
            ) : (
              slice.map((r, idx) => (
                <tr key={`${r._id || idx}`}>
                  <td>{formatTimestamp( r.timestamp || r.createdAt || r.reportedAt || r.time || r.date)}</td>
                  <td style={{ maxWidth: 280 }}>
                    <div className="truncate" title={r.location}>{r.location || "—"}</div>
                  </td>
                  <td><SeverityBadge value={r.severity} /></td>
                  <td style={{ maxWidth: 380 }}>
                    <div className="truncate" title={r.description}>{r.description || "—"}</div>
                  </td>
                  <td>{ r.reporterUsername || r.username ||  r.reporterName || (r.reporter && (r.reporter.username || r.reporter.name)) || (r.createdBy && (r.createdBy.username || r.createdBy.name)) || "—"  }</td>
                  <td>{r.contact || r.contactNumber || r.phone || r.reporterContact || (r.reporter && r.reporter.contact) || "—"}</td>
                  <td>
                    {typeof r.lat !== "undefined" && typeof r.lng !== "undefined"
                      ? `${parseFloat(r.lat).toFixed(5)}, ${parseFloat(r.lng).toFixed(5)}`
                      : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-3">
        <span className="text-sm text-gray-600">
          Showing {(pageSafe - 1) * PAGE_SIZE + 1}–
          {Math.min(pageSafe * PAGE_SIZE, filtered.length)} of {filtered.length}
        </span>
        <div className="flex items-center gap-2">
          <button
            className="btn-cancel"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={pageSafe <= 1}
          >
            Prev
          </button>
          <span className="text-sm">
            Page {pageSafe} / {totalPages}
          </span>
          <button
            className="btn-submit"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={pageSafe >= totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
