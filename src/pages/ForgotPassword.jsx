// frontend/src/pages/ForgotPassword.js

import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import logo from '../images/multiico.png';
import '../css/Resetpass.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const handleReset = async () => {
    if (!email.includes('@') || !email.endsWith('@gmail.com')) {
      Swal.fire('Invalid Email', 'Please enter a valid Gmail address.', 'warning');
      return;
    }

    try {
      const response = await fetch('https://communisafe-backend.onrender.com/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        Swal.fire('Error', data.error || 'Failed to send email.', 'error');
        return;
      }

      Swal.fire(
        'Confirmation Email Sent!',
        'Check your Gmail and confirm before resetting your password.',
        'success'
      );
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  return (
    <div className="forgot-container">
      {/* Left Panel */}
      <div className="forgot-left">
        <img src={logo} alt="Logo" className="forgot-logo" />
        <h1 className="forgot-title">CommuniSafe</h1>
        <p className="forgot-description">
          Reset your password and stay connected with your community
        </p>
      </div>

      {/* Right Panel */}
      <div className="forgot-right">
        <div className="forgot-form">
          <h2>Forgot Password</h2>
          <p className="instruction">Enter your Gmail address to reset your password:</p>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@gmail.com"
            className="forgot-input"
          />

          <button className="forgot-button" onClick={handleReset}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
