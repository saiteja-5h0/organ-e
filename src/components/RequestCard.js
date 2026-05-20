import React from "react";
import "../styles/glass.css";

function RequestCard({ data, onView, onResolve }) {
  return (
    <div className="glass-card fade-in">
      <div style={styles.header}>
        <h3>{data.organ} Transplant</h3>
        <div style={styles.tags}>
          <span
          style={styles.urgency}
          className={data.urgency === "Critical" ? "emergency" : ""}
          >
            {data.urgency}
            </span>
          <span style={styles.blood}>{data.blood}</span>
        </div>
      </div>

      <div style={styles.badges}>
        <span style={styles.badgeGreen}>Hospital Verified</span>
        <span style={styles.badgeBlue}>Doctor Verified</span>
        <span style={styles.badgePurple}>Govt. Approved</span>
      </div>

      <p>📍 {data.location}</p>
      <p>🏥 {data.hospital}</p>
      <p>⏱ Posted {data.time}</p>

      <div style={styles.actions}>
        <button className="btn btn-primary" onClick={() => alert(`Contacting doctor at ${data.hospital} — please call hospital directly`)}>Contact Doctor</button>
        <button className="btn btn-outline" onClick={() => onView ? onView(data.id) : alert(JSON.stringify(data, null, 2))}>View Details</button>
        <button className="btn btn-outline" onClick={() => {
          if (onResolve && window.confirm('Mark this request as resolved?')) onResolve(data.id);
        }}>Resolve</button>
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: "white",
    padding: 20,
    borderRadius: 14,
    boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
    marginBottom: 20,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
  },
  tags: {
    display: "flex",
    gap: 8,
  },
  urgency: {
    background: "#fee2e2",
    color: "#dc2626",
    padding: "4px 10px",
    borderRadius: 12,
    fontSize: 12,
  },
  blood: {
    border: "1px solid #dc2626",
    color: "#dc2626",
    padding: "4px 10px",
    borderRadius: 12,
    fontSize: 12,
  },
  badges: {
    display: "flex",
    gap: 10,
    margin: "10px 0",
  },
  badgeGreen: {
    background: "#dcfce7",
    color: "#15803d",
    padding: "4px 10px",
    borderRadius: 12,
    fontSize: 12,
  },
  badgeBlue: {
    background: "#e0f2fe",
    color: "#0369a1",
    padding: "4px 10px",
    borderRadius: 12,
    fontSize: 12,
  },
  badgePurple: {
    background: "#f3e8ff",
    color: "#6b21a8",
    padding: "4px 10px",
    borderRadius: 12,
    fontSize: 12,
  },
  actions: {
    display: "flex",
    gap: 10,
    marginTop: 16,
  },
  secondaryBtn: {
    background: "white",
    border: "1px solid #ccc",
  },
};

export default RequestCard;
