// src/pages/EditProfile.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import "../css/EditProfile.css";

const API_URL = (process.env.REACT_APP_API_URL || "https://communisafe-backend.onrender.com").replace(/\/$/, "");
const token = localStorage.getItem("token");

export default function EditProfile() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    contactNumber: "",
    address: "",
  });
  const [profileImage, setProfileImage] = useState(""); // signed URL from backend (or fallback)
  const [loading, setLoading] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const [error, setError] = useState("");

  // on mount, load profile from cloud
  useEffect(() => {
    (async () => {
      try {
        setError("");
        const res = await fetch(`${API_URL}/api/profile/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load profile");

        setFormData({
          name: data.name || "",
          contactNumber: data.contactNumber || "",
          address: data.address || "",
        });
        setProfileImage(data.imageUrl || "");
      } catch (e) {
        // fallback to localStorage if needed
        setFormData({
          name: localStorage.getItem("name") || "",
          contactNumber: localStorage.getItem("contactNumber") || "",
          address: localStorage.getItem("address") || "",
        });
        setProfileImage(localStorage.getItem("profileImage") || "");
        setError(e.message || "Failed to load profile");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // handle image upload to S3
  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImgLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("image", file);

      const res = await fetch(`${API_URL}/api/profile/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error || "Failed to upload image");

      setProfileImage(out.imageUrl); // signed url from backend
    } catch (err) {
      setError(err.message || "Failed to upload image");
      alert(err.message || "Failed to upload image");
    } finally {
      setImgLoading(false);
    }
  };

  // save textual fields to cloud
  const handleSave = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/profile/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error || "Failed to update profile");

      alert("Profile updated!");
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Failed to update profile");
      alert(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const avatarSrc =
    profileImage ||
    "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg";

  return (
    <div className="edit-profile-container">
      <button onClick={() => navigate(-1)} className="back-button">
        <FiArrowLeft />
        Back to Settings
      </button>

      <div className="edit-card">
        <h2 className="edit-title">Edit Personal Info</h2>

        {error && <div className="text-red-600 text-sm mb-3">{error}</div>}

        <div className="avatar-section">
          <div className="avatar-frame">
            <img
              src={avatarSrc}
              alt="Profile"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src =
                  "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg";
              }}
            />
          </div>
          <label className="image-input">
            <input type="file" accept="image/*" onChange={handleImageChange} />
            <span className="btn btn-primary">
              {imgLoading ? "Uploading..." : "Change Avatar"}
            </span>
          </label>
        </div>

        <div className="form-fields">
          <div>
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
          </div>
          <div>
            <label>Contact Number</label>
            <input
              type="text"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
            />
          </div>
          <div>
            <label>Home Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
            />
          </div>
          <button
            onClick={handleSave}
            disabled={loading}
            className="btn btn-success"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
