import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ allowedRoles, children }) {
  const role = localStorage.getItem("role");
  if (!allowedRoles.includes(role)) {
    // Redirect to dashboard if not allowed
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}