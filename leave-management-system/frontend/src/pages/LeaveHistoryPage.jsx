import { useCallback, useEffect, useState } from "react";
import Layout from "../components/Layout";
import LeaveTicket from "../components/LeaveTicket";
import { leavesApi } from "../api/resources";
import { extractErrorMessage } from "../api/axios";

const STATUS_OPTIONS = ["", "PENDING", "APPROVED", "REJECTED", "CANCELLED"];

export default function LeaveHistoryPage() {
  const [results, setResults] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const pageSize = 10;
  const totalPages = Math.max(Math.ceil(count / pageSize), 1);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError("");
    leavesApi
      .list({ page, status: status || undefined, ordering: "-applied_on" })
      .then((res) => {
        setResults(res.data.results);
        setCount(res.data.count);
      })
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [page, status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleCancel(leave) {
    setBusyId(leave.id);
    try {
      await leavesApi.cancel(leave.id);
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
          <div className="page-eyebrow">Your Records</div>
          <h1 className="page-title">Leave history</h1>
          <p className="page-subtitle">Every ticket you've filed, in one place.</p>
        </div>
      </div>

      <div className="filter-bar">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.filter(Boolean).map((s) => (
            <option key={s} value={s}>
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="form-error">{error}</div>}

      {loading ? (
        <div className="loading-row">
          <span className="spinner" /> Loading your history…
        </div>
      ) : results.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-title">Nothing here yet</div>
          No leave requests match this filter.
        </div>
      ) : (
        results.map((leave) => (
          <LeaveTicket
            key={leave.id}
            leave={leave}
            onCancel={handleCancel}
            busy={busyId === leave.id}
          />
        ))
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          Page {page} of {totalPages}
          <button
            className="btn btn-outline"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </Layout>
  );
}
