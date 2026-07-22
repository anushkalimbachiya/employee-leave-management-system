import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import LeaveTicket from "../components/LeaveTicket";
import { leavesApi } from "../api/resources";
import { extractErrorMessage } from "../api/axios";

export default function ManagerDashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    leavesApi
      .managerDashboard()
      .then((res) => setData(res.data))
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function decide(leave, decision) {
    setBusyId(leave.id);
    setError("");
    try {
      await leavesApi.decide(leave.id, { status: decision });
      fetchData();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Layout>
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Manager Dashboard</div>
          <h1 className="page-title">Team leave overview</h1>
          <p className="page-subtitle">Keep the approval queue clear for your team.</p>
        </div>
        <Link to="/manager/requests" className="btn btn-primary">
          View all requests
        </Link>
      </div>

      {error && <div className="form-error">{error}</div>}

      {loading ? (
        <div className="loading-row">
          <span className="spinner" /> Loading team overview…
        </div>
      ) : (
        data && (
          <>
            <div className="stat-grid">
              <div className="stat-card accent-pending">
                <div className="stat-card-label">Pending requests</div>
                <div className="stat-card-value">{data.pending_requests_count}</div>
                <div className="stat-card-hint">awaiting your decision</div>
              </div>
              <div className="stat-card accent-approved">
                <div className="stat-card-label">Approved today</div>
                <div className="stat-card-value">{data.approved_today_count}</div>
                <div className="stat-card-hint">decided in the last 24 hours</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-label">Total employees</div>
                <div className="stat-card-value">{data.total_employees}</div>
                <div className="stat-card-hint">reporting to you</div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-title">Pending requests</div>
              <div className="panel-subtitle">Approve or reject each ticket below.</div>

              {data.pending_requests.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-title">All caught up</div>
                  There are no pending leave requests right now.
                </div>
              ) : (
                data.pending_requests.map((leave) => (
                  <LeaveTicket
                    key={leave.id}
                    leave={leave}
                    showEmployee
                    onApprove={(l) => decide(l, "APPROVED")}
                    onReject={(l) => decide(l, "REJECTED")}
                    busy={busyId === leave.id}
                  />
                ))
              )}
            </div>
          </>
        )
      )}
    </Layout>
  );
}
