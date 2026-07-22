import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const employeeLinks = [
  { to: "/employee", label: "Dashboard", end: true },
  { to: "/employee/apply", label: "Apply for Leave" },
  { to: "/employee/history", label: "Leave History" },
];

const managerLinks = [
  { to: "/manager", label: "Dashboard", end: true },
  { to: "/manager/requests", label: "All Leave Requests" },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const links = user?.role === "MANAGER" ? managerLinks : employeeLinks;

  return (
    <div className="app-shell">
      <div className="mobile-topbar">
        <div className="mobile-topbar-brand">
          <span>The Registry</span>
        </div>
        <button className="hamburger" onClick={() => setMobileOpen((v) => !v)}>
          {mobileOpen ? "Close" : "Menu"}
        </button>
      </div>

      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark">R</div>
          <div className="sidebar-brand-text">The Registry</div>
        </div>
        <div className="sidebar-tagline">Leave management, ledgered.</div>

        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <strong>{user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}</strong>
            {user?.department || "—"}
            <span className="sidebar-role-chip">{user?.role}</span>
          </div>
          <button className="btn-signout" onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="main">{children}</main>
    </div>
  );
}
