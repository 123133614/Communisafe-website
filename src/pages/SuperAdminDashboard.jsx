import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import multiico from '../images/multiico.png'; // adjust path if needed
import { useNavigate } from "react-router-dom";
import { FiHome, FiUsers, FiUserCheck, FiUserPlus, FiSettings } from 'react-icons/fi';
import UserListTable from './UserListTable';
import axios from 'axios';
import '../css/SuperAdminDashboard.css';

const API_URL = process.env.REACT_APP_API_URL || "https://communisafe-backend.onrender.com";


export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());

  // ── Card counts ──────────────────────────────────────────────
  const [adminCount, setAdminCount] = useState(0);
  const [totalResidentsCount, setTotalResidentsCount] = useState(3000); // fixed
  const [registeredResidentCount, setRegisteredResidentCount] = useState(0);
  const [officialCount, setOfficialCount] = useState(0);


  

  
useEffect(() => {
  const fetchCounts = async () => {
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
  const { data } = await axios.get(`${API_URL}/api/dashboard-cards/counts`, { headers });

  if (data?.admins != null) setAdminCount(data.admins);               // admins only
  if (data?.officials != null) setOfficialCount(data.officials);      // admins + officials
  if (data?.registeredResidents != null) setRegisteredResidentCount(data.registeredResidents);
  setTotalResidentsCount(3000);
} catch (err) {
  console.error("Error fetching dashboard counts:", err?.response?.data || err);
  setAdminCount(0);
  setOfficialCount(0);
  setRegisteredResidentCount(0);
  setTotalResidentsCount(3000);
}

  };

  fetchCounts();
}, []);


  const summaryCards = [
  { label: 'Officials', value: officialCount, color: '#ffe082', icon: <FiUsers size={28} color="#6d4c41" /> }, // admins + officials
  
  { label: 'Total Residents', value: totalResidentsCount, color: '#b9f6ca', icon: <FiUsers size={28} color="#1b5e20" /> },
  { label: 'Registered Residents', value: registeredResidentCount, color: '#b388ff', icon: <FiUserPlus size={28} color="#4527a0" /> },
];


  // Calendar logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  // Build calendar grid
  const weeks = [];
  let day = 1 - firstDay;
  for (let w = 0; w < 6; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      week.push(day > 0 && day <= daysInMonth ? day : '');
      day++;
    }
    weeks.push(week);
    if (day > daysInMonth) break;
  }

  // Calendar navigation
  const prevMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const today = () => setCurrentDate(new Date());
  const todayNum =
    new Date().getMonth() === month && new Date().getFullYear() === year
      ? new Date().getDate()
      : null;

  return (
    <div className="superadmin-dashboard-root">
      <Sidebar active="Dashboard" />
      <div className="superadmin-main-content">
        {/* Top Bar with Logo and Settings */}
        <div className="superadmin-topbar">
          <div className="superadmin-logo-group">
            <img src={multiico} alt="Logo" className="superadmin-logo-img" />
            <span className="superadmin-logo-title">CommuniSafe</span>
          </div>
          
        </div>
        <div className="superadmin-content-wrapper">
          {/* Breadcrumb and Title */}
          <div className="superadmin-breadcrumb">
            <FiHome size={22} color="#444" style={{ marginRight: 8 }} />
            <span className="superadmin-breadcrumb-main">Dashboard</span>
            <span className="superadmin-breadcrumb-sep">&gt;</span>
            <span className="superadmin-breadcrumb-sub">Home</span>
          </div>

          {/* Summary Cards Grid */}
          <div className="superadmin-summary-cards">
            {summaryCards.map((card, i) => (
              <div key={i} className="superadmin-summary-card" style={{ background: card.color }}>
                <div className="superadmin-summary-icon">{card.icon}</div>
                <div className="superadmin-summary-info">
                  <div className="superadmin-summary-label">{card.label}</div>
                  <div className="superadmin-summary-value">{card.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Main Row: User List Table & Calendar */}
          <div className="superadmin-main-row">
            {/* User List Table Section */}
            <div className="superadmin-userlist-section">
              <UserListTable />
            </div>

            {/* Calendar Section */}
            <div className="superadmin-calendar-section">
              <div className="superadmin-calendar-title-row">
                <span className="superadmin-calendar-title">Barangay <span>Calendar</span></span>
              </div>
              <div className="superadmin-calendar-controls">
                <button onClick={prevMonth} className="superadmin-calendar-btn">&lt;</button>
                <span className="superadmin-calendar-month">{monthName} {year}</span>
                <button onClick={nextMonth} className="superadmin-calendar-btn">&gt;</button>
                <button onClick={today} className="superadmin-calendar-today-btn">Today</button>
              </div>
              <table className="superadmin-calendar-table">
                <thead>
                  <tr>
                    <th>Sun</th><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th><th>Sat</th>
                  </tr>
                </thead>
                <tbody>
                  {weeks.map((week, i) => (
                    <tr key={i}>
                      {week.map((d, j) => (
                        <td key={j} className={d === todayNum ? 'superadmin-calendar-today' : d ? 'superadmin-calendar-day' : 'superadmin-calendar-empty'}>
                          {d || ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Card style helper
function cardStyle(active) {
  return {};
}
