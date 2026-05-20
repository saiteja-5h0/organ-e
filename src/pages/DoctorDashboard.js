import React from "react";
import DashboardStatCard from "../components/DashboardStatCard";

function DoctorDashboard() {
  const recentRequests = [
    {
      organ: "Kidney",
      patient: "Patient ID #1023",
      urgency: "Critical",
      status: "Pending",
    },
    {
      organ: "Liver",
      patient: "Patient ID #2041",
      urgency: "High",
      status: "Matched",
    },
  ];

  return (
    <div className="container">
      {/* Profile */}
      <div className="glass-card fade-in" style={styles.profile}>
        <div>
          <h2>Dr. Sai Teja</h2>
          <p>CMR Institute Hospital, Hyderabad</p>
          <span style={styles.verified}>Doctor Verified</span>
        </div>
      </div>

      {/* Stats */}
      <div style={styles.stats}>
        <DashboardStatCard
          title="Active Requests"
          value="3"
          color="#dc2626"
        />
        <DashboardStatCard
          title="Completed Transplants"
          value="12"
          color="#16a34a"
        />
        <DashboardStatCard
          title="Pending Verifications"
          value="2"
          color="#f59e0b"
        />
      </div>

      {/* Emergency Alerts */}
      <div style={styles.alert}>
        🚨 Emergency kidney transplant request received (O+)
      </div>

      {/* Recent Requests */}
      <h3 style={{ marginTop: 30 }}>Recent Organ Requests</h3>

      {recentRequests.map((r, i) => (
        <div key={i} style={styles.requestCard}>
          <b>{r.organ} Transplant</b>
          <p>{r.patient}</p>
          <span style={styles.tag}>{r.urgency}</span>
          <span style={styles.status}>{r.status}</span>
        </div>
      ))}
    </div>
  );
}

const styles = {
  profile: {
  padding: 20,
  borderRadius: 14,
  marginBottom: 20,
},
  verified: {
    background: "#dcfce7",
    color: "#166534",
    padding: "4px 10px",
    borderRadius: 12,
    fontSize: 12,
  },
  stats: {
    display: "flex",
    gap: 20,
    marginBottom: 20,
  },
  alert: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: 14,
    borderRadius: 10,
    fontWeight: "bold",
  },
  requestCard: {
  padding: 16,
  borderRadius: 12,
  marginTop: 12,
},
  tag: {
    background: "#fde68a",
    padding: "4px 10px",
    borderRadius: 10,
    marginRight: 10,
    fontSize: 12,
  },
  status: {
    background: "#e0f2fe",
    padding: "4px 10px",
    borderRadius: 10,
    fontSize: 12,
  },
};

export default DoctorDashboard;
