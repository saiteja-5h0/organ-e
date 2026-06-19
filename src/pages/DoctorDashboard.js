import React, { useEffect, useState } from "react";
import DashboardStatCard from "../components/DashboardStatCard";

function DoctorDashboard() {
  const [recentRequests, setRecentRequests] = useState([]);
  const [stats, setStats] = useState({ active: 0, completed: 12, pending: 2 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('/api/requests?limit=5')
      .then((r) => r.json())
      .then((data) => {
        setRecentRequests(data.items || []);
        setStats((s) => ({ ...s, active: data.total || 0 }));
      })
      .catch((err) => console.error("Failed to load dashboard data", err))
      .finally(() => setLoading(false));
  }, []);

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
          value={stats.active}
          color="#dc2626"
        />
        <DashboardStatCard
          title="Completed Transplants"
          value={stats.completed}
          color="#16a34a"
        />
        <DashboardStatCard
          title="Pending Verifications"
          value={stats.pending}
          color="#f59e0b"
        />
      </div>

      {/* Emergency Alerts */}
      <div style={styles.alert}>
        🚨 Emergency kidney transplant request received (O+)
      </div>

      {/* Recent Requests */}
      <h3 style={{ marginTop: 30 }}>Recent Organ Requests</h3>

      {loading ? (
        <p>Loading...</p>
      ) : recentRequests.length ? (
        recentRequests.map((r, i) => (
          <div key={i} style={styles.requestCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <b>{r.organ} Transplant</b>
                <p>{r.hospital} - {r.location}</p>
                <p style={{ fontSize: 12, color: '#666' }}>Blood Group: {r.blood}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={styles.tag}>{r.urgency}</span>
                <span style={styles.status}>Pending</span>
              </div>
            </div>
          </div>
        ))
      ) : (
        <p>No recent requests</p>
      )}
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
    background: 'rgba(255, 255, 255, 0.8)',
    border: '1px solid #eee',
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
