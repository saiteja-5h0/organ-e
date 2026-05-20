import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/global.css";

function Navbar() {
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <div className="logo">
        ❤️ ORGAN-E
        <div className="subtext">National Organ Coordination System</div>
      </div>

      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/requests">Organ Requests</Link>
        <Link to="/fundraising">Fundraising</Link>
        <Link to="/dashboard">Doctor Dashboard</Link>
      </div>

      <button
        className="btn btn-primary"
        onClick={() => navigate('/requests')}
        aria-label="Create new request"
      >
        + New Request
      </button>
    </nav>
  );
}

export default Navbar;
