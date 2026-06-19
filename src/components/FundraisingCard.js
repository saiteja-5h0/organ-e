import React from "react";

function FundraisingCard({ data, onDonate }) {
  const goal = data.target || data.goal || 1;
  const raised = data.raised || 0;
  const daysLeft = data.daysLeft || 0;

  const percent = Math.min((raised / goal) * 100, 100);

  return (
    <div className="glass-card fade-in">
      <h3>{data.title}</h3>
      <p>🏥 {data.hospital}</p>

      <div className="progress-container">
        <div className="progress-bar" style={{ width: `${percent}%` }} />
      </div>

      <p>
        ₹{raised.toLocaleString()} raised of ₹
        {goal.toLocaleString()}
      </p>

      <p>⏳ {daysLeft} days left</p>

      <div style={styles.badges}>
        <span style={styles.badge}>Hospital Verified</span>
        <span style={styles.badgeGov}>Govt Approved</span>
      </div>

      <button
        className="btn btn-primary"
        style={{ marginTop: 10 }}
        onClick={async () => {
          const raw = prompt('Enter donation amount (INR)');
          if (!raw) return;
          const n = Number(raw.replace(/[^0-9.]/g, ''));
          if (!n || n <= 0) return alert('Invalid amount');
          try {
            if (onDonate) await onDonate(data.id, n);
            alert('Thank you for your donation');
          } catch (err) {
            alert('Donation failed');
          }
        }}
      >
        Donate Now
      </button>
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
  progressContainer: {
    background: "#e5e7eb",
    borderRadius: 10,
    height: 10,
    margin: "10px 0",
  },
  progressBar: {
    height: "100%",
    background: "#10b981",
    borderRadius: 10,
  },
  badges: {
    display: "flex",
    gap: 10,
    marginTop: 10,
  },
  badge: {
    background: "#dcfce7",
    color: "#166534",
    padding: "4px 10px",
    borderRadius: 12,
    fontSize: 12,
  },
  badgeGov: {
    background: "#e0f2fe",
    color: "#075985",
    padding: "4px 10px",
    borderRadius: 12,
    fontSize: 12,
  },
};

export default FundraisingCard;
