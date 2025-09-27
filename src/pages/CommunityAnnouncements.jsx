// src/pages/CommunityAnnouncements.jsx
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useDesktopNotification from "../hooks/useDesktopNotification";
import io from "socket.io-client";
import { motion } from "framer-motion";
import axios from "axios";
import multiico from "../images/multiico.png";
import "../css/CommunityAnnouncements.css";

const CATEGORY_OPTIONS = [
  "Community Announcement",
  "Security",
  "Maintenance",
  "Flood",
  "Events",
  "Other",
];

const MULTINATIONAL_STREETS = [
  "Nazareth",
  "Bethlehem",
  "Mt. Olives",
  "Galilee",
  "Corinth",
  "Capernauam",
  "Jericho",
  "Judea ",
  "Tel Aviv",
  "Cairo",
  "Teheran",
  "Jordan",
  "Riyadh",
  "John",
  "Peter",
  "Matthew",
  "Thomas",
  "Timothy",
  "Philip ",
  "Simon",
  "Andrew",
  "Saint Ferrer",
  "St Anthony",
  "Rogationist",
  "John Paul",
];
function formatAuthor(author) {
  const role = (author?.role || '').toLowerCase();
  const name = (author?.name || '').trim();

  if (role === 'official') {
    // show "Official — <name>" only if name is not literally "Official"
    return `Official${name && name.toLowerCase() !== 'official' ? ' — ' + name : ''}`;
  }
  // other roles: "Role — Name" or just "Role"/"Name" when missing
  if (name && role) return `${capitalize(role)} — ${name}`;
  if (role) return capitalize(role);
  if (name) return name;
  return 'User';
}

