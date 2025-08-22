import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import io from "socket.io-client";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import PendingApproval from "./pages/PendingApproval";
import Dashboard from "./pages/Dashboard";
import CommunityAnnouncements from "./pages/CommunityAnnouncements";
import FloodTracker from "./pages/FloodTracker";
import IncidentReport from "./pages/IncidentReport";
import VisitorManagement from "./pages/VisitorManagement";
import ForgotPassword from "./pages/ForgotPassword";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import ResetPassword from "./pages/ResetPassword";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import PersonalInfo from "./pages/PersonalInfo";
import Settings from "./pages/Settings";
import EditProfile from './pages/EditProfile';
import AdminManagement from "./pages/AdminManagement";
import Notifications from './pages/Notifications';
import ResidentVisitorRequests from "./pages/ResidentVisitorRequests";
import ProtectedRoute from "./components/ProtectedRoute";
import IncidentArchive from "./pages/IncidentArchive";
import ActivityLog from './pages/ActivityLog';
import HelpFAQs from './pages/HelpFAQs';
import ApproveAccounts from './pages/ApproveAccounts';
import UserAccounts from "./pages/UserAccounts";
import ChangePassword from "./pages/ChangePassword";





// 🔌 Global socket connection
const socket = io("https://communisafe-backend.onrender.com", {
  path: "/socket.io/",
  transports: ["websocket", "polling"],
});

function App() {
  useEffect(() => {
    socket.on("newNotification", (data) => {
      console.log("Global Notification Received:", data);

      // Optional: store in localStorage to display red dot in header
      localStorage.setItem("hasNewNotification", "true");

      // Optional: trigger toast/popup if you have a UI lib like react-toastify
    });

    return () => socket.off("newNotification");
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/help-faqs" element={<HelpFAQs />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/pending" element={<PendingApproval />} />
        <Route path="/home" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/announcements" element={<CommunityAnnouncements />} />
        <Route path="/flood-tracker" element={<FloodTracker />} />
        <Route path="/incidentreport" element={<IncidentReport />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />
        <Route path="/superadmin/admin-management" element={<AdminManagement />} />
        <Route path="/superadmin/activity-log" element={<ActivityLog />} />
        <Route path="/incidentreport/:id" element={<IncidentReport />} /> 
        <Route path="/personal-info" element={<PersonalInfo />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/incidentarchive" element={<IncidentArchive />} />
        <Route path="/activity-log" element={<ActivityLog />} />
       <Route path="/approve-accounts" element={<ApproveAccounts />} />
       <Route path="/superadmin/accounts" element={<UserAccounts />} /> 
       <Route path="/change-password" element={<ChangePassword />} />
       
       
       <Route
  path="/visitorManagement"
  element={
    <ProtectedRoute allowedRoles={["official", "admin", "security"]}>
      <VisitorManagement />
    </ProtectedRoute>
  }
/>
<Route
  path="/visitor-requests"
  element={
    <ProtectedRoute allowedRoles={["resident"]}>
      <ResidentVisitorRequests />
    </ProtectedRoute>
  }
/>
<Route path="/superadmin/settings" element={<Settings />} />
      </Routes>
    </Router>
  );
}

export default App;
