import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-row" style={{ justifyContent: "center", paddingTop: 80 }}>
        <span className="spinner" />
        Checking your session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role && user.role !== role) {
    const fallback = user.role === "MANAGER" ? "/manager" : "/employee";
    return <Navigate to={fallback} replace />;
  }

  return children;
}
