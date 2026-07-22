import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api/resources";
import { extractErrorMessage } from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [managers, setManagers] = useState([]);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    department: "",
    role: "EMPLOYEE",
    manager: "",
    password: "",
    password2: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    authApi
      .managers()
      .then((res) => setManagers(res.data.results || res.data))
      .catch(() => setManagers([]));
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (form.role === "MANAGER" || !form.manager) delete payload.manager;
      await authApi.register(payload);
      const user = await login(form.username, form.password);
      navigate(user.role === "MANAGER" ? "/manager" : "/employee", { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-visual">
        <div className="auth-visual-content">
          <div className="auth-visual-eyebrow">Employee Leave Management</div>
          <h1>Open a new ledger entry.</h1>
          <p>
            Register as an employee under a manager, or register as a manager to start approving
            requests for your team.
          </p>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-card">
          <h2>Create your account</h2>
          <p className="auth-card-subtitle">It only takes a minute.</p>

          {error && <div className="form-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field-row">
              <div className="field">
                <label htmlFor="first_name">First name</label>
                <input
                  id="first_name"
                  value={form.first_name}
                  onChange={(e) => update("first_name", e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="last_name">Last name</label>
                <input
                  id="last_name"
                  value={form.last_name}
                  onChange={(e) => update("last_name", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                value={form.username}
                onChange={(e) => update("username", e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                required
              />
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="department">Department</label>
                <input
                  id="department"
                  value={form.department}
                  onChange={(e) => update("department", e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="role">Role</label>
                <select id="role" value={form.role} onChange={(e) => update("role", e.target.value)}>
                  <option value="EMPLOYEE">Employee</option>
                  <option value="MANAGER">Manager</option>
                </select>
              </div>
            </div>

            {form.role === "EMPLOYEE" && (
              <div className="field">
                <label htmlFor="manager">Reports to</label>
                <select
                  id="manager"
                  value={form.manager}
                  onChange={(e) => update("manager", e.target.value)}
                  required
                >
                  <option value="" disabled>
                    {managers.length === 0
                      ? "No managers registered yet — select Role: Manager above to register first manager"
                      : "Select a manager"}
                  </option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.first_name ? `${m.first_name} ${m.last_name}` : m.username}
                    </option>
                  ))}
                </select>
                {managers.length === 0 && (
                  <small style={{ color: "#e53e3e", marginTop: "4px", display: "block" }}>
                    ⚠️ No manager accounts exist yet. Change <strong>Role</strong> above from <em>Employee</em> to <em>Manager</em> to create the first manager!
                  </small>
                )}
              </div>
            )}

            <div className="field-row">
              <div className="field">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="password2">Confirm password</label>
                <input
                  id="password2"
                  type="password"
                  value={form.password2}
                  onChange={(e) => update("password2", e.target.value)}
                  required
                />
              </div>
            </div>

            <button className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? "Creating account…" : "Create account"}
            </button>
          </form>

          <div className="auth-switch">
            Already have an account?{" "}
            <button type="button" onClick={() => navigate("/login")}>
              Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
