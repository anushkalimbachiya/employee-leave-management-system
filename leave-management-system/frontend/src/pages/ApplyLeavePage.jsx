import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { leavesApi } from "../api/resources";
import { extractErrorMessage } from "../api/axios";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function ApplyLeavePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ start_date: "", end_date: "", reason: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function clientValidate() {
    const today = todayIso();
    if (!form.start_date || !form.end_date || !form.reason.trim()) {
      return "Please fill in the start date, end date, and a reason.";
    }
    if (form.start_date < today) {
      return "You cannot apply for leave on a past date.";
    }
    if (form.end_date < form.start_date) {
      return "End date cannot be before the start date.";
    }
    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const clientError = clientValidate();
    if (clientError) {
      setError(clientError);
      return;
    }

    setSubmitting(true);
    try {
      await leavesApi.apply(form);
      setSuccess("Your leave request has been filed and is pending manager approval.");
      setForm({ start_date: "", end_date: "", reason: "" });
      setTimeout(() => navigate("/employee/history"), 1200);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const requestedDays =
    form.start_date && form.end_date && form.end_date >= form.start_date
      ? Math.round(
          (new Date(form.end_date) - new Date(form.start_date)) / (1000 * 60 * 60 * 24)
        ) + 1
      : null;

  return (
    <Layout>
      <div className="page-header">
        <div>
          <div className="page-eyebrow">New Ticket</div>
          <h1 className="page-title">Apply for leave</h1>
          <p className="page-subtitle">
            Submit the dates and reason for your leave. Your manager will be notified immediately.
          </p>
        </div>
      </div>

      <div className="panel" style={{ maxWidth: 560 }}>
        {error && <div className="form-error">{error}</div>}
        {success && <div className="form-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field-row">
            <div className="field">
              <label htmlFor="start_date">Start date</label>
              <input
                id="start_date"
                type="date"
                min={todayIso()}
                value={form.start_date}
                onChange={(e) => update("start_date", e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="end_date">End date</label>
              <input
                id="end_date"
                type="date"
                min={form.start_date || todayIso()}
                value={form.end_date}
                onChange={(e) => update("end_date", e.target.value)}
                required
              />
            </div>
          </div>

          {requestedDays !== null && (
            <div className="field-hint" style={{ marginTop: -10, marginBottom: 18 }}>
              This request covers {requestedDays} day{requestedDays === 1 ? "" : "s"}.
            </div>
          )}

          <div className="field">
            <label htmlFor="reason">Reason</label>
            <textarea
              id="reason"
              value={form.reason}
              onChange={(e) => update("reason", e.target.value)}
              placeholder="e.g. Family function out of town"
              required
            />
          </div>

          <button className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? "Filing request…" : "Submit leave request"}
          </button>
        </form>
      </div>
    </Layout>
  );
}
