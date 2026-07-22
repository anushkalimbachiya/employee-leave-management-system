import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import LeaveTicket from "../components/LeaveTicket";
import { leavesApi } from "../api/resources";
import { extractErrorMessage } from "../api/axios";

export default function EmployeeDashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    leavesApi
      .employeeDashboard()
      .then((res) => setData(res.data))
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

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
