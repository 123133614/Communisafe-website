// src/screens/PersonalInfo.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import "../css/PersonalInfo.css";


export default function PersonalInfo() {
  const [userInfo, setUserInfo] = useState({
    name: "",
    email: "",
    role: "",
    contactNumber: "",
    address: "",
  });
  const [profileImage, setProfileImage] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    setUserInfo({
      name: localStorage.getItem("name") || "N/A",
      email: localStorage.getItem("email") || "N/A",
      role: localStorage.getItem("role") || "N/A",
      contactNumber: localStorage.getItem("contactNumber") || "N/A",
      address: localStorage.getItem("address") || "N/A",
    });
    setProfileImage(localStorage.getItem("profileImage") || "");
  }, []);

  return (
    <div className="personal-info-container">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-green-600 font-semibold mb-4"
      >
        <FiArrowLeft />
        Back to Dashboard
      </button>

      <div className="card">
        {/* IMAGE SLOT */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-green-400">
            <img
              src={
                profileImage ||
                "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
              }
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-4 text-green-600">
          Personal Information
        </h2>
        <p>
          <strong>Full Name:</strong> {userInfo.name}
        </p>
        <p>
          <strong>Email:</strong> {userInfo.email}
        </p>
        <p>
          <strong>Role:</strong> {userInfo.role}
        </p>
        <p>
          <strong>Contact Number:</strong> {userInfo.contactNumber}
        </p>
        <p>
          <strong>Address:</strong> {userInfo.address}
        </p>
      </div>
    </div>
  );
}
