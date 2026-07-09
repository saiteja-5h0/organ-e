import React, { useEffect, useState, useCallback } from "react";
import DashboardStatCard from "../components/DashboardStatCard";
import "../styles/glass.css";
import "../styles/global.css";

function DoctorDashboard({ user }) {
  const [allocatedOps, setAllocatedOps] = useState([]);
  const [authorizedOps, setAuthorizedOps] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
   // eslint-disable-next-line
  const [organsStock, setOrgansStock] = useState([]);
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState({ active: 0, authorized: 0, completed: 0, totalOrgans: 0 });
  const [loading, setLoading] = useState(true);

  const [activeReqId, setActiveReqId] = useState(null);
  const [typedCode, setTypedCode] = useState("");
  const [authorizing, setAuthorizing] = useState(false);
  const [completing, setCompleting] = useState(null);
  const [checkedMatches, setCheckedMatches] = useState({});
  const [expandedReport, setExpandedReport] = useState(null);

  const doctorId = user.id;

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const reqRes = await fetch("/api/requests?limit=100");
      const reqData = await reqRes.json();
      const allReqs = reqData.items || [];

      const myAllocated = allReqs.filter(
        (r) => r.status === "Allocated" && Number(r.allocated_doctor_id) === Number(doctorId)
      );
      const myAuthorized = allReqs.filter(
        (r) => r.status === "Authorized" && Number(r.allocated_doctor_id) === Number(doctorId)
      );
      setAllocatedOps(myAllocated);
      setAuthorizedOps(myAuthorized);

      setPendingRequests(allReqs.filter((r) => r.status === "Pending"));

      const actRes = await fetch(`/api/doctor/activities?doctorId=${doctorId}`);
      setActivities(await actRes.json());

      const orgRes = await fetch("/api/organs");
      const orgData = await orgRes.json();
      setOrgansStock(orgData);

      const completedTransplants = allReqs.filter(
        (r) => r.status === "Completed" && Number(r.allocated_doctor_id) === Number(doctorId)
      ).length;

      setStats({
        active: myAllocated.length,
        authorized: myAuthorized.length,
        completed: completedTransplants,
        totalOrgans: orgData.filter((o) => o.status === "Available" && o.hospital === user.hospital).length
      });
    } catch (err) {
      console.error("Error fetching doctor dashboard data", err);
    } finally {
      setLoading(false);
    }
  }, [doctorId, user.hospital]);

  const handleAuthorize = useCallback(async (e, requestId) => {
    e.preventDefault();
    if (!typedCode) return;
    setAuthorizing(true);
    try {
      const res = await fetch("/api/doctor/authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, doctorId, verificationCode: typedCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      alert("Surgical Verification Code accepted! Operation authorized — you may proceed to surgery.");
      setTypedCode("");
      setActiveReqId(null);
      fetchDashboardData();
    } catch (err) {
      alert("Authorization Failed: " + err.message);
    } finally {
      setAuthorizing(false);
    }
  }, [doctorId, fetchDashboardData, typedCode]);

  const handleComplete = useCallback(async (requestId) => {
    if (!window.confirm("Confirm that the transplant surgery has been completed successfully?")) return;
    setCompleting(requestId);
    try {
      const res = await fetch("/api/doctor/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, doctorId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Completion failed");
      alert("Surgery marked as completed. Operation logged to your surgical history.");
      fetchDashboardData();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setCompleting(null);
    }
  }, [doctorId, fetchDashboardData]);

  const runCompatibilityCheck = useCallback(async (request) => {
    try {
      const res = await fetch(
        `/api/compatibility?organ=${encodeURIComponent(request.organ)}&blood=${encodeURIComponent(request.blood)}`
      );
      const data = await res.json();
      setCheckedMatches((prev) => ({ ...prev, [request.id]: data.matches || [] }));
    } catch (err) {
      console.error("Compatibility check failed", err);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  function renderPatientReport(req) {
    return (
      <div style={styles.patientReport}>
        <div style={styles.reportHeader}>
          <strong>Patient Report — Case #{req.id}</strong>
          <button
            type="button"
            className="btn btn-outline"
            style={{ fontSize: "11px", padding: "4px 10px" }}
            onClick={() => setExpandedReport(expandedReport === req.id ? null : req.id)}
          >
            {expandedReport === req.id ? "Hide" : "View Report"}
          </button>
        </div>
        {expandedReport === req.id && (
          <div style={styles.reportBody}>
            <p><strong>Name:</strong> {req.patient_name || "Not recorded"}</p>
            <p><strong>Age:</strong> {req.patient_age ? `${req.patient_age} years` : "Not recorded"}</p>
            <p><strong>Organ Needed:</strong> {req.organ} | <strong>Blood:</strong> {req.blood}</p>
            <p><strong>Hospital:</strong> {req.hospital} ({req.location})</p>
            <p><strong>Urgency:</strong> <span style={styles.urgencyTag}>{req.urgency}</span></p>
            {req.patient_report ? (
              <div style={styles.reportText}>
                <strong>Clinical Notes:</strong>
                <p>{req.patient_report}</p>
              </div>
            ) : (
              <p style={{ fontStyle: "italic", color: "var(--muted)" }}>No detailed clinical report on file.</p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container">
      <div className="glass-card fade-in" style={styles.profile}>
        <div>
          <h2>👨‍⚕️ Surgeon Workstation</h2>
          <p>Welcome, <strong>{user.name}</strong> | Cardiac & Transplant Dept, {user.hospital}</p>
          <span style={styles.verified}>Doctor Credentials Verified</span>
        </div>
      </div>

      <div style={styles.stats}>
        <DashboardStatCard title="Awaiting Verification" value={stats.active} color="#dc2626" />
        <DashboardStatCard title="Authorized (In OR)" value={stats.authorized} color="#d97706" />
        <DashboardStatCard title="Completed Transplants" value={stats.completed} color="#16a34a" />
        <DashboardStatCard title="Local Organs Available" value={stats.totalOrgans} color="#10b981" />
      </div>

      {loading ? (
        <p>Loading workstation databases...</p>
      ) : (
        <div style={styles.contentGrid}>
          <div style={styles.mainCol}>
            {/* Pre-op Verification */}
            <div style={styles.sectionCard} className="glass-card">
              <h3 style={styles.sectTitle}>🔐 Surgical Verification Gateway</h3>
              <p style={styles.subtext}>
                Enter the Surgical Verification Code from Administration <strong>before starting surgery</strong>.
                This confirms your identity, validates the patient record, and unlocks the operation.
              </p>

              {allocatedOps.length === 0 ? (
                <p style={{ fontStyle: "italic", fontSize: "14px", color: "var(--muted)" }}>
                  No operations awaiting pre-surgery verification.
                </p>
              ) : (
                <div style={styles.opsList}>
                  {allocatedOps.map((op) => (
                    <div key={op.id} style={styles.opCard}>
                      <div style={styles.opHead}>
                        <div>
                          <strong>{op.organ} Transplant — Case #{op.id}</strong>
                          <p style={{ margin: "2px 0 0 0", fontSize: "13px" }}>
                            Patient: {op.patient_name || "Unknown"} | Blood: <strong>{op.blood}</strong> | {op.hospital}
                          </p>
                        </div>
                        <span style={styles.tagAwaiting}>Awaiting Code</span>
                      </div>

                      {renderPatientReport(op)}

                      {activeReqId === op.id ? (
                        <form onSubmit={(e) => handleAuthorize(e, op.id)} style={styles.verifyForm}>
                          <input
                            type="text"
                            placeholder="Enter Surgical Verification Code (e.g. ORE-123456)"
                            value={typedCode}
                            onChange={(e) => setTypedCode(e.target.value)}
                            required
                            style={styles.keyInput}
                          />
                          <button type="submit" className="btn btn-primary" disabled={authorizing} style={{ fontSize: "13px", padding: "8px 14px" }}>
                            {authorizing ? "Verifying..." : "Authorize & Unlock Surgery"}
                          </button>
                          <button type="button" className="btn btn-outline" onClick={() => { setActiveReqId(null); setTypedCode(""); }} style={{ fontSize: "13px", padding: "8px 14px" }}>
                            Cancel
                          </button>
                        </form>
                      ) : (
                        <button className="btn btn-primary" onClick={() => setActiveReqId(op.id)} style={{ marginTop: "12px", fontSize: "13px", padding: "8px 14px" }}>
                          Enter Verification Code
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Authorized — ready to complete */}
            {authorizedOps.length > 0 && (
              <div style={{ ...styles.sectionCard, marginTop: "24px" }} className="glass-card">
                <h3 style={styles.sectTitle}>🏥 Active Surgeries (Authorized)</h3>
                <p style={styles.subtext}>Operations verified and unlocked — mark complete after surgery.</p>
                <div style={styles.opsList}>
                  {authorizedOps.map((op) => (
                    <div key={op.id} style={styles.opCardAuthorized}>
                      <div style={styles.opHead}>
                        <div>
                          <strong>{op.organ} Transplant — Case #{op.id}</strong>
                          <p style={{ margin: "2px 0 0 0", fontSize: "13px" }}>
                            Patient: {op.patient_name || "Unknown"} | Blood: <strong>{op.blood}</strong>
                          </p>
                        </div>
                        <span style={styles.tagAuthorized}>Surgery Unlocked</span>
                      </div>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleComplete(op.id)}
                        disabled={completing === op.id}
                        style={{ marginTop: "12px", fontSize: "13px", padding: "8px 14px", background: "#16a34a" }}
                      >
                        {completing === op.id ? "Logging..." : "Mark Surgery Complete"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Compatibility Matching */}
            <div style={{ ...styles.sectionCard, marginTop: "24px" }} className="glass-card">
              <h3 style={styles.sectTitle}>🚑 Organ Compatibility Screening</h3>
              <p style={styles.subtext}>Screen nationwide organ inventory against patient blood type compatibility rules</p>

              {pendingRequests.length === 0 ? (
                <p style={{ fontStyle: "italic", fontSize: "14px", color: "var(--muted)" }}>No pending patient requests.</p>
              ) : (
                <div style={styles.patientList}>
                  {pendingRequests.map((req) => {
                    const matches = checkedMatches[req.id];
                    return (
                      <div key={req.id} style={styles.patientItem}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <strong>{req.organ} — {req.patient_name || `Case #${req.id}`}</strong>
                            <p style={{ margin: "2px 0", fontSize: "13px" }}>
                              {req.hospital} | Blood: <strong>{req.blood}</strong> | {req.urgency}
                            </p>
                          </div>
                          <button className="btn btn-outline" onClick={() => runCompatibilityCheck(req)} style={{ padding: "6px 12px", fontSize: "12.5px" }}>
                            Screen Organs
                          </button>
                        </div>
                        {expandedReport !== req.id && (
                          <button type="button" onClick={() => setExpandedReport(req.id)} style={styles.viewReportLink}>
                            View patient report →
                          </button>
                        )}
                        {expandedReport === req.id && renderPatientReport(req)}
                        {matches !== undefined && (
                          <div style={styles.matchResults}>
                            {matches.length === 0 ? (
                              <div style={styles.noMatch}>No compatible organs in network — contact Supervisor to request transfer.</div>
                            ) : (
                              <div style={styles.matchSuccess}>
                                <strong>{matches.length} compatible organ(s) found</strong>
                                <ul style={{ margin: "6px 0 0 0", paddingLeft: "20px", fontSize: "12px" }}>
                                  {matches.map((m) => (
                                    <li key={m.id}>Organ #{m.id} — {m.organ_type} ({m.blood_group}) at {m.hospital}</li>
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

          <div style={styles.sideCol}>
            <div style={styles.sectionCard} className="glass-card">
              <h3 style={styles.sectTitle}>📜 Surgical History</h3>
              <p style={styles.subtext}>Your personal operative performance records</p>
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
  profile: { padding: 20, borderRadius: 14, marginBottom: 20, backgroundColor: "rgba(255,255,255,0.7)" },
  verified: { background: "#dcfce7", color: "#166534", padding: "4px 10px", borderRadius: 12, fontSize: "12px", fontWeight: "700" },
  stats: { display: "flex", gap: 20, marginBottom: 24, flexWrap: "wrap" },
  contentGrid: { display: "flex", gap: "24px", flexWrap: "wrap", alignItems: "flex-start" },
  mainCol: { flex: "1 1 600px" },
  sideCol: { flex: "1 1 300px" },
  sectionCard: { padding: "24px", borderRadius: "16px", backgroundColor: "white" },
  sectTitle: { margin: "0 0 4px 0", color: "var(--accent)" },
  subtext: { margin: "0 0 16px 0", fontSize: "13px", color: "var(--muted)" },
  opsList: { display: "flex", flexDirection: "column", gap: "16px" },
  opCard: { padding: "20px", border: "1px solid #fee2e2", borderRadius: "12px", backgroundColor: "rgba(220,38,38,0.01)" },
  opCardAuthorized: { padding: "20px", border: "1px solid #bbf7d0", borderRadius: "12px", backgroundColor: "rgba(22,163,74,0.03)" },
  opHead: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  tagAwaiting: { background: "#fef3c7", color: "#d97706", fontSize: "11px", padding: "3px 8px", borderRadius: "8px", fontWeight: "700" },
  tagAuthorized: { background: "#dcfce7", color: "#166534", fontSize: "11px", padding: "3px 8px", borderRadius: "8px", fontWeight: "700" },
  verifyForm: { display: "flex", gap: "10px", marginTop: "16px", alignItems: "center", flexWrap: "wrap" },
  keyInput: { padding: "9px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.12)", fontSize: "14px", flex: 1, minWidth: "180px", outline: "none" },
  patientList: { display: "flex", flexDirection: "column", gap: "16px" },
  patientItem: { borderBottom: "1px solid rgba(0,0,0,0.05)", paddingBottom: "16px" },
  matchResults: { marginTop: "12px" },
  noMatch: { background: "#f8fafc", color: "#64748b", padding: "8px 12px", borderRadius: "8px", fontSize: "12.5px", border: "1px solid #e2e8f0" },
  matchSuccess: { background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", padding: "10px 14px", borderRadius: "8px", fontSize: "13px" },
  logList: { display: "flex", flexDirection: "column", gap: "14px" },
  logItem: { borderLeft: "2px solid var(--primary)", paddingLeft: "12px" },
  logTime: { fontSize: "11px", color: "var(--muted)", display: "block", marginBottom: "2px" },
  patientReport: { marginTop: "12px", padding: "12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" },
  reportHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  reportBody: { marginTop: "10px", fontSize: "13px" },
  reportText: { marginTop: "8px", padding: "10px", background: "white", borderRadius: "6px", border: "1px solid #e2e8f0" },
  urgencyTag: { background: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "700" },
  viewReportLink: { background: "none", border: "none", color: "var(--primary)", fontSize: "12px", cursor: "pointer", padding: "4px 0", marginTop: "4px" }
};

export default DoctorDashboard;
