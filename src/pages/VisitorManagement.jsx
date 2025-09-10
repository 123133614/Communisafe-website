
import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaSearch,
  FaPlus,
  FaCar,
  FaMotorcycle,
  FaWalking,
  FaUser,
  FaSignOutAlt,
  FaDownload,
  FaHashtag,
} from "react-icons/fa";
import axios from "axios";
import io from "socket.io-client";
import "../css/VisitorManagement.css";

// ────────────────────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────────────────────
const ARRIVAL_TYPES = [
  { id: "car", label: "Car", icon: <FaCar /> },
  { id: "motorcycle", label: "Motorcycle", icon: <FaMotorcycle /> },
  { id: "walking", label: "Walking", icon: <FaWalking /> },
  { id: "bicycle", label: "Bicycle", icon: <FaWalking /> },
  { id: "other", label: "Other", icon: <FaUser /> },
];

const STATUS_OPTIONS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "inside", label: "Inside" },
  { id: "exited", label: "Exited" },
  { id: "rejected", label: "Rejected" },
];

const DATE_PRESETS = [
  { id: "all", label: "All Dates" },

  { id: "week", label: "This Week" },
];

// ────────────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────────────
export default function VisitorManagement() {
  const navigate = useNavigate();
  const location = useLocation();

  const API_URL =
    process.env.REACT_APP_API_URL ||
    "https://communisafe-backend.onrender.com";

  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role") || "guest";

  const [visitors, setVisitors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [arrivalFilter, setArrivalFilter] = useState("all");
  const [datePreset, setDatePreset] = useState("all");
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [imageModal, setImageModal] = useState({ open: false, src: null });
  const [view, setView] = useState("active"); // 'active' | 'records'
  const [recordsDatePreset, setRecordsDatePreset] = useState("all");

  const [addVisitorModal, setAddVisitorModal] = useState(false);
  const [idImage, setIdImage] = useState(null);
  const [newVisitor, setNewVisitor] = useState({
    name: "",
    resident: localStorage.getItem("name") || "",
    datetime: "",
    purpose: "",
    idPresented: "",
    idImage: null,
    modeOfArrival: "car",
    timeIn: "",
    timeOut: "",
    createdAt: new Date().toISOString(),
  });

  const [exitModalOpen, setExitModalOpen] = useState(false);
  const [exitVisitorNumber, setExitVisitorNumber] = useState("");

  // simple client pagination
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // Sidebar (reuse your Approvals look & routes)
  const sidebarLinks = [
    {
      label: "Dashboard",
      route: "/dashboard",
      svg: (
        <svg
          className="appr-sidebar-icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8v-10h-8v10zm0-18v6h8V3h-8z" />
        </svg>
      ),
    },
    {
      label: "Community Announcements",
      route: "/announcements",
      svg: (
        <svg
          className="appr-sidebar-icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M2 9h4l10-5v14l-10-5H2V9zm1 1v4h3v-4H3zm14-2.618L7.8 10H5v2h2.8L18 12.618V7.382z" />
        </svg>
      ),
    },
    {
      label: "Flood Tracker",
      route: "/flood-tracker",
      svg: (
        <svg
          className="appr-sidebar-icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M2 14c4-4 8 4 12 0 4-4 8 4 8 4v4H2v-4z" />
          <path d="M2 9c4-4 8 4 12 0 4-4 8 4 8 4v1H2V9z" />
        </svg>
      ),
    },
    {
      label: "Incident Report",
      route: "/incidentreport",
      svg: (
        <svg
          className="appr-sidebar-icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M6 2h9l5 5v15H6V2zM15 3.5V8h4.5L15 3.5z" />
        </svg>
      ),
    },
    {
      label: "Visitor Management",
      route: "/visitorManagement",
      svg: (
        <svg
          className="appr-sidebar-icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 1.2c-3.6 0-10.8 1.8-10.8 5.4V22h21.6v-3.6c0-3.6-7.2-5.4-10.8-5.4z" />
        </svg>
      ),
    },
    {
      label: "Approval Accounts",
      route: "/approve-accounts",
      svg: (
        <svg
          className="appr-sidebar-icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 1.2c-3.6 0-10.8 1.8-10.8 5.4V22h21.6v-3.6c0-3.6-7.2-5.4-10.8-5.4z" />
        </svg>
      ),
    },
  ];

  // ─── Socket: live updates when guard scans/updates ───────────────────────
  useEffect(() => {
  const s = io(API_URL, {
    path: "/socket.io/",
    transports: ["websocket", "polling"],
    withCredentials: true,
  });

  const onVisitorScan = async (scannedVisitor) => {
    const visitor = visitors.find((v) => v._id === scannedVisitor._id);
    if (!visitor) return;

    if (!visitor.timeIn) {
      // First scan: Time In
      await markIn(visitor._id);
    } else if (!visitor.timeOut) {
      // Second scan: Time Out
      await markOut(visitor._id);
    }
  };

  s.on("visitor:updated", (updatedVisitor) => {
    console.log("Updated Visitor: ", updatedVisitor);
    setVisitors((prevVisitors) =>
      prevVisitors.map((v) =>
        v._id === updatedVisitor._id ? { ...v, ...updatedVisitor } : v
      )
    );
  });

  s.on("visitor:scanned", onVisitorScan);

  return () => {
    s.off("visitor:scanned", onVisitorScan);
    s.close();
  };
}, [API_URL, visitors]);




  // ─── Fetch all requests (role-aware in your controller) ───────────────────
  const fetchVisitors = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/visitors/visitor-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVisitors(res.data || []);
    } catch (err) {
      console.error("Failed to load visitors:", err);
    }
  };

  useEffect(() => {
    fetchVisitors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_URL]);

  // ─── Helpers ─────────────────────────────────────────────────────────────
  const isExpired = (v) => {
    // consider expired if visit date is in the past and not exited
    const d =
      v.datetime
        ? new Date(v.datetime)
        : v.dateOfVisit
        ? new Date(v.dateOfVisit)
        : null;
    if (!d) return false;
    const endOfDay = new Date(d);
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay < new Date() && v.status !== "exited";
  };

  const statusBadge = (status) => {
    const s = (status || "").toLowerCase();
    const cls =
      s === "inside"
        ? "badge status-inside"
        : s === "approved"
        ? "badge status-approved"
        : s === "pending"
        ? "badge status-pending"
        : s === "rejected"
        ? "badge status-rejected"
        : s === "exited"
        ? "badge status-exited"
        : "badge";
    return <span className={cls}>{status || "-"}</span>;
  };

  const getIdFieldLabel = (mode) => {
    switch (mode) {
      case "car":
      case "motorcycle":
        return "Plate Number";
      case "bicycle":
        return "Bicycle ID";
      case "walking":
        return "ID Number";
      default:
        return "ID / Reference";
    }
  };

  // ─── Filters (search, status, arrival, date preset) ──────────────────────
  const debouncedSearch = useDebounced(searchTerm, 250);

  const filtered = useMemo(() => {
  let x = [...visitors];

  // status
  if (statusFilter !== "all") {
    x = x.filter((v) => (v.status || "").toLowerCase() === statusFilter);
  }

  // arrival
  if (arrivalFilter !== "all") {
    x = x.filter((v) => (v.modeOfArrival || "other") === arrivalFilter);
  }

  // ---- timezone-safe date presets ----
  const now = new Date();

  // helper: turn a Date into a local YYYY-MM-DD key
  const localKey = (d) => {
    if (!d) return null;
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  };

  if (datePreset === "today") {
    const todayKey = localKey(now);
    x = x.filter((v) => {
      const d = v.datetime ? new Date(v.datetime)
        : v.dateOfVisit ? new Date(v.dateOfVisit)
        : null;
      return d && localKey(d) === todayKey;
    });
  } else if (datePreset === "week") {
    // build local week (Mon–Sun) boundaries
    const start = new Date(now);
    const diff = (start.getDay() + 6) % 7; // Monday start
    start.setDate(start.getDate() - diff);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    x = x.filter((v) => {
      const d = v.datetime ? new Date(v.datetime)
        : v.dateOfVisit ? new Date(v.dateOfVisit)
        : null;
      return d && d >= start && d <= end;
    });
  }
  // ------------------------------------

  // search
  const q = (debouncedSearch || "").toLowerCase().trim();
  if (q) {
    x = x.filter((v) => {
      const name = (v.name || v.fullName || "").toLowerCase();
      const resident = (
        v.resident ||
        (v.requestedBy && (v.requestedBy.name || v.requestedBy.fullName)) ||
        ""
      ).toLowerCase();
      const purpose = (v.purpose || "").toLowerCase();
      const number = (v.visitorNumber || "").toLowerCase();
      const idPresented = (v.idPresented || "").toLowerCase();
      return (
        name.includes(q) ||
        resident.includes(q) ||
        purpose.includes(q) ||
        number.includes(q) ||
        idPresented.includes(q)
      );
    });
  }

  return x;
}, [visitors, statusFilter, arrivalFilter, datePreset, debouncedSearch]);


  const records = useMemo(() => {
   let x = visitors.filter((v) => (v.status || "").toLowerCase() === "exited");

   // arrival filter reused
   if (arrivalFilter !== "all") {
     x = x.filter((v) => (v.modeOfArrival || "other") === arrivalFilter);
   }

   // date preset for records
   const now = new Date();
   if (recordsDatePreset === "today") {
     const todayKey = now.toISOString().slice(0, 10);
     x = x.filter((v) => {
       const d = v.datetime ? new Date(v.datetime) : v.dateOfVisit ? new Date(v.dateOfVisit) : null;
       if (!d) return false;
       const key = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
       return key === todayKey;
     });
   } else if (recordsDatePreset === "week") {
     const start = new Date(now);
     const diff = (start.getDay() + 6) % 7; // Monday start
     start.setDate(start.getDate() - diff);
     start.setHours(0, 0, 0, 0);
     const end = new Date(start);
     end.setDate(start.getDate() + 6);
     end.setHours(23, 59, 59, 999);
     x = x.filter((v) => {
       const d = v.datetime ? new Date(v.datetime) : v.dateOfVisit ? new Date(v.dateOfVisit) : null;
       return d && d >= start && d <= end;
     });
   }

   // search reuse
   const q = (debouncedSearch || "").toLowerCase().trim();
   if (q) {
     x = x.filter((v) => {
       const name = (v.name || v.fullName || "").toLowerCase();
      const resident = (
         v.resident ||
         (v.requestedBy && (v.requestedBy.name || v.requestedBy.fullName)) ||
         ""
       ).toLowerCase();
       const purpose = (v.purpose || "").toLowerCase();
       const number = (v.visitorNumber || "").toLowerCase();
       const idPresented = (v.idPresented || "").toLowerCase();
       return name.includes(q) || resident.includes(q) || purpose.includes(q) || number.includes(q) || idPresented.includes(q);
     });
   }
   return x;
 }, [visitors, arrivalFilter, recordsDatePreset, debouncedSearch]);

  // pagination slice
  const dataSource = view === "records" ? records : filtered;
  const pageCount = Math.max(1, Math.ceil(dataSource.length / PAGE_SIZE));
  const paged = dataSource.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    // reset to page 1 whenever filters/search change
    setPage(1);
  }, [statusFilter, arrivalFilter, datePreset, debouncedSearch]);




