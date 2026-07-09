import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/global.css";

function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  return (
    <nav className="navbar" style={styles.nav}>
      <div className="logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
        ❤️ ORGAN-E
        <div className="subtext">National Organ Coordination System</div>
      </div>

      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/requests">Organ Requests</Link>
        <Link to="/fundraising">Fundraising</Link>

        {user && user.role === "doctor" && (
          <Link to="/dashboard" style={styles.activeLink}>👨‍⚕️ Doctor Dashboard</Link>
        )}
        {user && user.role === "admin" && (
          <Link to="/admin" style={styles.activeLink}>🏥 Admin Portal</Link>
        )}
        {user && user.role === "supervisor" && (
          <Link to="/supervisor" style={styles.activeLink}>📡 Supervisor Portal</Link>
        )}
      </div>

      <div style={styles.authSection}>
        {user ? (
          <div style={styles.userInfo}>
            <span style={styles.userName}>
              {user.name} ({user.role.toUpperCase()})
            </span>
            <button className="btn btn-outline" onClick={onLogout} style={styles.logoutBtn}>
              Logout
            </button>
          </div>
        ) : (
          <button
            className="btn btn-primary"
            onClick={() => navigate("/login")}
          >
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
  },
  activeLink: {
    color: "var(--primary)",
    fontWeight: "700"
  },
  authSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  userName: {
    fontSize: "14px",
    fontWeight: "600",
    color: "var(--accent)"
  },
  logoutBtn: {
    padding: "6px 12px",
    fontSize: "13px"
  }
};

export default Navbar;
