// src/pages/Signup.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../css/Signup.css";

import multiico from "../images/multiico.png";
import multibg from "../images/multibg.png";
import resiIcon from "../images/resi.png";
import secuIcon from "../images/secu.png";
import villadIcon from "../images/villad.png";

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    contactNumber: "",
    address: "",
    role: "official",
    verificationCode: "",
    employeeID: "",
    file: null,
  });

  const [message, setMessage] = useState("");
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "contactNumber") {
      const numeric = value.replace(/\D/g, "");
      setFormData((f) => ({ ...f, [name]: numeric }));
    } else {
      setFormData((f) => ({ ...f, [name]: value }));
    }
  };

  const handleFileChange = (e) => {
    setFormData((f) => ({ ...f, file: e.target.files[0] }));
  };

  const handleRoleChange = (role) => {
    setFormData({
      name: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      contactNumber: "",
      address: "",
      role,
      verificationCode: "",
      employeeID: "",
      file: null,
    });
    setMessage("");
    setCountdown(0);
  };

  const sendCode = async () => {
    if (!formData.email) {
      setMessage("Please enter your email first.");
      return;
    }
    try {
      await axios.post("https://communisafe-backend.onrender.com/api/auth/send-verification-code", {
        email: formData.email,
      });
      setMessage("Verification code sent. Check your email.");
      setCountdown(60);
    } catch (err) {
      console.error("sendCode error:", err.response || err.message);
      setMessage("Failed to send code. Try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    // --- basic validations ---
    if (formData.password !== formData.confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }
    if (!formData.email.includes("@") || !formData.email.endsWith("@gmail.com")) {
      setMessage("Email must be a valid Gmail address.");
      return;
    }
    if (formData.name.length > 20) {
      setMessage("Full name must be 20 characters or less.");
      return;
    }
    if (!/^\d{10}$/.test(formData.contactNumber)) {
      setMessage("Mobile number must be 10 digits after +63.");
      return;
    }

    try {
      const data = new FormData();

      data.append("name", formData.name);
      data.append("username", formData.username);
      data.append("email", formData.email);
      data.append("password", formData.password);
      data.append("role", formData.role);

      if (formData.contactNumber)
        data.append("contactNumber", "+63" + formData.contactNumber);
      if (formData.address) data.append("address", formData.address);
      if (formData.verificationCode)
        data.append("verificationCode", formData.verificationCode);
      if (formData.employeeID)
        data.append("employeeID", formData.employeeID);
      if (formData.file)
        data.append("file", formData.file);

      const res = await axios.post(
        "https://communisafe-backend.onrender.com/api/auth/signup",
        data,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setMessage(res.data.message || "Registered successfully!");
      setTimeout(() => {
        if (formData.role === "official" || formData.role === "security") {
          // DO NOT save token/user info for pending users!
          navigate("/pending");
        } else {
          // For residents, you may auto-login or just redirect to login
          navigate("/login");
        }
      }, 1500);
    } catch (err) {
      console.error("Signup error:", err.response?.data || err.message);
      setMessage(err.response?.data?.error || "Signup failed.");
    }
  };

  const getRoleIcon = () => require("../images/villad-green.png");
  const getRoleLabel = () => "Community Official";

  return (
    <div className="signup-container">
      <div className="signup-left-panel" style={{ backgroundImage: `url(${multibg})` }}>
        <img src={multiico} alt="Village Icon" className="signup-village-icon" />
        <h1 className="signup-title">CommuniSafe</h1>
        <p className="signup-description">
          Welcome to CommuniSafe. Join your community now.
        </p>
      </div>

      <div className="signup-right-panel">
        <form onSubmit={handleSubmit} className="signup-form" encType="multipart/form-data">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Sign up</h2>
         

          <div className="signup-role-selector">
            <div className="signup-role-option selected">
              <img src={getRoleIcon()} alt="official icon" className="signup-role-icon" />
              <p className="signup-role-text selected">{getRoleLabel()}</p>
            </div>
          </div>

          <input name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required className="signup-input" />
          <input name="username" placeholder="Username" value={formData.username} onChange={handleChange} required className="signup-input" />
          <input name="email" type="email" placeholder="Email Address" value={formData.email} onChange={handleChange} required className="signup-input" />
          <input name="contactNumber" placeholder="9123456789" value={formData.contactNumber} onChange={handleChange} maxLength="10" className="signup-input" />
          <input name="address" placeholder="Complete Address" value={formData.address} onChange={handleChange} className="signup-input" />
          <input name="password" type="password" placeholder="Password" value={formData.password} onChange={handleChange} required className="signup-input" />
          <input name="confirmPassword" type="password" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} required className="signup-input" />

          <input type="file" accept="image/*" onChange={handleFileChange} required className="signup-input" />
          <div className="flex gap-2 mb-4">
            <input name="verificationCode" placeholder="Verification Code" value={formData.verificationCode} onChange={handleChange} className="signup-input flex-1" />
            <button type="button" onClick={sendCode} disabled={countdown > 0} className="send-code-button">
              {countdown > 0 ? `Resend in ${countdown}s` : "Send Code"}
            </button>
          </div>

          <div className="flex items-start text-sm text-gray-700 gap-3 px-1 mb-4">
            <input type="checkbox" id="terms" required className="mt-1 accent-green-600 cursor-pointer" />
            <label htmlFor="terms" className="cursor-pointer">
              I agree to the{" "}
              <a href="/terms" className="text-green-600 underline">Terms & Conditions</a>{" "}
              and{" "}
              <a href="/privacy" className="text-green-600 underline">Data Privacy Policy</a>
            </label>
          </div>

          <p className="text-green-600 text-sm mb-3 cursor-pointer hover:underline text-center" onClick={() => navigate("/login")}>
            Already have an Account?
          </p>

          <button type="submit" className="signup-button">SIGN UP</button>
          {message && <p className="signup-message">{message}</p>}
        </form>
      </div>
    </div>
  );
}