const markIn = async (visitorId) => {
  try {
    const updated = await axios.put(
      `${API_URL}/api/visitors/visitor-requests/${visitorId}/timein`,
      { timeIn: new Date().toISOString() },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setVisitors((prev) =>
      prev.map((v) =>
        v._id === visitorId
          ? { ...v, entryTime: updated.data.entryTime, status: updated.data.status || 'inside' }
          : v
      )
    );
  } catch (error) {
    console.error("❌ Error marking in:", error);
    alert("Failed to mark in.");
  }
};

const markOut = async (visitorId) => {
  try {
    const updated = await axios.put(
      `${API_URL}/api/visitors/visitor-requests/${visitorId}/timeout`,
      { timeOut: new Date().toISOString() },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setVisitors((prev) =>
      prev.map((v) =>
        v._id === visitorId
          ? { ...v, exitTime: updated.data.exitTime, status: updated.data.status || 'exited' }
          : v
      )
    );
  } catch (error) {
    console.error("❌ Error marking out:", error);
    alert("Failed to mark out.");
  }
};



// The logic to handle QR scan events:
useEffect(() => {
  const s = io(API_URL, {
    path: "/socket.io/",
    transports: ["websocket", "polling"],
    withCredentials: true,
  });

  const onVisitorScan = async (scannedVisitor) => {
    const visitor = visitors.find((v) => v._id === scannedVisitor._id);
    if (!visitor) return;

    if (!visitor.timeIn) {
      // First scan: Time In
      await markIn(visitor._id);
    } else if (!visitor.timeOut) {
      // Second scan: Time Out
      await markOut(visitor._id);
    }
  };

  s.on("visitor:scanned", onVisitorScan);

  return () => {
    s.off("visitor:scanned", onVisitorScan);
    s.close();
  };
}, [API_URL, visitors]);

  const handleAddVisitor = async () => {
    // Walk-in creation using your existing POST route
    const { name, resident, datetime, purpose, idPresented, modeOfArrival, timeIn } =
      newVisitor;
    if (name && resident && datetime && purpose && modeOfArrival && idImage) {
      try {
        const formData = new FormData();
        formData.append("fullName", name);
        formData.append("contact", "");
        formData.append("address", "");
        formData.append("purpose", purpose);
        formData.append("dateOfVisit", datetime);
        formData.append("modeOfArrival", modeOfArrival);
        formData.append("idPresented", idPresented);
        formData.append("timeIn", timeIn || ""); // optional
        formData.append("timeOut", "");
        formData.append("visitorImage", idImage);

        await axios.post(`${API_URL}/api/visitors/visitor-requests`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        });

        setAddVisitorModal(false);
        setIdImage(null);
        setNewVisitor({
          name: "",
          resident: localStorage.getItem("name") || "",
          datetime: "",
          purpose: "",
          idPresented: "",
          idImage: null,
          modeOfArrival: "car",
          timeIn: "",
          timeOut: "",
          createdAt: new Date().toISOString(),
        });

        fetchVisitors();
      } catch (err) {
        console.error(err);
        alert("Failed to save visitor to database.");
      }
    } else {
      alert("Please complete all fields and upload the required image!");
    }
  };

  const exitByNumber = async () => {
    const num = (exitVisitorNumber || "").trim().toUpperCase();
    if (!num) return;
    try {
      const res = await axios.post(
        `${API_URL}/api/visitors/visitor-requests/exit-by-number`,
        { visitorNumber: num },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setExitModalOpen(false);
      setExitVisitorNumber("");
      fetchVisitors();
      alert(res?.data?.message || "Processed.");
    } catch (err) {
      console.error("exitByNumber error:", err);
      alert(
        err?.response?.data?.message || "Failed to process exit by number."
      );
    }
  };

  // ─── CSV Export ──────────────────────────────────────────────────────────
  const exportCSV = (rowsSource = dataSource) =>  {
  const rows = [
    ["Visitor Name", "Resident", "Date of Visit", "Purpose", "Mode of Arrival", "ID/Plate", "Visitor Number", "Status", "Time In", "Time Out"],
    ...rowsSource.map((v) => [
      v.name || v.fullName || "-",
      v.resident || (v.requestedBy && (v.requestedBy.name || v.requestedBy.fullName)) || "-",
      v.datetime ? new Date(v.datetime).toLocaleString() : "-",
      v.purpose || "-",
      v.modeOfArrival || "-",
      v.idPresented || "-",
      v.visitorNumber || "-",
      (v.status || "-").toUpperCase(),
      v.timeIn ? new Date(v.timeIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-",
      v.timeOut ? new Date(v.timeOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-",
    ]),
  ];
  const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `visitor_logs_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};


  // ─── UI helpers ──────────────────────────────────────────────────────────
  const openVisitorDetails = (visitor) => setSelectedVisitor(visitor);
  const closeVisitorDetails = () => setSelectedVisitor(null);
  const openImageModal = (src) => setImageModal({ open: true, src });
  const closeImageModal = () => setImageModal({ open: false, src: null });

  const openAddVisitor = () => {
    setNewVisitor({
      name: "",
      resident: localStorage.getItem("name") || "",
      datetime: "",
      purpose: "",
      idPresented: "",
      idImage: null,
      modeOfArrival: "car",
      timeIn: "",
      timeOut: "",
      createdAt: new Date().toISOString(),
    });
    setIdImage(null);
    setAddVisitorModal(true);
  };
  const closeAddVisitor = () => setAddVisitorModal(false);

  // ─── Render ──────────────────────────────────────────────────────────────
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
        {/* Header */}
        <header className="appr-header">
          <h1>{view === "records" ? "Visitor Records (Exited)" : "Visitor Management"}</h1>
          {/* View switch: Active vs Records */}
          <div className="segmented"></div>
          <button className={`seg-btn ${view === "active" ? "active" : ""}`}  onClick={() => { setView("active"); setDatePreset("all"); }}>
              Active
              </button>
           <button className={`seg-btn ${view === "records" ? "active" : ""}`} onClick={() => { setView("records"); setRecordsDatePreset("all"); }}
            >
               Records
                </button>

          <div className="appr-actions">
            {/* Search */}
            <div className="appr-search">
              <input
                type="text"
                placeholder="Search name / resident / purpose / number…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="search-icon-btn" aria-label="search">
                <FaSearch size={16} />
              </button>
            </div>

            {/* Filters */}
            <div className="vm-filters">
              <select
                className="vm-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                title="Status"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <select
                className="vm-select"
                value={arrivalFilter}
                onChange={(e) => setArrivalFilter(e.target.value)}
                title="Arrival"
              >
                <option value="all">All Modes</option>
                {ARRIVAL_TYPES.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>

              <select
                className="vm-select"
                value={view === "records" ? recordsDatePreset : datePreset}
                onChange={(e) =>
                   view === "records" ? setRecordsDatePreset(e.target.value) : setDatePreset(e.target.value)}
                   
                title="Dates"
              >
                {DATE_PRESETS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Buttons */}
            <button className="btn-secondary" onClick={() => exportCSV()} title="Download CSV">
              <FaDownload style={{ marginRight: 6 }} /> Export
            </button>

            <button className="btn-secondary" onClick={() => setExitModalOpen(true)} title="Exit by Number">
              <FaHashtag style={{ marginRight: 6 }} /> Exit by #
            </button>

          
          </div>
        </header>

        {/* Table */}
       <section className="appr-card">
  <div className="table-wrapper">
    <table className="visitor-table">
      <thead>
        <tr>
          <th>Visitor</th>
          <th>Resident</th>
          <th>Visit Date</th>
          <th>Purpose</th>
          {/* <th>ID/Plate</th> */}
          <th>Mode</th>
          <th>Number</th>
          <th>Status</th>
          <th>Time In</th>
          <th>Time Out</th>
          <th className="text-center">Actions</th>
        </tr>
      </thead>
      <tbody>
        {paged.map((v) => {
  const visitDate = v.datetime ? new Date(v.datetime) : v.dateOfVisit ? new Date(v.dateOfVisit) : null;
  
  // Log the entryTime and exitTime to debug the issue
  const entryTime = new Date(v.entryTime);  // Convert entryTime to Date
  console.log("Entry Time: ", entryTime);   // Check the value in the local timezone
  
  const exitTime = new Date(v.exitTime);  // Convert exitTime to Date
  console.log("Exit Time: ", exitTime);   // Check the value in the local timezone

  const expired = isExpired(v);
  return (
    <tr key={v._id} className={expired ? "row-expired" : ""}>
      <td>{v.name || v.fullName || "-"}</td>
      <td>{v.resident || (v.requestedBy && (v.requestedBy.name || v.requestedBy.fullName)) || "-"}</td>
      <td>{visitDate ? visitDate.toLocaleString() : "-"}</td>
      <td>{v.purpose || "-"}</td>
      {/* <td>{v.idPresented || "-"}</td> */}
      <td>{v.modeOfArrival || "-"}</td>
      <td>{v.visitorNumber ? <span className="badge badge-number">#{v.visitorNumber}</span> : <span className="text-muted">—</span>}</td>
      <td>{statusBadge(v.status)}</td>
      
      
      <td className="text-center">
      {v.entryTime ? (
      <span className="time-badge in">
      {new Date(v.entryTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </span>
    ) : <span>-</span>}
    </td>
    
    <td className="text-center">
    {v.exitTime ? (
    <span className="time-badge out">
    {new Date(v.exitTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
    </span>
  ) : <span>-</span>}
  </td>
   <td className="text-center">
    <button onClick={() => openVisitorDetails(v)} className="btn-view-details">
          View
        </button>
      </td>
    </tr>
  );
})}

               {paged.length === 0 && (
               <tr>
               <td colSpan="11" className="no-data">
               {view === "records"
                ? "No exited visitors in this range."
                 : (datePreset !== "all"
                   ? "No visitors match the current filters. Try switching Dates to ‘All Dates’."
                    : "No visitors found.")}
                     </td>
                     </tr>
                     )}

              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="vm-pagination">
            <button
              className="vm-page-btn"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ‹ Prev
            </button>
            <span className="vm-page-info">
              Page {page} of {pageCount}
            </span>
            <button
              className="vm-page-btn"
              disabled={page >= pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            >
              Next ›
            </button>
          </div>
        </section>

        {/* Image Modal */}
        {imageModal.open && imageModal.src && (
          <div className="modal-backdrop" onClick={closeImageModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <img
                src={imageModal.src}
                alt="ID/Plate Large"
                style={{ width: "100%", height: "auto", borderRadius: 12 }}
                onError={(e) => {
                  e.currentTarget.src = `${API_URL}/uploads/placeholder.png`;
                }}
              />
              <button className="btn-close-modal" onClick={closeImageModal}>
                Close
              </button>
            </div>
          </div>
        )}

       {/* Visitor Details Modal */}
{selectedVisitor && (
  <div
    className="modal-backdrop"
    onClick={closeVisitorDetails}
    aria-hidden="true"
  >
    <div
      className="modal-card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="visitor-modal-title"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Close (X) */}
      <button
        className="modal-close"
        aria-label="Close"
        onClick={closeVisitorDetails}
      >
        ×
      </button>

      {/* Header */}
      <header className="modal-header">
        <div className="modal-avatar">
          {(selectedVisitor.name || selectedVisitor.fullName || "?")
            .slice(0, 1)
            .toUpperCase()}
        </div>
        <div className="modal-header-text">
          <h2 id="visitor-modal-title" className="modal-title">
            {selectedVisitor.name || selectedVisitor.fullName}
          </h2>
          <div className="modal-subtitle">
            {statusBadge(selectedVisitor.status)}
            <span className="dot-sep" />
            <span className="muted">
              {new Date(
                selectedVisitor.datetime || selectedVisitor.dateOfVisit
              ).toLocaleString()}
            </span>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="modal-body">
        {/* left column */}
        <dl className="details-grid">
          <div className="row">
            <dt>Resident</dt>
            <dd>
              {selectedVisitor.resident ||
                (selectedVisitor.requestedBy &&
                  (selectedVisitor.requestedBy.name ||
                    selectedVisitor.requestedBy.fullName)) ||
                "-"}
            </dd>
          </div>

          <div className="row">
            <dt>Purpose</dt>
            <dd>{selectedVisitor.purpose || "-"}</dd>
          </div>

          <div className="row">
            <dt>Mode of Arrival</dt>
            <dd className="cap">{selectedVisitor.modeOfArrival}</dd>
          </div>

          {/* <div className="row">
            <dt>{getIdFieldLabel(selectedVisitor.modeOfArrival)}</dt>
            <dd>{selectedVisitor.idPresented || "-"}</dd>
          </div> */}

          <div className="row">
            <dt>Visitor Number</dt>
            <dd>
              {selectedVisitor.visitorNumber ? (
                <span className="badge badge-number">#{selectedVisitor.visitorNumber}</span>
              ) : (
                "—"
              )}
            </dd>
          </div>

          <div className="row">
            <dt>Time In</dt>
            <dd>
              {selectedVisitor.entryTime
                ? new Date(selectedVisitor.entryTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—"}
            </dd>
          </div>

          <div className="row">
            <dt>Time Out</dt>
            <dd>
              {selectedVisitor.exitTime
                ? new Date(selectedVisitor.exitTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—"}
            </dd>
          </div>
        </dl>

        {/* right column (image) */}
        {selectedVisitor.visitorImage && (
          <div className="modal-photo-wrap">
            <img
              className="modal-photo"
              src={`${API_URL}/uploads/${selectedVisitor.visitorImage}`}
              alt="ID/Plate"
              onClick={() =>
                openImageModal(`${API_URL}/uploads/${selectedVisitor.visitorImage}`)
              }
            />
            <span className="photo-hint">Tap to zoom</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="modal-footer">
        <button className="btn-secondary" onClick={closeVisitorDetails}>
          Close
        </button>
      </footer>
    </div>
  </div>
)}


        {/* Add Visitor (Walk-In) Modal */}
        {addVisitorModal && (
          <div className="modal-backdrop" onClick={closeAddVisitor}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2 className="modal-title">Add Walk-In Visitor</h2>

              <div className="form-grid">
                <div className="form-row">
                  <label>Visitor Name</label>
                  <input
                    type="text"
                    value={newVisitor.name}
                    onChange={(e) =>
                      setNewVisitor({ ...newVisitor, name: e.target.value })
                    }
                  />
                </div>

                <div className="form-row">
                  <label>Purpose</label>
                  <input
                    type="text"
                    value={newVisitor.purpose}
                    onChange={(e) =>
                      setNewVisitor({ ...newVisitor, purpose: e.target.value })
                    }
                  />
                </div>

                <div className="form-row">
                  <label>Date & Time of Visit</label>
                  <input
                    type="datetime-local"
                    value={newVisitor.datetime}
                    onChange={(e) =>
                      setNewVisitor({ ...newVisitor, datetime: e.target.value })
                    }
                  />
                </div>

                <div className="form-row">
                  <label>Mode of Arrival</label>
                  <select
                    value={newVisitor.modeOfArrival}
                    onChange={(e) =>
                      setNewVisitor({
                        ...newVisitor,
                        modeOfArrival: e.target.value,
                      })
                    }
                  >
                    {ARRIVAL_TYPES.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <label>{getIdFieldLabel(newVisitor.modeOfArrival)}</label>
                  <input
                    type="text"
                    value={newVisitor.idPresented}
                    onChange={(e) =>
                      setNewVisitor({
                        ...newVisitor,
                        idPresented: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-row">
                  <label>ID/Plate Photo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setIdImage(f);
                        setNewVisitor({ ...newVisitor, idImage: f });
                      }
                    }}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn-secondary" onClick={closeAddVisitor}>
                  Cancel
                </button>
                <button className="btn-add-visitor" onClick={handleAddVisitor}>
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Exit by Number Modal */}
        {exitModalOpen && (
          <div className="modal-backdrop" onClick={() => setExitModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2 className="modal-title">
                Time Out by Number Token
              </h2>
              <p className="text-muted" style={{ marginBottom: 12 }}>
                Guards can type the given number token (e.g. <strong>A1234</strong>) to mark the visitor’s exit.
              </p>
              <input
                type="text"
                placeholder="Enter visitor number (e.g., A1234)"
                value={exitVisitorNumber}
                onChange={(e) => setExitVisitorNumber(e.target.value)}
                style={{ width: "100%", padding: 10, marginBottom: 12 }}
              />
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setExitModalOpen(false)}>
                  Cancel
                </button>
                <button className="btn-out" onClick={exitByNumber}>
                  <FaSignOutAlt style={{ marginRight: 6 }} />
                  Time Out
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


function csvEscape(s) {
  const str = `${s ?? ""}`;
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function useDebounced(value, delay = 300) {
  const [v, setV] = useState(value);
  const tRef = useRef();
  useEffect(() => {
    clearTimeout(tRef.current);
    tRef.current = setTimeout(() => setV(value), delay);
    return () => clearTimeout(tRef.current);
  }, [value, delay]);
  return v;
}
