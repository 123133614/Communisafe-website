import { useState } from "react";
import multiico from "../images/multiico.png";

export default function CreateAnnouncementModal({ open, onClose, onPost }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [photo, setPhoto] = useState(null);
  const [urgent, setUrgent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Set current date/time, disable past
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toTimeString().slice(0, 5);

  const handlePhoto = (e) => setPhoto(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // ...upload logic here...
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onPost();
        onClose();
      }, 1200);
    }, 1200);
  };

  if (!open) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <h2 className="modal-title">
          <img src={multiico} alt="icon" style={{ width: 36, marginRight: 12 }} />
          Create Announcement
        </h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Announcement Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            className="modal-input large"
          />
          <textarea
            placeholder="Announcement Details"
            value={body}
            onChange={e => setBody(e.target.value)}
            required
            className="modal-input large"
            rows={4}
          />
          <input
            type="date"
            value={dateStr}
            min={dateStr}
            max={dateStr}
            readOnly
            className="modal-input"
          />
          <input
            type="time"
            value={timeStr}
            min={timeStr}
            max={timeStr}
            readOnly
            className="modal-input"
          />
          <label className="modal-label">
            <input
              type="checkbox"
              checked={urgent}
              onChange={e => setUrgent(e.target.checked)}
            />
            Mark as Urgent
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhoto}
            className="modal-input"
          />
          {photo && (
            <img
              src={URL.createObjectURL(photo)}
              alt="Preview"
              className="modal-photo-preview"
            />
          )}
          <button type="submit" className="modal-submit-btn" disabled={loading}>
            {loading ? "Posting..." : "Post Announcement"}
          </button>
          {success && <div className="modal-success">Announcement posted!</div>}
        </form>
        <button className="modal-close-btn" onClick={onClose}>×</button>
      </div>
    </div>
  );
}