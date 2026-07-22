import { useCallback, useEffect, useState } from "react";
import Layout from "../components/Layout";
import LeaveTicket from "../components/LeaveTicket";
import { leavesApi } from "../api/resources";
import { extractErrorMessage } from "../api/axios";

const STATUS_OPTIONS = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"];

export default function ManagerRequestsPage() {
  const [results, setResults] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const pageSize = 10;
  const totalPages = Math.max(Math.ceil(count / pageSize), 1);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError("");
    leavesApi
      .list({
        page,
        status: status || undefined,
        search: debouncedSearch || undefined,
        ordering: "-applied_on",
      })
      .then((res) => {
        setResults(res.data.results);
        setCount(res.data.count);
      })
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [page, status, debouncedSearch]);

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
          <div className="page-eyebrow">Full Registry</div>
          <h1 className="page-title">All leave requests</h1>
          <p className="page-subtitle">Search, filter, and act on any request from your team.</p>
        </div>
      </div>

      <div className="filter-bar">
        <input
          placeholder="Search by employee name…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="form-error">{error}</div>}

      {loading ? (
        <div className="loading-row">
          <span className="spinner" /> Searching the registry…
        </div>
      ) : results.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-title">No matching requests</div>
          Try a different search term or status filter.
        </div>
      ) : (
        results.map((leave) => (
          <LeaveTicket
            key={leave.id}
            leave={leave}
            showEmployee
            onApprove={leave.status === "PENDING" ? (l) => decide(l, "APPROVED") : undefined}
            onReject={leave.status === "PENDING" ? (l) => decide(l, "REJECTED") : undefined}
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
