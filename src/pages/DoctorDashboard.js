import React, { useEffect, useState, useCallback } from "react";
import DashboardStatCard from "../components/DashboardStatCard";
import "../styles/glass.css";
import "../styles/global.css";

function DoctorDashboard({ user }) {
  const [allocatedOps, setAllocatedOps] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [organsStock, setOrgansStock] = useState([]);
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState({ active: 0, completed: 0, totalOrgans: 0 });
  const [loading, setLoading] = useState(true);

  // Verification Code Form State
  const [activeReqId, setActiveReqId] = useState(null);
  const [typedCode, setTypedCode] = useState("");
  const [confirming, setConfirming] = useState(false);

  // Matching check state
  const [checkedMatches, setCheckedMatches] = useState({}); // reqId: array of matches

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch requests
      const reqRes = await fetch("/api/requests?limit=100");
      const reqData = await reqRes.json();
      const allReqs = reqData.items || [];

      // Filter operations allocated to THIS doctor
      const myAllocations = allReqs.filter(
        (r) => r.status === "Allocated" && r.allocated_doctor_id === user
      );
      setAllocatedOps(myAllocations);

      // Remaining general pending requests to check matches
      const generalPendings = allReqs.filter((r) => r.status === "Pending");
      setPendingRequests(generalPendings);

      // 2. Fetch local activities for this doctor
      const actRes = await fetch(`/api/doctor/activities?doctorId=${user}`);
      const actData = await actRes.json();
      setActivities(actData);

      // 3. Fetch all organs to count availability stats
      const orgRes = await fetch("/api/organs");
      const orgData = await orgRes.json();
      setOrgansStock(orgData);

      // Calculate Stats
      const completedTransplants = allReqs.filter(
        (r) => r.status === "Completed" && r.allocated_doctor_id === user
      ).length;

      setStats({
        active: myAllocations.length,
        completed: completedTransplants,
        totalOrgans: orgData.filter(o => o.status === "Available" && o.hospital === user.hospital).length
      });

    } catch (err) {
      console.error("Error fetching doctor dashboard data", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleVerifySubmit = useCallback(async (e, requestId) => {
    e.preventDefault();
    if (!typedCode) return;
    setConfirming(true);
    try {
      const res = await fetch("/api/doctor/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          doctorId: user,
          verificationCode: typedCode
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Handshake verification failed");
      }

      alert("Transplant verification confirmed! Status set to COMPLETED. Operation logged.");
      setTypedCode("");
      setActiveReqId(null);
      fetchDashboardData();
    } catch (err) {
      alert("Verification Failed: " + err.message);
    } finally {
      setConfirming(false);
    }
  }, [
    fetchDashboardData,
    typedCode,
    user
]);

  const runCompatibilityCheck = useCallback((request) => {
    // Find matching organs across the entire national registry
    const matches = organsStock.filter(
      (o) =>
        o.status === "Available" &&
        o.organ_type.toLowerCase() === request.organ.toLowerCase() &&
        o.blood_group.toLowerCase() === request.blood.toLowerCase()
    );

    setCheckedMatches((prev) => ({
      ...prev,
      [request.id]: matches
    }));
  }, [organsStock]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className="container">
      {/* Surgeon Profile Header */}
      <div className="glass-card fade-in" style={styles.profile}>
        <div>
          <h2>👨‍⚕️ Surgeon Workstation</h2>
          <p>
            Welcome, <strong>{user.name}</strong> | Cardiac & Transplant Dept, {user.hospital}
          </p>
          <span style={styles.verified}>Doctor Credentials Verified</span>
        </div>
      </div>

      {/* Stats Counter */}
      <div style={styles.stats}>
        <DashboardStatCard
          title="Assigned Operative Operations"
          value={stats.active}
          color="#dc2626"
        />
        <DashboardStatCard
          title="Completed Transplants by You"
          value={stats.completed}
          color="#16a34a"
        />
        <DashboardStatCard
          title="Matching Organs in Local Stock"
          value={stats.totalOrgans}
          color="#10b981"
        />
      </div>

      {loading ? (
        <p>Loading workstation databases...</p>
      ) : (
        <div style={styles.contentGrid}>
          {/* Main Column: Active Tasks & Match Check */}
          <div style={styles.mainCol}>
            {/* Actives Operative queue */}
            <div style={styles.sectionCard} className="glass-card">
              <h3 style={styles.sectTitle}>🚨 Active Operations awaiting OR Sign-off</h3>
              <p style={styles.subtext}>Enter confirmation keys provided by Administration once transplant is successful.</p>

              {allocatedOps.length === 0 ? (
                <p style={{ fontStyle: "italic", fontSize: "14px", color: "var(--muted)" }}>No surgery tasks currently assigned to you.</p>
              ) : (
                <div style={styles.opsList}>
                  {allocatedOps.map((op) => (
                    <div key={op.id} style={styles.opCard}>
                      <div style={styles.opHead}>
                        <div>
                          <strong>{op.organ} Transplant Operation (#{op.id})</strong>
                          <p style={{ margin: "2px 0 0 0", fontSize: "13px" }}>
                            Location: {op.hospital} ({op.location}) | Blood Match: <strong>{op.blood}</strong>
                          </p>
                        </div>
                        <span style={styles.tag}>Awaiting Verification</span>
                      </div>

                      {activeReqId === op.id ? (
                        <form onSubmit={(e) => handleVerifySubmit(e, op.id)} style={styles.verifyForm}>
                          <input
                            type="text"
                            placeholder="Enter 6-digit OR Handshake Key"
                            value={typedCode}
                            onChange={(e) => setTypedCode(e.target.value)}
                            required
                            style={styles.keyInput}
                          />
                          <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={confirming}
                            style={{ fontSize: "13px", padding: "8px 14px" }}
                          >
                            {confirming ? "Verifying..." : "Validate & Complete Operation"}
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => { setActiveReqId(null); setTypedCode(""); }}
                            style={{ fontSize: "13px", padding: "8px 14px" }}
                          >
                            Cancel
                          </button>
                        </form>
                      ) : (
                        <button
                          className="btn btn-primary"
                          onClick={() => setActiveReqId(op.id)}
                          style={{ marginTop: "12px", fontSize: "13px", padding: "8px 14px" }}
                        >
                          ✔ Access Verification Gateway
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* General Patient Matching Registry check */}
            <div style={{ ...styles.sectionCard, marginTop: "24px" }} className="glass-card">
              <h3 style={styles.sectTitle}>🚑 Compatibility Matching Registry</h3>
              <p style={styles.subtext}>Run real-time matching checks on nationwide pending requests</p>

              {pendingRequests.length === 0 ? (
                <p style={{ fontStyle: "italic", fontSize: "14px", color: "var(--muted)" }}>No pending patient requests in registry.</p>
              ) : (
                <div style={styles.patientList}>
                  {pendingRequests.map((req) => {
                    const matches = checkedMatches[req.id];
                    return (
                      <div key={req.id} style={styles.patientItem}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <strong>{req.organ} Patient Case #{req.id}</strong>
                            <p style={{ margin: "2px 0", fontSize: "13px" }}>
                              Hosp: {req.hospital} | Needed Blood: <strong>{req.blood}</strong>
                            </p>
                          </div>
                          <button
                            className="btn btn-outline"
                            onClick={() => runCompatibilityCheck(req)}
                            style={{ padding: "6px 12px", fontSize: "12.5px" }}
                          >
                            Run Matching Check
                          </button>
                        </div>

                        {/* Rendering results */}
                        {matches !== undefined && (
                          <div style={styles.matchResults}>
                            {matches.length === 0 ? (
                              <div style={styles.noMatch}>
                                ❌ 0 matching organs in national registry - awaiting intake.
                              </div>
                            ) : (
                              <div style={styles.matchSuccess}>
                                🟢 <strong>{matches.length} Match(es) Found!</strong>
                                <ul style={{ margin: "6px 0 0 0", paddingLeft: "20px", fontSize: "12px" }}>
                                  {matches.map((m) => (
                                    <li key={m.id} style={{ margin: "4px 0" }}>
                                      Organ ID #{m.id} at {m.hospital} (Status: {m.status}) - <strong>100% HLA & Blood Type Match</strong>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Surgeon track record */}
          <div style={styles.sideCol}>
            <div style={styles.sectionCard} className="glass-card">
              <h3 style={styles.sectTitle}>📜 Your Operative Logs</h3>
              <p style={styles.subtext}>Official blockchain-certified audit logs</p>

              {activities.length === 0 ? (
                <p style={{ fontStyle: "italic", fontSize: "13px", color: "var(--muted)" }}>No operations logged yet.</p>
              ) : (
                <div style={styles.logList}>
                  {activities.map((a) => (
                    <div key={a.id} style={styles.logItem}>
                      <span style={styles.logTime}>{new Date(a.created_at).toLocaleDateString()}</span>
                      <strong>{a.description}</strong>
                      <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#475569" }}>{a.details}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  profile: {
    padding: 20,
    borderRadius: 14,
    marginBottom: 20,
    backgroundColor: "rgba(255,255,255,0.7)"
  },
  verified: {
    background: "#dcfce7",
    color: "#166534",
    padding: "4px 10px",
    borderRadius: 12,
    fontSize: "12px",
    fontWeight: "700"
  },
  stats: {
    display: "flex",
    gap: 20,
    marginBottom: 24,
    flexWrap: "wrap"
  },
  contentGrid: {
    display: "flex",
    gap: "24px",
    flexWrap: "wrap",
    alignItems: "flex-start"
  },
  mainCol: {
    flex: "1 1 600px"
  },
  sideCol: {
    flex: "1 1 300px"
  },
  sectionCard: {
    padding: "24px",
    borderRadius: "16px",
    backgroundColor: "white"
  },
  sectTitle: {
    margin: "0 0 4px 0",
    color: "var(--accent)"
  },
  subtext: {
    margin: "0 0 16px 0",
    fontSize: "13px",
    color: "var(--muted)"
  },
  opsList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },
  opCard: {
    padding: "20px",
    border: "1px solid #fee2e2",
    borderRadius: "12px",
    backgroundColor: "rgba(220,38,38,0.01)"
  },
  opHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  tag: {
    background: "#fef3c7",
    color: "#d97706",
    fontSize: "11px",
    padding: "3px 8px",
    borderRadius: "8px",
    fontWeight: "700"
  },
  verifyForm: {
    display: "flex",
    gap: "10px",
    marginTop: "16px",
    alignItems: "center",
    flexWrap: "wrap"
  },
  keyInput: {
    padding: "9px",
    borderRadius: "8px",
    border: "1px solid rgba(0,0,0,0.12)",
    fontSize: "14px",
    flex: 1,
    minWidth: "180px",
    outline: "none"
  },
  patientList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },
  patientItem: {
    borderBottom: "1px solid rgba(0,0,0,0.05)",
    paddingBottom: "16px"
  },
  matchResults: {
    marginTop: "12px"
  },
  noMatch: {
    background: "#f8fafc",
    color: "#64748b",
    padding: "8px 12px",
    borderRadius: "8px",
    fontSize: "12.5px",
    border: "1px solid #e2e8f0"
  },
  matchSuccess: {
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#166534",
    padding: "10px 14px",
    borderRadius: "8px",
    fontSize: "13px"
  },
  logList: {
    display: "flex",
    flexDirection: "column",
    gap: "14px"
  },
  logItem: {
    borderLeft: "2px solid var(--primary)",
    paddingLeft: "12px"
  },
  logTime: {
    fontSize: "11px",
    color: "var(--muted)",
    display: "block",
    marginBottom: "2px"
  }
};

export default DoctorDashboard;