export default function CommunityAnnouncements() {
  const notify = useDesktopNotification();
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem("role") || "user";
  const token = localStorage.getItem("token");
  const API_URL = (process.env.REACT_APP_API_URL || 'https://communisafe-backend.onrender.com').replace(/\/$/, '');

  // ⬇️ Sidebar Links (same icons/routes; just switched to appr-* classes)
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
      route: role === "resident" ? "/visitor-requests" : "/visitorManagement",
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

  // ─── Announcement State ───
  const [showModal, setShowModal] = useState(false);
  const [announcementText, setAnnouncementText] = useState("");
  const [announcementImage, setAnnouncementImage] = useState(null);
  const [titleInput, setTitleInput] = useState("");
  const [activeAnnouncement, setActiveAnnouncement] = useState(null);
 const [locationInput, setLocationInput] = useState([]);
  const [dateInput, setDateInput] = useState("");
  const [timeInput, setTimeInput] = useState("");
  const [contactInput, setContactInput] = useState("");
  const [categoryInput, setCategoryInput] = useState("");
  const [announcements, setAnnouncements] = useState([]);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // ─── NEW: Reaction + Comments UI State ───
  const [annHearts, setAnnHearts] = useState({ count: 0, mine: false, loading: false });
  const [comments, setComments] = useState([]);
  const [cLoading, setCLoading] = useState(false);
  const [cError, setCError] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState(null); // commentId when replying
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");
  const authHeader = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const [urgent, setUrgent] = useState(false); 



  const addLocation = (loc) => {
  if (!loc) return;
  setLocationInput((prev) =>
    prev.includes(loc) ? prev : [...prev, loc]
  );
};

const removeLocation = (loc) => {
  setLocationInput((prev) => prev.filter((x) => x !== loc));
};
  // ─── Fetch announcements + sockets ───
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await axios.get(`${API_URL}/api/announcements`, {
          headers: authHeader,
        });
        setAnnouncements(res.data);
      } catch {
        setError("Failed to fetch announcements");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnnouncements();

    const socket = io(API_URL, {path: '/socket.io/', transports: ['websocket', 'polling'], auth: { token }, withCredentials: true,});

    socket.on("newAnnouncement", (a) =>
      setAnnouncements((prev) => [a, ...prev])
    );
    socket.on("announcementUpdated", (updated) =>
      setAnnouncements((prev) => prev.map((x) => (x._id === updated._id ? updated : x)))
    );
    socket.on("announcementDeleted", (deletedId) =>
      setAnnouncements((prev) => prev.filter((x) => x._id !== deletedId))
    );
    return () => socket.disconnect();
  }, [token, API_URL, authHeader]);

  // default date/time
  useEffect(() => {
    if (showModal && !editingAnnouncement) {
      const now = new Date();
      setDateInput(now.toISOString().split("T")[0]);
      setTimeInput(now.toTimeString().slice(0, 5));
    }
  }, [showModal, editingAnnouncement]);

  // filters
  const filteredAnnouncements = announcements
  .filter((a) => {
    const aCat = (a.category || '').toLowerCase();
    const pick = (selectedCategory || 'All').toLowerCase();
    const matchesCategory = pick === 'all' || aCat === pick;
    const matchesSearch =
      (a.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  })
  .sort((a, b) => {
    const aUrgent = !!a.urgent || (a.category || "").toLowerCase() === "urgent";
    const bUrgent = !!b.urgent || (b.category || "").toLowerCase() === "urgent";

    if (aUrgent && !bUrgent) return -1;
    if (!aUrgent && bUrgent) return 1;

    // NEW: purely by posted timestamp
    const aDate = new Date(a.createdAt || 0);
    const bDate = new Date(b.createdAt || 0);
    return bDate - aDate;
  });

  // create / update
  const handlePostAnnouncement = async () => {
    if (!titleInput || !announcementText) {
      setError("Title and description are required");
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const formData = new FormData();
      formData.append("title", titleInput);
      formData.append("description", announcementText);
      formData.append("category", categoryInput || "Community Announcement");
     
      formData.append("contact", contactInput);
      formData.append("urgent", urgent ? "true" : "false");

      if (Array.isArray(locationInput) && locationInput.length) {
        formData.append("location", locationInput.join(", "));
      } else if (locationInput) {formData.append("location", String(locationInput));

      }




      if (dateInput) formData.append("date", dateInput);
      if (timeInput) formData.append("time", timeInput);
      
      if (announcementImage) {
        formData.append("image", announcementImage, announcementImage.name || "upload.jpg");}


      let res;
      if (editingAnnouncement) {
        res = await axios.put(`${API_URL}/api/announcements/${editingAnnouncement._id}`,
          formData,
          {
            headers: {
              ...authHeader, },
            }
          );


        setAnnouncements((prev) =>
          prev.map((i) => (i._id === editingAnnouncement._id ? res.data.data : i))
        );
        notify({
          title: "Announcement Updated",
          body: res.data.data.title,
          icon: "/favicon.ico",
          url: "/community-announcements",
        });
      } else {
        res = await axios.post(`${API_URL}/api/announcements`, formData, {
  headers: {
    ...authHeader, // axios will set the correct multipart boundary
  },
});

        setAnnouncements(prev => [res.data.data, ...prev.filter(x => x._id !== res.data.data._id)]);
        notify({
          title: "New Community Announcement",
          body: res.data.data.title,
          icon: "/favicon.ico",
          url: "/community-announcements",
        });
      }

      setShowModal(false);
      setEditingAnnouncement(null);
      setTitleInput("");
      setAnnouncementText("");
      setAnnouncementImage(null);
      setLocationInput([]);
      setDateInput("");
      setTimeInput("");
      setContactInput("");
      setCategoryInput("");
      setUrgent(false);
    } catch (err) {
      console.error('POST ANN ERR:', err.response?.data || err.message);
setError(err.response?.data?.error || err.response?.data?.message || err.message || "Failed to post announcement");

    } finally {
      setIsLoading(false);
    }
  };

  // ────────────────────────────────────────────────
  // NEW: Reactions + Comments (API helpers)
  // ────────────────────────────────────────────────
  const openAnnouncement = async (a) => {
    setActiveAnnouncement(a);
    // load meta + comments
    try {
      setCError(null);
      setCLoading(true);

      axios.put(`${API_URL}/api/announcements/${a._id}/read`, {}, { headers: authHeader });
      const [metaRes, commentsRes] = await Promise.all([
        axios.get(`${API_URL}/api/announcements/${a._id}`, { headers: authHeader }),
        axios.get(`${API_URL}/api/announcements/${a._id}/comments`, { headers: authHeader }),
      ]);
      setAnnHearts({
        count: metaRes.data.heartsCount || 0,
        mine: !!metaRes.data.hasHearted,
        loading: false,
      });
      setComments(commentsRes.data || []);
    } catch (e) {
      setCError(e.response?.data?.error || "Failed to load details");
    } finally {
      setCLoading(false);
    }
  };

  const toggleAnnHeart = async () => {
    if (!activeAnnouncement || annHearts.loading) return;
    try {
      setAnnHearts((s) => ({ ...s, loading: true }));
      const res = await axios.post(
        `${API_URL}/api/announcements/${activeAnnouncement._id}/heart`,
        {},
        { headers: authHeader }
      );
      setAnnHearts({ count: res.data.heartsCount, mine: res.data.hasHearted, loading: false });
    } catch {
      setAnnHearts((s) => ({ ...s, loading: false }));
    }
  };

  const loadComments = async () => {
    if (!activeAnnouncement) return;
    try {
      setCLoading(true);
      const commentsRes = await axios.get(
        `${API_URL}/api/announcements/${activeAnnouncement._id}/comments`,
        { headers: authHeader }
      );
      setComments(commentsRes.data || []);
    } catch (e) {
      setCError(e.response?.data?.error || "Failed to load comments");
    } finally {
      setCLoading(false);
    }
  };

  const postComment = async () => {
    const text = (newComment || "").trim();
    if (!text || !activeAnnouncement) return;
    try {
      setCLoading(true);
      const res = await axios.post(
        `${API_URL}/api/announcements/${activeAnnouncement._id}/comments`,
        { text, parentId: replyTo || null },
        { headers: { "Content-Type": "application/json", ...authHeader } }
      );
      setComments((prev) => [res.data, ...prev]);
      setNewComment("");
      setReplyTo(null);
    } catch (e) {
      setCError(e.response?.data?.error || "Failed to post comment");
    } finally {
      setCLoading(false);
    }
  };

  const startEdit = (comment) => {
    setEditId(comment._id);
    setEditText(comment.text);
  };

  const saveEdit = async () => {
    const text = (editText || "").trim();
    if (!text || !activeAnnouncement || !editId) return;
    try {
      setCLoading(true);
      const res = await axios.put(
        `${API_URL}/api/announcements/${activeAnnouncement._id}/comments/${editId}`,
        { text },
        { headers: { "Content-Type": "application/json", ...authHeader } }
      );
      setComments((prev) => prev.map((c) => (c._id === editId ? res.data : c)));
      setEditId(null);
      setEditText("");
    } catch (e) {
      setCError(e.response?.data?.error || "Failed to update comment");
    } finally {
      setCLoading(false);
    }
  };

  const deleteComment = async (commentId) => {
    if (!activeAnnouncement) return;
    const yes = window.confirm("Delete this comment (and its replies)?");
    if (!yes) return;
    try {
      setCLoading(true);
      await axios.delete(
        `${API_URL}/api/announcements/${activeAnnouncement._id}/comments/${commentId}`,
        { headers: authHeader }
      );
      // remove the comment and any replies referencing parentId
      setComments((prev) =>
        prev.filter((c) => c._id !== commentId && c.parentId !== commentId)
      );
    } catch (e) {
      setCError(e.response?.data?.error || "Failed to delete comment");
    } finally {
      setCLoading(false);
    }
  };

  const toggleCommentHeart = async (commentId) => {
    if (!activeAnnouncement) return;
    try {
      const res = await axios.post(
        `${API_URL}/api/announcements/${activeAnnouncement._id}/comments/${commentId}/heart`,
        {},
        { headers: authHeader }
      );
      setComments((prev) =>
        prev.map((c) =>
          c._id === commentId ? { ...c, heartsCount: res.data.heartsCount, hasHearted: res.data.hasHearted } : c
        )
      );
    } catch {
      // no-op
    }
  };

  // Build threaded view (one level deep)
  const rootComments = useMemo(
    () => comments.filter((c) => !c.parentId),
    [comments]
  );
  const repliesByParent = useMemo(() => {
    const map = {};
    comments.forEach((c) => {
      if (c.parentId) {
        map[c.parentId] = map[c.parentId] || [];
        map[c.parentId].push(c);
      }
    });
    // sort by createdAt asc for readability
    Object.keys(map).forEach((k) =>
      map[k].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    );
    return map;
  }, [comments]);

  return (
    <div className="appr-container">
    
      <aside
        className="appr-sidebar"
        style={{
          backgroundImage: `url(${process.env.PUBLIC_URL}/assets/sidebar.png)`,
        }}
      >
        <nav className="appr-sidebar-nav">
          {sidebarLinks.map((link) => (
            <div
              key={link.label}
              className={`appr-sidebar-link ${
                location.pathname === link.route ? "appr-active" : ""
              }`}
              onClick={() => navigate(link.route)}
            >
              {link.svg}
              <span>{link.label}</span>
            </div>
          ))}
        </nav>
      </aside>

    
      <main className="appr-main">

        <div className="topbar-container">
          <h1 className="topbar-title">Community Announcements</h1>

          <div className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Search"
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <select
              className="category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="All">All</option>
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

       
        {error && <div className="error-banner">{error}</div>}

        <p className="greeting-text">
          Good morning,{" "}
          {role === "official" ? "Admin" : role === "security" ? "Security" : "Resident"}!
        </p>

        {role === "official" && (
          <div className="flex justify-end">
            <button
              onClick={() => {
                setShowModal(true);
                setEditingAnnouncement(null);
                setTitleInput("");
                setAnnouncementText("");
                setAnnouncementImage(null);
                setLocationInput("");
                setDateInput("");
                setTimeInput("");
                setContactInput("");
                setCategoryInput("");
              }}
              className="btn-post"
            >
              + Post Announcement
            </button>
          </div>
        )}

        <div className="announcements-list">
          {filteredAnnouncements
            .filter(
              (a, idx, arr) => arr.findIndex((x) => x._id === a._id) === idx
            )
            .map((a) => (
              <motion.div
                key={a._id}
                className="flex bg-white border-2 rounded-lg shadow p-4 mb-5 items-start hover:shadow-lg cursor-pointer transition-transform transform hover:scale-[1.02]"
               style={{ borderColor: (a.urgent || (a.category || "").toLowerCase() === "urgent")
                  ? "#e53935" : "#388e3c",}}
                onClick={() => openAnnouncement(a)}
              >
                <div className="flex-shrink-0 w-40 h-28 overflow-hidden rounded-md border mr-4">
                  <img src={a.imageUrl || a.image || multiico} alt={a.title}  className="w-full h-full object-cover"/>
                </div>

                <div className="flex flex-col flex-grow">
                  <div className="flex items-center mb-2">
                    <h2 className="text-lg font-bold text-gray-800 mr-2">{a.title}</h2>
                    
                    {(a.urgent || (a.category || "").toLowerCase() === "urgent") && (
                      <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded inline-flex items-center gap-1">
                        <span aria-hidden>❗</span> URGENT
                        </span>)}
                        </div>


                  <p className="text-sm text-gray-700 mb-3 line-clamp-4">
                    {a.description}
                  </p>

                  <div className="flex items-center text-sm mt-auto">
                    <span className="text-green-700 font-semibold mr-4">
                      {a.createdAt ? new Date(a.createdAt).toLocaleString() : '—'}
                      </span>
                      
                
                      {!!a.author && (
  <span className="text-gray-600 mr-4">
    <strong>{formatAuthor(a.author)}</strong>
  </span>
)}


                       {a.location && (
  <span className="flex items-center text-pink-600">
    📍 {Array.isArray(a.location) ? a.location.join(", ") : a.location}
  </span>
)}

                          </div>
                          </div>
              </motion.div>
            ))}
        </div>
      </main>

 
      {activeAnnouncement && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center"
          onClick={() => setActiveAnnouncement(null)}
        >
          <div
            className="modal-details-container"
            onClick={(e) => e.stopPropagation()}
          >
             <h2 className="modal-title">{activeAnnouncement.title}</h2>
             <p className="modal-description">{activeAnnouncement.description}</p>
             
            <div className="modal-image-side">
              <img src={activeAnnouncement.imageUrl || activeAnnouncement.image || multiico}
               alt={activeAnnouncement.title}
                className="w-full h-full object-cover"
                 onError={(e) => { e.target.onerror = null; e.target.src = multiico; }} /></div>


            <div className="modal-content-side">
              <button
                className="modal-close-btn"
                onClick={() => setActiveAnnouncement(null)}
              >
                &times;
              </button>
              <h2 className="modal-title">{activeAnnouncement.title}</h2>
              <p className="modal-category">{activeAnnouncement.category}</p>

              <div className="modal-meta">
                <p>🧑 <strong>Posted by:</strong> <strong>{formatAuthor(activeAnnouncement.author)}</strong></p>

                <p> 🕒 <strong>Posted at:</strong>{" "}
                {activeAnnouncement.createdAt ? new Date(activeAnnouncement.createdAt).toLocaleString() : "—"}
                </p>
                {/* Optional: event details if provided */}
                {activeAnnouncement.location && (
                  <p>📍 <strong>Location:</strong> {activeAnnouncement.location}</p>)}
                  {activeAnnouncement.time && (
                    <p>⏰ <strong>Event Time:</strong> {activeAnnouncement.time}</p>)}
                    {activeAnnouncement.date && (
                       <p>📅 <strong>Event Date:</strong> {activeAnnouncement.date}</p>)}</div>
                       <div className="modal-description">{activeAnnouncement.description}</div>

              {/* NEW: Announcement Reactions */}
              <div className="flex items-center gap-3 mt-3">
                <button
                  onClick={toggleAnnHeart}
                  className={`px-3 py-1 rounded-md border ${
                    annHearts.mine ? "bg-pink-100 border-pink-400" : "bg-white"
                  }`}
                  disabled={annHearts.loading}
                  title={annHearts.mine ? "Remove heart" : "Heart this"}
                >
                  {annHearts.mine ? "💗" : "🤍"} {annHearts.count}
                </button>

                {role === "official" && (
                  <div className="ml-auto modal-actions">
                    <button
                      onClick={() => {
                        setTitleInput(activeAnnouncement.title);
                        setAnnouncementText(activeAnnouncement.description);
                        
                        setDateInput(activeAnnouncement.date);
                        setTimeInput(activeAnnouncement.time);
                        setCategoryInput(activeAnnouncement.category);
                        setAnnouncementImage(null);
                        setEditingAnnouncement(activeAnnouncement);
                        setShowModal(true);
                        setActiveAnnouncement(null);

                        setLocationInput(Array.isArray(activeAnnouncement.location)
                         ? activeAnnouncement.location
                         : activeAnnouncement.location
                         ? String(activeAnnouncement.location)
                         .split(",")
                         .map(s => s.trim())
                         .filter(Boolean)
                         : []);

                        setUrgent(
                          Boolean(activeAnnouncement.urgent) ||
                          ((activeAnnouncement.category || "").toLowerCase() === "urgent"));

                      }}
                      className="btn-edit"
                    >
                      Edit
                    </button>
                    <button
                      onClick={async () => {
                        if (
                          window.confirm(
                            "Are you sure you want to delete this announcement?"
                          )
                        ) {
                          await axios.delete(
                            `${API_URL}/api/announcements/${activeAnnouncement._id}`,
                            { headers: authHeader }
                          );
                          setAnnouncements((prev) =>
                            prev.filter(
                              (item) => item._id !== activeAnnouncement._id
                            )
                          );
                          setActiveAnnouncement(null);
                        }
                      }}
                      className="btn-delete"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>

              

               <div className="comments-section">
        <h3 className="text-lg font-semibold mb-2">Comments</h3>
        {cError && <div className="text-red-600 text-sm mb-2">{cError}</div>}

        {/* Add comment / reply */}
        <div className="mb-3">
          {replyTo && (
            <div className="text-xs text-gray-600 mb-1">
              Replying to a comment •{" "}
              <button onClick={() => setReplyTo(null)} className="underline">
                cancel
              </button>
            </div>
          )}
          <textarea
            rows={3}
            className="w-full border rounded-md p-2 text-sm"
            placeholder="Write a comment…"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={postComment}
              disabled={cLoading || !newComment.trim()}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-60"
            >
              {replyTo ? "Reply" : "Comment"}
            </button>
          </div>
        </div>
                          
        {cLoading && <div className="text-sm">Loading…</div>}
        {!cLoading && rootComments.length === 0 && (
          <div className="text-sm text-gray-500">No comments yet.</div>
        )}

        <div className="comments-list">
          {rootComments.map((c) => (
            <div key={c._id} className="border rounded-md p-3">
              <CommentRow
                c={c}
                onReply={() => {
                  setReplyTo(c._id);
                  document.querySelector("textarea")?.focus();
                }}
                onEdit={() => startEdit(c)}
                onDelete={() => deleteComment(c._id)}
                onHeart={() => toggleCommentHeart(c._id)}
                isEditing={editId === c._id}
                editText={editText}
                setEditText={setEditText}
                saveEdit={saveEdit}
                cancelEdit={() => {
                  setEditId(null);
                  setEditText("");
                }}
              />
              {/* Replies */}
              {(repliesByParent[c._id] || []).map((r) => (
                <div key={r._id} className="ml-6 mt-3 border-l pl-3">
                  <CommentRow
                    c={r}
                    onReply={() => {
                      setReplyTo(r._id);
                      document.querySelector("textarea")?.focus();
                    }}
                    onEdit={() => startEdit(r)}
                    onDelete={() => deleteComment(r._id)}
                    onHeart={() => toggleCommentHeart(r._id)}
                    isEditing={editId === r._id}
                    editText={editText}
                    setEditText={setEditText}
                    saveEdit={saveEdit}
                    cancelEdit={() => {
                      setEditId(null);
                      setEditText("");
                    }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>


        <div className="flex justify-end mt-3">
          <button
            className="text-xs underline"
            onClick={loadComments}
            disabled={cLoading}
            title="Refresh comments"
          >
            Refresh comments
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {showModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div className="modal-form-container relative">
      <button
        className="modal-close-btn"
        onClick={() => {
          setShowModal(false);
          setEditingAnnouncement(null);
        }}
        disabled={isLoading}
      >
        &times;
      </button>

      
<div className="modal-form-image">
  {announcementImage ? (
    <img
      src={URL.createObjectURL(announcementImage)}
      alt="Preview"
      className="modal-img"  
    />
  ) : (
    <label className="upload-dropzone">
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => setAnnouncementImage(e.target.files[0])}
      />
      <span>+ Add Image</span>
    </label>
  )}
</div>



      <div className="modal-form-fields">
        <h2 className="text-2xl font-bold text-green-700 mb-3">
          {editingAnnouncement ? "Update Announcement" : "Post Announcement"}
        </h2>

        <input
          type="text"
          placeholder="Enter Title..."
          className="input-field"
          value={titleInput}
          onChange={(e) => setTitleInput(e.target.value)}
        />

        <select
          value={categoryInput}
          onChange={(e) => setCategoryInput(e.target.value)}
          className="input-field"
        >
          <option value="">Select Category</option>
          {CATEGORY_OPTIONS.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <textarea
          rows={4}
          placeholder="Write Announcement..."
          className="input-field"
          value={announcementText}
          onChange={(e) => setAnnouncementText(e.target.value)}
        />

        <select
          value=""
          onChange={(e) => addLocation(e.target.value)}
          className="input-field"
        >
          <option value="">Add Location…</option>
          {MULTINATIONAL_STREETS.filter((s) => !locationInput.includes(s)).map(
            (street) => (
              <option key={street} value={street}>
                {street}
              </option>
            )
          )}
        </select>

        {locationInput.length > 0 && (
          <div className="mb-2 text-sm">
            <strong>Selected:</strong> {locationInput.join(", ")}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="date"
            className="input-field flex-1"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
          />
          <input
            type="time"
            className="input-field flex-1"
            value={timeInput}
            onChange={(e) => setTimeInput(e.target.value)}
          />
        </div>

        <label className="flex items-center gap-2 mb-3 cursor-pointer">
          <input
            type="checkbox"
            checked={urgent}
            onChange={(e) => setUrgent(e.target.checked)}
            className="w-4 h-4 align-middle"
          />
          <span>{urgent ? "❗ Urgent" : "Mark as Urgent"}</span>
        </label>

        <button
          onClick={handlePostAnnouncement}
          className="btn-submit"
          disabled={isLoading}
        >
          {isLoading
            ? "Posting..."
            : editingAnnouncement
            ? "Update"
            : "Post Announcement"}
        </button>
      </div>

            {isLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center rounded-xl">
                <span className="text-green-700 font-bold text-lg">
                  Posting...
                </span>
              </div>
            )}
            {error && (
              <div className="text-red-600 text-center mt-3">{error}</div>
            )}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg">Loading...</div>
        </div>
      )}
    </div>
  );
}


function CommentRow({
  c,
  onReply,
  onEdit,
  onDelete,
  onHeart,
  isEditing,
  editText,
  setEditText,
  saveEdit,
  cancelEdit,
}) {
  const who =
    (c?.user?.name || "User") +
    (c?.user?.role ? ` • ${capitalize(c.user.role)}` : "");
  const when = c?.createdAt ? new Date(c.createdAt).toLocaleString() : "";

  return (
    <div className="text-sm">
      <div className="flex items-center justify-between">
        <div className="font-medium text-gray-800">{who}</div>
        <div className="text-xs text-gray-500">{when}</div>
      </div>

      {!isEditing ? (
        <div className="mt-1 whitespace-pre-wrap">{c.text}</div>
      ) : (
        <div className="mt-2">
          <textarea
            rows={3}
            className="w-full border rounded-md p-2 text-sm"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={saveEdit}
              className="px-3 py-1 rounded bg-green-600 text-white"
            >
              Save
            </button>
            <button onClick={cancelEdit} className="px-3 py-1 rounded border">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mt-2 text-xs">
        <button
          onClick={onHeart}
          className={`px-2 py-0.5 rounded border ${
            c.hasHearted ? "bg-pink-100 border-pink-400" : "bg-white"
          }`}
          title={c.hasHearted ? "Unheart" : "Heart"}
        >
          {c.hasHearted ? "💗" : "🤍"} {c.heartsCount || 0}
        </button>
        <button onClick={onReply} className="underline">
          Reply
        </button>

        {/* Allow owner or moderators (handled server-side) */}
        <button onClick={onEdit} className="underline">
          Edit
        </button>
        <button onClick={onDelete} className="underline text-red-600">
          Delete
        </button>

        {c.edited && <span className="text-gray-400">(edited)</span>}
      </div>
    </div>
  );
}

function capitalize(s) {
  return (s || "").charAt(0).toUpperCase() + (s || "").slice(1);
}
