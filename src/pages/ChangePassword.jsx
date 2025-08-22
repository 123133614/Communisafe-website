// src/pages/ChangePassword.jsx
import { useState, useMemo } from "react";
import axios from "axios";
import { FiEye, FiEyeOff, FiLock, FiKey, FiCheckCircle, FiXCircle } from "react-icons/fi";

const API_URL =
  process.env.REACT_APP_API_URL || "https://communisafe-backend.onrender.com";

export default function ChangePassword() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ type: "", msg: "" });

  // ────────────────────────────────────────────────────────────────────────────
  // Basic strength evaluation (no extra deps): 0–4
  // ────────────────────────────────────────────────────────────────────────────
  const strength = useMemo(() => {
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[a-z]/.test(newPassword)) score++;
    if (/\d/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;
    return Math.min(score, 4);
  }, [newPassword]);

  const strengthLabel = ["Too weak", "Weak", "Fair", "Good", "Strong"][strength] || "Too weak";

  const canSubmit =
    oldPassword.trim().length > 0 &&
    newPassword.length >= 8 &&
    confirm === newPassword &&
    !submitting;

  const resetToast = () => setToast({ type: "", msg: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    resetToast();

    if (newPassword !== confirm) {
      setToast({ type: "error", msg: "New password and confirmation do not match." });
      return;
    }
    if (newPassword.length < 8) {
      setToast({ type: "error", msg: "New password must be at least 8 characters." });
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setToast({ type: "error", msg: "You are not logged in." });
        setSubmitting(false);
        return;
      }

      await axios.post(
        `${API_URL}/api/auth/change-password`,
        { oldPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setToast({ type: "success", msg: "Password updated successfully." });
      setOldPassword("");
      setNewPassword("");
      setConfirm("");

      // Optional: force re-login after successful change (recommended)
      // localStorage.removeItem("token");
      // window.location.href = "/login";
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to change password.";
      setToast({ type: "error", msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cp-wrap">
      {/* Inline-scoped styles so you don't have to create a new CSS file */}
      <style>{`
        .cp-wrap { min-height: 100vh; background:#f8fafb; display:flex; align-items:center; justify-content:center; padding:24px; }
        .cp-card { width:100%; max-width:520px; background:#fff; border:1px solid #e5e7eb; border-radius:16px; box-shadow:0 10px 25px rgba(0,0,0,.05); padding:24px; }
        .cp-head { display:flex; align-items:center; gap:12px; margin-bottom:18px; }
        .cp-title { font-size:1.25rem; font-weight:600; color:#0f172a; }
        .cp-sub { font-size:.9rem; color:#64748b; margin-bottom:18px; }
        .cp-field { display:flex; flex-direction:column; gap:8px; margin-bottom:16px; }
        .cp-label { font-size:.9rem; font-weight:600; color:#0f172a; display:flex; align-items:center; gap:8px; }
        .cp-input-row { display:flex; align-items:center; gap:8px; border:1px solid #e2e8f0; border-radius:12px; padding:10px 12px; background:#fff; }
        .cp-input-row:focus-within { border-color:#22c55e; box-shadow:0 0 0 3px rgba(34,197,94,.15); }
        .cp-input { flex:1; border:none; outline:none; font-size:.95rem; color:#0f172a; background:transparent; }
        .cp-eye { cursor:pointer; border:none; background:transparent; display:flex; padding:4px; }
        .cp-meter { height:8px; width:100%; background:#f1f5f9; border-radius:999px; overflow:hidden; }
        .cp-meter-bar { height:100%; transition:width .25s ease; }
        .cp-hint { font-size:.8rem; color:#64748b; margin-top:6px; display:flex; justify-content:space-between; }
        .cp-actions { display:flex; gap:8px; margin-top:10px; }
        .cp-btn { appearance:none; border:none; border-radius:12px; padding:10px 14px; font-weight:600; cursor:pointer; }
        .cp-btn--primary { background:#22c55e; color:#fff; }
        .cp-btn--primary[disabled] { opacity:.6; cursor:not-allowed; }
        .cp-btn--ghost { background:transparent; color:#0f172a; }
        .cp-toast { display:flex; align-items:flex-start; gap:10px; padding:12px14px; border-radius:12px; margin:10px 0 0; font-size:.9rem; }
        .cp-toast--ok { background:#ecfdf5; color:#065f46; border:1px solid #a7f3d0; }
        .cp-toast--err { background:#fef2f2; color:#7f1d1d; border:1px solid #fecaca; }
      `}</style>

      <div className="cp-card">
        <div className="cp-head">
          <FiKey size={22} color="#16a34a" />
          <div className="cp-title">Change Password</div>
        </div>
        <div className="cp-sub">
          For your security, use at least 8 characters and avoid reusing old passwords.
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Current password */}
          <div className="cp-field">
            <label className="cp-label"><FiLock /> Current Password</label>
            <div className="cp-input-row">
              <input
                className="cp-input"
                type={showOld ? "text" : "password"}
                placeholder="Enter your current password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="cp-eye"
                onClick={() => setShowOld((s) => !s)}
                aria-label={showOld ? "Hide" : "Show"}
                title={showOld ? "Hide password" : "Show password"}
              >
                {showOld ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div className="cp-field">
            <label className="cp-label"><FiKey /> New Password</label>
            <div className="cp-input-row">
              <input
                className="cp-input"
                type={showNew ? "text" : "password"}
                placeholder="Enter a new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="cp-eye"
                onClick={() => setShowNew((s) => !s)}
                aria-label={showNew ? "Hide" : "Show"}
                title={showNew ? "Hide password" : "Show password"}
              >
                {showNew ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>

            {/* Strength meter */}
            <div className="cp-meter" aria-hidden>
              <div
                className="cp-meter-bar"
                style={{
                  width: `${(strength / 4) * 100}%`,
                  background:
                    strength <= 1
                      ? "#ef4444"
                      : strength === 2
                      ? "#f59e0b"
                      : strength === 3
                      ? "#10b981"
                      : "#22c55e",
                }}
              />
            </div>
            <div className="cp-hint">
              <span>{strengthLabel}</span>
              <span>
                Min: 8 chars • Mix of Aa, 0-9, symbols
              </span>
            </div>
          </div>

          {/* Confirm new password */}
          <div className="cp-field">
            <label className="cp-label"><FiKey /> Confirm New Password</label>
            <div className="cp-input-row">
              <input
                className="cp-input"
                type={showConfirm ? "text" : "password"}
                placeholder="Re-type your new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="cp-eye"
                onClick={() => setShowConfirm((s) => !s)}
                aria-label={showConfirm ? "Hide" : "Show"}
                title={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {confirm.length > 0 && confirm !== newPassword && (
              <div className="cp-hint" style={{ color: "#b91c1c" }}>
                Passwords don’t match.
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="cp-actions">
            <button
              type="submit"
              className="cp-btn cp-btn--primary"
              disabled={!canSubmit}
            >
              {submitting ? "Updating..." : "Update Password"}
            </button>
            <button
              type="button"
              className="cp-btn cp-btn--ghost"
              onClick={() => {
                setOldPassword("");
                setNewPassword("");
                setConfirm("");
                resetToast();
              }}
            >
              Clear
            </button>
          </div>

          {/* Toast */}
          {toast.msg && (
            <div
              className={`cp-toast ${
                toast.type === "success" ? "cp-toast--ok" : "cp-toast--err"
              }`}
            >
              {toast.type === "success" ? (
                <FiCheckCircle size={18} />
              ) : (
                <FiXCircle size={18} />
              )}
              <div>{toast.msg}</div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
