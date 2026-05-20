import React from "react";
import "../styles/glass.css";

function DashboardStatCard({ title, value, color, icon }) {
  const style = { background: color || "var(--primary)" };
  return (
    <div className="glass-card stat-card" style={style}>
      {icon && <div className="stat-icon">{icon}</div>}
      <div className="card-value">{value}</div>
      <div className="card-label">{title}</div>
    </div>
  );
}

export default DashboardStatCard;
