// src/screens/HelpFAQs.jsx
import React from "react";
import { FiArrowLeft } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import "../css/HelpFAQs.css";

export default function HelpFAQs() {
  const navigate = useNavigate();

  return (
    <div className="help-container">
      <button onClick={() => navigate(-1)} className="back-button">
        <FiArrowLeft /> Back to Dashboard
      </button>

      <div className="help-card">
        <h1 className="help-title">Help & FAQs</h1>

        <h2>📣 Community Announcements</h2>
        <p><strong>Q:</strong> Who can post announcements?<br />
          <strong>A:</strong> Only community officials can post announcements. Residents and security personnel can view them.</p>
        <p><strong>Q:</strong> Can I filter announcements?<br />
          <strong>A:</strong> Yes, announcements can be filtered by category such as flood, safety, and events.</p>

        <h2>🌊 Flood Tracker</h2>
        <p><strong>Q:</strong> Where does the flood data come from?<br />
          <strong>A:</strong> Flood levels are recorded using IoT-based ultrasonic sensors and updated in real time.</p>
        <p><strong>Q:</strong> Can I report a flood manually?<br />
          <strong>A:</strong> Yes, use the “Report Flood” button to submit flood alerts with location and water level.</p>

        <h2>🚨 Incident Reporting</h2>
        <p><strong>Q:</strong> Who can report incidents?<br />
          <strong>A:</strong> Any registered user (Resident, Security, or Official) can file a report.</p>
        <p><strong>Q:</strong> How are incidents reviewed?<br />
          <strong>A:</strong> Officials receive alerts and may update the status to “Responding” or “Resolved.”</p>

        <h2>🧾 Visitor Management</h2>
        <p><strong>Q:</strong> How do I register a visitor?<br />
          <strong>A:</strong> Go to the Visitor Management tab and fill out the visitor form with purpose, date, and arrival mode.</p>
        <p><strong>Q:</strong> What if the guard doesn't have a device?<br />
          <strong>A:</strong> The system generates printable or SMS logs that guards can use manually to verify entry.</p>

        <h2>📱 SOS Alerts</h2>
        <p><strong>Q:</strong> How do I send an SOS alert?<br />
          <strong>A:</strong> Go to the Incident Report screen and tap the SOS button. Trusted contacts will be notified with your live location.</p>
        <p><strong>Q:</strong> Can I cancel the SOS?<br />
          <strong>A:</strong> Yes, tap “Safe Now” to end live tracking and notify your contacts.</p>

        <h2>👤 Account & Profile</h2>
        <p><strong>Q:</strong> How do I edit my profile?<br />
          <strong>A:</strong> Go to “Personal Info” and click “Edit” to update your contact info or address.</p>
        <p><strong>Q:</strong> I forgot my password. What do I do?<br />
          <strong>A:</strong> Use the “Forgot Password” option in the login screen. A reset link will be sent to your email.</p>
      </div>
    </div>
  );
}
