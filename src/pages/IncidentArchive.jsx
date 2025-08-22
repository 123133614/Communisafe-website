// src/pages/IncidentArchive.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import "../css/IncidentArchive.css";          // has .appr-container, .appr-main, table styles
import SidebarOfficial from "../pages/SidebarOfficial";

const API_URL =
  process.env.REACT_APP_API_URL || "https://communisafe-backend.onrender.com";

  axios.defaults.baseURL = API_URL;

  const photoUrlFromKey = (key) =>
  key
    ? `${API_URL}/api/files/signed-url?key=${encodeURIComponent(key)}`
    : `${process.env.PUBLIC_URL}/assets/multiico.png`;


export default function IncidentArchive() {
  const [archived, setArchived] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchResolved = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/api/incidents/archive`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setArchived(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Error fetching archive:", err);
      }
    };
    fetchResolved();
  }, []);

  // Filter only resolved/solved, then apply search
  const filteredArchived = archived
    .filter((i) => {
      const s = (i.status || "").toLowerCase();
      return s === "resolved" || s === "solved";
    })
    .filter((i) =>
      `${i.type} ${i.location} ${i.description || ""}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );

  const closeModal = () => setSelectedIncident(null);

  return (
    <div className="appr-container">
     
      <SidebarOfficial />

      {/* Main */}
      <main className="appr-main">
        <div className="ia-header-row">
          <h2 className="ia-page-title">Archived Incident Reports</h2>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search"
            className="ia-search-input"
          />
        </div>

        <section className="appr-card">
          <div className="ia-table-wrap">
            <table className="ia-table">
              <thead>
                <tr>
                  <th>Incident</th>
                  <th>Location</th>
                  <th>Description</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredArchived.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="ia-empty">
                      No archived incidents.
                    </td>
                  </tr>
                ) : (
                  filteredArchived.map((inc) => {
                    const dt = inc.createdAt
                      ? new Date(inc.createdAt).toLocaleString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : inc.date || "—";

                    return (
                      <tr key={inc._id}>
                        <td>
                          <div className="ia-primary">{inc.type || "—"}</div>
                          <div className="ia-sub">by {inc.name || "Unknown"}</div>
                        </td>
                        <td>{inc.location || "—"}</td>
                        <td className="appr-desc">{inc.description || "—"}</td>
                        <td>{dt}</td>
                        <td>
                          <span className="ia-status ia-status-resolved">
                            {inc.status
                              ? inc.status.charAt(0).toUpperCase() + inc.status.slice(1)
                              : "Resolved"}
                          </span>
                        </td>
                        <td className="appr-actions-cell">
                          <button
                            className="appr-btn appr-btn--approve"
                            onClick={() => setSelectedIncident(inc)}
                          >
                            View Incident
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Modal */}
{selectedIncident && (
  <div className="modal-backdrop" onClick={closeModal}>
    <div className="ia-modal" onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div className="ia-modal-header">
        <div>
          <h2 className="ia-modal-title">
            {selectedIncident.type || "Incident"}
          </h2>
          <div className="ia-modal-subtitle">
            Resolved case details
          </div>
        </div>
        <button
          className="ia-modal-x"
          aria-label="Close"
          onClick={closeModal}
        >
          ×
        </button>
      </div>

      {/* Body */}
      <div className="ia-modal-body">
        {/* Left: Details */}
        <div className="ia-modal-details">
          <dl>
            <div className="row">
              <dt>Location</dt>
              <dd>{selectedIncident.location || "—"}</dd>
            </div>
            <div className="row">
              <dt>Description</dt>
              <dd>{selectedIncident.description || "—"}</dd>
            </div>
            <div className="row">
              <dt>Date</dt>
              <dd>
                {selectedIncident.createdAt
                  ? new Date(selectedIncident.createdAt).toLocaleString()
                  : selectedIncident.date || "—"}
              </dd>
            </div>
            <div className="row">
              <dt>Status</dt>
              <dd className="badge">
                {selectedIncident.status
                  ? selectedIncident.status.charAt(0).toUpperCase() +
                    selectedIncident.status.slice(1)
                  : "Resolved"}
              </dd>
            </div>
            <div className="row">
              <dt>Reported By</dt>
              <dd>{selectedIncident.name || "Anonymous"}</dd>
            </div>
            <div className="row">
              <dt>Contact</dt>
              <dd>{selectedIncident?.contact || "N/A"}</dd>
            </div>
          </dl>
        </div>

        {/* Right: Photos */}
        <div className="ia-modal-photos">
          <div className="section-title">Attached Photos</div>
          {selectedIncident.photos?.length > 0 ? (
            <div className="photo-grid">
              {selectedIncident.photos.map((p, i) => {
                const url = photoUrlFromKey(p);
                return (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="photo-link"
                    title="Open full size"
                  >
                    <img
                      src={url}
                      alt={`incident-${i}`}
                      onError={(e) => {
                        e.currentTarget.src = `${process.env.PUBLIC_URL}/assets/multiico.png`;
                      }}
                    />
                  </a>
                );
              })}
            </div>
          ) : (
            <div className="empty-photos">No photos attached.</div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="ia-modal-footer">
        <button className="btn-close-modal" onClick={closeModal}>
          Close
        </button>
      </div>
    </div>
        </div>
      )}
    </div>
  );
}
