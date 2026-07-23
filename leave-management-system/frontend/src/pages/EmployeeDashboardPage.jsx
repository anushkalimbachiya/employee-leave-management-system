import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import LeaveTicket from "../components/LeaveTicket";
import { leavesApi } from "../api/resources";
import { extractErrorMessage } from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function EmployeeDashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    leavesApi
      .employeeDashboard()
      .then((res) => setData(res.data))
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const initials = user
    ? ((user.first_name?.[0] || "") + (user.last_name?.[0] || "")).toUpperCase() ||
      user.username?.[0]?.toUpperCase()
    : "?";

  const fullName =
    user?.first_name || user?.last_name
      ? `${user.first_name} ${user.last_name}`.trim()
      : user?.username;

  return (
    <Layout>
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Employee Dashboard</div>
          <h1 className="page-title">Your leave ledger</h1>
          <p className="page-subtitle">
            A snapshot of your balance and recent activity for {data?.year || new Date().getFullYear()}.
          </p>
        </div>
        <Link to="/employee/apply" className="btn btn-primary">
          + Apply for leave
        </Link>
      </div>

      {/* Employee Profile Card */}
      {user && (
        <div className="panel" style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
            {/* Avatar */}
            <div style={{
              width: "64px", height: "64px", borderRadius: "50%",
              background: "linear-gradient(135deg, #1e3a5f, #2d6a9f)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.5rem", fontWeight: "700", color: "#fff",
              flexShrink: 0, letterSpacing: "0.05em"
            }}>
              {initials}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: "200px" }}>
              <div style={{ fontSize: "1.2rem", fontWeight: "700", color: "#1a2e44", marginBottom: "0.2rem" }}>
                {fullName}
              </div>
              <div style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: "0.5rem" }}>
                @{user.username}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                {user.email && (
                  <span style={{ fontSize: "0.82rem", color: "#4b5563" }}>
                    📧 {user.email}
                  </span>
                )}
                {user.department && (
                  <span style={{ fontSize: "0.82rem", color: "#4b5563" }}>
                    🏢 {user.department}
                  </span>
                )}
                {user.manager_name && (
                  <span style={{ fontSize: "0.82rem", color: "#4b5563" }}>
                    👤 Reports to: <strong>{user.manager_name}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Role badge */}
            <div>
              <span style={{
                padding: "0.3rem 0.9rem", borderRadius: "999px",
                background: user.role === "MANAGER" ? "#dbeafe" : "#dcfce7",
                color: user.role === "MANAGER" ? "#1e40af" : "#15803d",
                fontSize: "0.8rem", fontWeight: "600", textTransform: "uppercase",
                letterSpacing: "0.06em"
              }}>
                {user.role || "Employee"}
              </span>
            </div>
          </div>
        </div>
      )}

      {error && <div className="form-error">{error}</div>}

      {loading ? (
        <div className="loading-row">
          <span className="spinner" /> Loading your ledger…
        </div>
      ) : (
        data && (
          <>
            <div className="stat-grid">
              <div className="stat-card accent-approved">
                <div className="stat-card-label">Remaining leave</div>
                <div className="stat-card-value">{data.remaining_leaves}</div>
                <div className="stat-card-hint">of {data.max_annual_leaves} annual days</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-label">Approved leaves</div>
                <div className="stat-card-value">{data.approved_leaves_taken}</div>
                <div className="stat-card-hint">
                  {data.approved_leaves_count} request{data.approved_leaves_count === 1 ? "" : "s"} approved
                </div>
              </div>
              <div className="stat-card accent-pending">
                <div className="stat-card-label">Pending requests</div>
                <div className="stat-card-value">{data.pending_leaves_count}</div>
                <div className="stat-card-hint">awaiting manager decision</div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-title">Recent activity</div>
              <div className="panel-subtitle">Your five most recently filed requests.</div>

              {data.recent_requests.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-title">No leave requests yet</div>
                  Apply for your first leave to see it appear here.
                </div>
              ) : (
                data.recent_requests.map((leave) => <LeaveTicket key={leave.id} leave={leave} />)
              )}
            </div>
          </>
        )
      )}
    </Layout>
  );
}
