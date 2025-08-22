import { useState, useEffect } from "react";
import axios from "axios";
import { FaUserFriends, FaHome, FaBullhorn, FaWater, FaFileAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function ResidentVisitorRequests() {
  const [requests, setRequests] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    contact: "",
    address: "",
    purpose: "",
    dateOfVisit: "",
    modeOfArrival: "car",
    visitorImage: null,
  });
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "https://communisafe-backend.onrender.com/api/visitors/visitor-requests",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setRequests(res.data);
      } catch (err) {
        console.error("Failed to load requests:", err);
      }
    };
    fetchRequests();
  }, []);

  const handleFileChange = (e) => {
    setForm({ ...form, visitorImage: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.contact || !form.address || !form.purpose || !form.dateOfVisit) {
      alert("Please fill all fields.");
      return;
    }
    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === "visitorImage" && v) fd.append("visitorImage", v);
        else if (v) fd.append(k, v);
      });
      await axios.post(
        "https://communisafe-backend.onrender.com/api/visitors/visitor-requests",
        fd,
        { headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` } }
      );
      alert("Visitor request submitted!");
      setForm({
        fullName: "",
        contact: "",
        address: "",
        purpose: "",
        dateOfVisit: "",
        modeOfArrival: "car",
        visitorImage: null,
      });
    } catch (err) {
      alert("Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white">
      {/* Sidebar (copied from VisitorManagement) */}
      <div className="w-64 bg-white border-r p-4 flex flex-col min-h-screen shadow-lg z-10">
        <h2 className="text-lg font-bold mb-6 text-green-600">Menu</h2>
        <nav className="space-y-2 text-sm font-medium">
          <div
            onClick={() => navigate("/dashboard")}
            className="cursor-pointer hover:text-green-600 p-2 rounded transition"
          >
            Dashboard
          </div>
          <div
            onClick={() => navigate("/announcements")}
            className="cursor-pointer hover:text-green-600 p-2 rounded transition"
          >
            Community Announcements
          </div>
          <div
            onClick={() => navigate("/flood-tracker")}
            className="cursor-pointer hover:text-green-600 p-2 rounded transition"
          >
            Flood Tracker
          </div>
          <div
            onClick={() => navigate("/incidentreport")}
            className="cursor-pointer hover:text-green-600 p-2 rounded transition"
          >
            Incident Report
          </div>
          <a className="block text-green-600 font-bold bg-green-50 p-2 rounded">
            Visitor Requests
          </a>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white relative overflow-auto">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8 border border-green-100 mt-10">
          <h1 className="text-3xl font-extrabold text-green-700 mb-2 text-center drop-shadow">
            Visitor Request Form
          </h1>
          <p className="text-green-700 font-medium mb-6 text-center">
            Fill out the details below to request a visitor QR.
          </p>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Full Name"
              value={form.fullName}
              onChange={e => setForm({ ...form, fullName: e.target.value })}
              className="w-full border rounded p-2 focus:ring-2 focus:ring-green-300 transition"
              required
            />
            <input
              type="text"
              placeholder="Contact"
              value={form.contact}
              onChange={e => setForm({ ...form, contact: e.target.value })}
              className="w-full border rounded p-2 focus:ring-2 focus:ring-green-300 transition"
              required
            />
            <input
              type="text"
              placeholder="Address"
              value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
              className="w-full border rounded p-2 focus:ring-2 focus:ring-green-300 transition"
              required
            />
            <input
              type="text"
              placeholder="Purpose"
              value={form.purpose}
              onChange={e => setForm({ ...form, purpose: e.target.value })}
              className="w-full border rounded p-2 focus:ring-2 focus:ring-green-300 transition"
              required
            />
            <input
              type="datetime-local"
              value={form.dateOfVisit}
              onChange={e => setForm({ ...form, dateOfVisit: e.target.value })}
              className="w-full border rounded p-2 focus:ring-2 focus:ring-green-300 transition"
              required
            />
            <select
              value={form.modeOfArrival}
              onChange={e => setForm({ ...form, modeOfArrival: e.target.value })}
              className="w-full border rounded p-2 focus:ring-2 focus:ring-green-300 transition"
            >
              <option value="car">Car</option>
              <option value="motorcycle">Motorcycle</option>
              <option value="walking">Walking</option>
              <option value="other">Other</option>
            </select>
            <div>
              <label className="block font-semibold mb-1">Visitor Photo (optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full"
              />
              {form.visitorImage && (
                <img
                  src={URL.createObjectURL(form.visitorImage)}
                  alt="Preview"
                  className="w-20 h-20 object-cover rounded mt-2 border mx-auto"
                />
              )}
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-bold shadow transition mt-4"
            >
              {submitting ? "Submitting..." : "Submit Visitor Request"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}