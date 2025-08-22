// src/components/FloodReadingsTable.jsx
import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "https://communisafe-backend.onrender.com";

export default function FloodReadingsTable({ sensorId }) {
  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(false);

  const fetchRows = async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (sensorId) params.sensorId = sensorId;
      if (from) params.from = from;
      if (to) params.to = to;
      const res = await axios.get(`${API_URL}/api/flood/readings`, { params, headers });
      setRows(res.data.items || []);
      setPages(res.data.pages || 1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRows(); /* auto-refresh every 30s */ 
    const id = setInterval(fetchRows, 30000);
    return () => clearInterval(id);
  }, [page, limit, from, to, sensorId]);

  const exportCSV = () => {
    const header = ["Date/Time","Sensor","Address","WaterLevel_cm","Battery_%","Signal","Status"];
    const body = rows.map(r => [
      new Date(r.recordedAt).toLocaleString(),
      r.sensor?.name || "",
      r.sensor?.address || "",
      r.waterLevel ?? "",
      r.batteryLevel ?? "",
      r.signalStrength ?? "",
      r.status ?? "",
    ]);
    const csv = [header, ...body].map(a => a.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "flood_readings.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="appr-card" style={{ padding: 16 }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Flood Records</h3>
        <div className="flex gap-2">
          <input type="datetime-local" value={from} onChange={e=>setFrom(e.target.value)} className="text-input" />
          <input type="datetime-local" value={to} onChange={e=>setTo(e.target.value)} className="text-input" />
          <button className="btn-submit" onClick={()=>{ setPage(1); fetchRows(); }}>Filter</button>
          <button className="btn-submit" onClick={exportCSV}>Export CSV</button>
        </div>
      </div>

      <div className="overflow-auto rounded-xl border border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left">Date/Time</th>
              <th className="px-3 py-2 text-left">Sensor</th>
              <th className="px-3 py-2 text-left">Address</th>
              <th className="px-3 py-2 text-right">Water (cm)</th>
              <th className="px-3 py-2 text-right">Battery</th>
              <th className="px-3 py-2 text-left">Signal</th>
              <th className="px-3 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-3 py-4" colSpan={7}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="px-3 py-4" colSpan={7}>No records.</td></tr>
            ) : rows.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="px-3 py-2">{new Date(r.recordedAt).toLocaleString()}</td>
                <td className="px-3 py-2">{r.sensor?.name}</td>
                <td className="px-3 py-2">{r.sensor?.address}</td>
                <td className="px-3 py-2 text-right">{r.waterLevel}</td>
                <td className="px-3 py-2 text-right">{r.batteryLevel ?? "-"}</td>
                <td className="px-3 py-2">{r.signalStrength ?? "-"}</td>
                <td className="px-3 py-2">{r.status ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <span>Rows:</span>
          <select value={limit} onChange={e=>{ setLimit(Number(e.target.value)); setPage(1); }}>
            {[10,20,50,100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="btn-cancel">Prev</button>
          <span>{page} / {pages}</span>
          <button disabled={page>=pages} onClick={()=>setPage(p=>p+1)} className="btn-submit">Next</button>
        </div>
      </div>
    </section>
  );
}
