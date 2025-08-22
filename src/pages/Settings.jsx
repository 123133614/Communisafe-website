// frontend/app/Settings.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiBell,
  FiUser,
  FiLock,
  FiLogOut,
  FiMoon,
  FiHelpCircle,
  FiMail,
  FiChevronRight,
  FiShield,
  FiAlertTriangle,
  FiCheckCircle,
} from "react-icons/fi";

/* ——— Reusable row component ——— */
function SettingRow({ icon: Icon, title, subtitle, onClick, end, danger }) {
  return (
    <button
      onClick={onClick}
      className={`w-full group flex items-center justify-between px-4 py-3 rounded-xl transition-all
        ${danger
          ? "bg-red-50/60 hover:bg-red-100 active:scale-[.99]"
          : "bg-white hover:bg-gray-50 active:scale-[.99]"}
        border border-gray-100 shadow-sm`}
    >
      <div className="flex items-center gap-3 text-left">
        <div
          className={`p-2 rounded-lg shrink-0 ${
            danger
              ? "bg-red-100 text-red-600"
              : "bg-green-100 text-green-700 group-hover:bg-green-200"
          }`}
        >
          <Icon className="text-lg" />
        </div>
        <div>
          <div className={`text-[15px] font-semibold ${danger ? "text-red-700" : "text-gray-800"}`}>
            {title}
          </div>
          {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
        </div>
      </div>
      {end ? (
        end
      ) : (
        <FiChevronRight className={`text-gray-400 group-hover:translate-x-0.5 transition`} />
      )}
    </button>
  );
}

/* ——— Simple iOS-style toggle ——— */
function Toggle({ checked, onChange, label, icon: Icon }) {
  return (
    <div className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-100 rounded-xl shadow-sm">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-green-100 text-green-700">
          <Icon className="text-lg" />
        </div>
        <div className="text-[15px] font-semibold text-gray-800">{label}</div>
      </div>

      <label className="relative inline-flex items-center cursor-pointer select-none">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer
                        peer-checked:bg-green-500 transition-all"></div>
        <div className="absolute left-0.5 top-0.5 h-5 w-5 bg-white rounded-full shadow
                        transition-all peer-checked:translate-x-5"></div>
      </label>
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();

  // Load basic user info (fallbacks if not present)
  const user = useMemo(() => {
    try {
      return {
        name: localStorage.getItem("name") || "User",
        email: localStorage.getItem("email") || "your@email.com",
        role: (localStorage.getItem("role") || "resident")
          .toString()
          .replace(/^\w/, (c) => c.toUpperCase()),
      };
    } catch {
      return { name: "User", email: "your@email.com", role: "Resident" };
    }
  }, []);

  // UI prefs persisted
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    () => localStorage.getItem("pref_notifications") !== "false"
  );

 

  useEffect(() => {
    localStorage.setItem("pref_notifications", String(notificationsEnabled));
  }, [notificationsEnabled]);

  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (confirmed) {
      localStorage.clear();
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-white">
      {/* Top bar */}
      <div className="max-w-3xl mx-auto px-4 pt-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-green-700 font-semibold hover:opacity-80 transition mb-4"
        >
          <FiArrowLeft /> Back to Profile
        </button>
      </div>

      {/* Header / Profile Summary */}
      <div className="max-w-3xl mx-auto px-4">
        <div className="relative overflow-hidden rounded-2xl bg-[radial-gradient(1200px_400px_at_0%_-10%,#bbf7d0,transparent)] bg-white border border-green-100 shadow-sm">
          <div className="p-6 md:p-8 flex items-center gap-4 md:gap-6">
            <div className="h-14 w-14 md:h-16 md:w-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-white grid place-items-center shadow-md">
              <FiShield className="text-2xl" />
            </div>
            <div className="flex-1">
              <div className="text-xl md:text-2xl font-extrabold text-green-700 leading-tight">
                Settings
              </div>
              <div className="text-sm text-gray-600">
                Signed in as <span className="font-semibold text-gray-800">{user.name}</span> •{" "}
                {user.role}
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                <FiMail /> {user.email}
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 text-green-700 border border-green-100">
              <FiCheckCircle /> Account Active
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 mt-6 grid gap-6">
        {/* Account */}
        <section>
          <h3 className="text-sm font-bold text-gray-500 tracking-wider mb-3">ACCOUNT</h3>
          <div className="grid gap-3">
            <SettingRow
              icon={FiUser}
              title="Edit Personal Info"
              subtitle="Name, contact number, address"
              onClick={() => navigate("/edit-profile")}
            />
            <SettingRow
              icon={FiLock}
              title="Change Password"
              subtitle="Update your password securely"
              onClick={() => navigate("/change-password")}
            />
          </div>
        </section>

        {/* Preferences */}
     

        {/* Support */}
        <section>
          <h3 className="text-sm font-bold text-gray-500 tracking-wider mb-3">SUPPORT</h3>
          <div className="grid gap-3">
            <SettingRow
              icon={FiHelpCircle}
              title="Help & FAQs"
              subtitle="Browse common questions"
              onClick={() => navigate("/help-faqs")}
            />
            <SettingRow
              icon={FiMail}
              title="Contact Support"
              subtitle="communisafe.app@gmail.com"
              onClick={() => window.open("mailto:communisafe.app@gmail.com", "_blank")}
              end={
                <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-green-100 text-green-700 border border-green-200">
                  Email
                </span>
              }
            />
          </div>
        </section>

        {/* Danger Zone */}
        <section className="mb-10">
          <h3 className="text-sm font-bold text-gray-500 tracking-wider mb-3">DANGER ZONE</h3>
          <SettingRow
            icon={FiLogOut}
            title="Logout"
            subtitle="Sign out of your account"
            danger
            onClick={handleLogout}
            end={<FiAlertTriangle className="text-red-500" />}
          />
        </section>
      </div>
    </div>
  );
}
