// src/components/SidebarOfficial.jsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../css/SidebarOfficial.css";

export default function SidebarOfficial({
  items,
  brand = "CommuniSafe",
  logoSrc,
  hideBrandIcon = false,
  showBrand = false,          // 👈 NEW: control brand row visibility
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems =
    items ||
    [
      { label: "Dashboard", route: "/dashboard", svg: (
          <svg className="offsb-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8v-10h-8v10zm0-18v6h8V3h-8z" />
          </svg>
        ) },
      { label: "Community Announcements", route: "/announcements", svg: (
          <svg className="offsb-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2 9h4l10-5v14l-10-5H2V9zm1 1v4h3v-4H3zm14-2.618L7.8 10H5v2h2.8L18 12.618V7.382z" />
          </svg>
        ) },
      { label: "Flood Tracker", route: "/flood-tracker", svg: (
          <svg className="offsb-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2 14c4-4 8 4 12 0 4-4 8 4 8 4v4H2v-4z" />
            <path d="M2 9c4-4 8 4 12 0 4-4 8 4 8 4v1H2V9z" />
          </svg>
        ) },
      { label: "Incident Report", route: "/incidentreport", svg: (
          <svg className="offsb-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 2h9l5 5v15H6V2zM15 3.5V8h4.5L15 3.5z" />
          </svg>
        ) },
      { label: "Visitor Management", route: "/visitorManagement", svg: (
          <svg className="offsb-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 1.2c-3.6 0-10.8 1.8-10.8 5.4V22h21.6v-3.6c0-3.6-7.2-5.4-10.8-5.4z" />
          </svg>
        ) },
      { label: "Incident Archive", route: "/incidentarchive", svg: (
          <svg className="offsb-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 4h16v2H4zm0 5h16v2H4zm0 5h10v2H4z" />
          </svg>
        ) },
    ];

  const isActive = (route) =>
    location.pathname === route || location.pathname.startsWith(route + "/");

  return (
    <aside
      className={`offsb ${!showBrand ? "offsb--no-brand" : ""}`}  // 👈 modifier class
      style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/assets/sidebar.png)` }}
    >
      {showBrand && (                                              // 👈 hide/show whole brand row
        <div className="offsb-brand">
          {!hideBrandIcon && (logoSrc ? (
            <div className="offsb-logo-wrap">
              <img className="offsb-logo" src={logoSrc} alt="" />
            </div>
          ) : (
            <div className="offsb-logo-wrap">
              <div className="offsb-logo-fallback" />
            </div>
          ))}
          <div className="offsb-brand-name">{brand}</div>
        </div>
      )}

      <nav className="offsb-nav">
        {navItems.map((item) => (
          <div
            key={item.route}
            className={`offsb-link ${isActive(item.route) ? "offsb-active" : ""}`}
            onClick={() => navigate(item.route)}
            title={item.label}
          >
            <span className="offsb-ico-box">{item.svg}</span>
            <span className="offsb-label">{item.label}</span>
          </div>
        ))}
      </nav>
    </aside>
  );
}
