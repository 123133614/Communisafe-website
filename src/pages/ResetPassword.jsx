// src/pages/ResetPassword.jsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { BsEye, BsEyeSlash } from 'react-icons/bs';

import logo from '../images/multiico.png';
import '../css/Newpass.css';

export default function ResetPassword() {
  // We named the route param "token" but it's actually the userId
  const { token } = useParams();
  const isObjectId = /^[a-f\d]{24}$/i.test(token);
  const navigate = useNavigate();

  const [password, setPassword]       = useState('');
  const [confirm, setConfirm]         = useState('');
  const [message, setMessage]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (password !== confirm) {
      setMessage("Passwords do not match.");
      return;
    }

    try {
      let res;
      if (isObjectId) {
        // userId
        res = await axios.post(
          `https://communisafe-backend.onrender.com/api/auth/reset-password-by-id/${token}`,
          { password }
        );
      } else {
        // token
        res = await axios.post(
          `https://communisafe-backend.onrender.com/api/auth/reset-password/${token}`,
          { password }
        );
      }

      await Swal.fire({
        icon: 'success',
        title: 'Password Reset Successful!',
        text: 'You can now log in to your account.',
        confirmButtonColor: '#28a745',
        confirmButtonText: 'Go to Login',
      });

      navigate('/login');
    } catch (err) {
      // Log full response so you can see the real error
      console.error("Reset error:", err.response?.data || err.message);

      const errMsg = err.response?.data?.error || "❌ Error resetting password.";
      setMessage(errMsg);
    }
  };

  return (
    <div className="reset-container">
      <div className="reset-left">
        <img src={logo} alt="CommuniSafe Logo" className="reset-logo" />
        <h1 className="reset-title">CommuniSafe</h1>
        <p className="reset-description">
          Welcome back to CommuniSafe. Reset your password to stay connected with your community.
        </p>
      </div>

      <div className="reset-right">
        <form onSubmit={handleSubmit} className="reset-form">
          <h2>Reset Your Password</h2>

          <div className="input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="toggle-btn"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? <BsEyeSlash /> : <BsEye />}
            </button>
          </div>

          <div className="input-wrapper">
            <input
              type={showConfirm ? 'text' : 'password'}
              placeholder="Confirm password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
            <button
              type="button"
              className="toggle-btn"
              onClick={() => setShowConfirm((v) => !v)}
            >
              {showConfirm ? <BsEyeSlash /> : <BsEye />}
            </button>
          </div>

          <button type="submit" className="reset-button">
            Reset Password
          </button>

          {message && <p className="reset-message">{message}</p>}
        </form>
      </div>
    </div>
  );
}
