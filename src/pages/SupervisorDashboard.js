import React, { useEffect, useState, useCallback } from "react";
import "../styles/glass.css";
import "../styles/global.css";

function SupervisorDashboard({ user }) {
  const [transfers, setTransfers] = useState([]);
  const [localOrgans, setLocalOrgans] = useState([]);
  const [allOrgans, setAllOrgans] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

  const [targetHospital, setTargetHospital] = useState("");
  const [organType, setOrganType] = useState("Kidney");
  const [bloodGroup, setBloodGroup] = useState("O+");
  const [submitting, setSubmitting] = useState(false);

  const [unfulfilledRequests, setUnfulfilledRequests] = useState([]);
  const [checkedMatches, setCheckedMatches] = useState({});
  const [checkingMatchId, setCheckingMatchId] = useState(null);

  const fetchTransfersData = useCallback(async () => {
    setLoading(true);
    try {
      const [transRes, orgRes, hospRes, reqRes] = await Promise.all([
        fetch(`/api/supervisor/transfers?hospital=${encodeURIComponent(user.hospital)}`),
        fetch(`/api/organs?hospital=${encodeURIComponent(user.hospital)}`),
        fetch("/api/hospitals"),
        fetch("/api/requests?limit=100")
      ]);

      setTransfers(await transRes.json());
      const orgData = await orgRes.json();
      setLocalOrgans(orgData.filter((o) => o.status === "Available"));
      setAllOrgans(orgData);

      const hospData = await hospRes.json();
      const others = hospData.filter((h) => h !== user.hospital);
      setHospitals(others);
      if (!targetHospital && others.length > 0) setTargetHospital(others[0]);

      const reqList = await reqRes.json();
      const myPendingRequests = (reqList.items || []).filter(
        (r) => r.status === "Pending" && r.hospital === user.hospital
      );
      setUnfulfilledRequests(myPendingRequests);
    } catch (err) {
      console.error("Error loading supervisor data", err);
    } finally {
      setLoading(false);
    }
  }, [user.hospital, targetHospital]);

  const handleCreateTransfer = useCallback(async (e) => {
    e.preventDefault();
    if (targetHospital === user.hospital) {
      alert("Destination hospital cannot match your hospital.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/supervisor/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organ_type: organType,
          blood_group: bloodGroup,
          from_hospital: targetHospital,
          to_hospital: user.hospital
        })
      });
      if (!res.ok) throw new Error("Failed to post network transfer");
      alert(`Organ request sent to ${targetHospital}. Awaiting their supervisor to approve and ship.`);
      fetchTransfersData();
    } catch (err) {
      alert("Error requesting transfer: " + err.message);
    } finally {
      setSubmitting(false);
    }
  }, [fetchTransfersData, bloodGroup, organType, targetHospital, user.hospital]);

  const runNetworkCompatibilityCheck = useCallback(async (request) => {
    setCheckingMatchId(request.id);
    try {
      const res = await fetch(
        `/api/compatibility?organ=${encodeURIComponent(request.organ)}&blood=${encodeURIComponent(request.blood)}`
      );
      const data = await res.json();
      // Only keep matches from other hospitals
      const networkMatches = (data.matches || []).filter((o) => o.hospital !== user.hospital);
      setCheckedMatches((prev) => ({ ...prev, [request.id]: networkMatches }));
    } catch (err) {
      console.error("Network screening failed", err);
      alert("Screening failed: " + err.message);
    } finally {
      setCheckingMatchId(null);
    }
  }, [user.hospital]);

  const handleRequestFromNetwork = useCallback(async (request, sourceHospital) => {
    try {
      const res = await fetch("/api/supervisor/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organ_type: request.organ,
          blood_group: request.blood,
          from_hospital: sourceHospital,
          to_hospital: user.hospital
        })
      });
      if (!res.ok) throw new Error("Failed to post network transfer");
      alert(`Organ request sent to ${sourceHospital}. Awaiting remote supervisor approval.`);
      setCheckedMatches(prev => {
        const copy = { ...prev };
        delete copy[request.id];
        return copy;
      });
      fetchTransfersData();
    } catch (err) {
      alert("Error requesting transfer: " + err.message);
    }
  }, [fetchTransfersData, user.hospital]);

  const handleUpdateStatus = useCallback(async (transferId, newStatus) => {
    try {
      const res = await fetch(`/api/supervisor/transfers/${transferId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update transfer");
      if (newStatus === "Accepted") {
        alert("Organ approved and dispatched! Status set to In Transit.");
      } else if (newStatus === "Completed") {
        alert("Organ received and added to your hospital inventory!");
      } else {
        alert(`Transfer status updated to: ${newStatus}`);
      }
      fetchTransfersData();
    } catch (err) {
      alert("Error: " + err.message);
    }
  }, [fetchTransfersData]);

  useEffect(() => {
    fetchTransfersData();
  }, [fetchTransfersData]);

  const outgoingTransfers = transfers.filter((t) => t.to_hospital === user.hospital);
  const incomingTransfers = transfers.filter((t) => t.from_hospital === user.hospital);

  return (
    <div style={styles.container}>
      <div style={styles.profile} className="glass-card fade-in">
        <div>
          <h2>📡 Hospital Network Supervisor Portal</h2>
          <p>
            Coordinator <strong>{user.name}</strong> | {user.hospital} — Connected to national organ network
          </p>
          <span style={styles.badge}>Supervisor — Inter-Hospital Organ Coordination</span>
        </div>
      </div>

      {loading ? (
        <p>Loading network grid...</p>
      ) : (
        <div style={styles.grid}>
          <div style={styles.leftCol}>
            <div style={styles.card} className="glass-card">
              <h3>📋 Unfulfilled Patient Requests ({user.hospital})</h3>
              <p style={styles.mutedText}>
                Identify pending patient requests at our hospital and search the network for compatible donor organs.
              </p>
              {unfulfilledRequests.length === 0 ? (
                <p style={{ fontSize: "14px", fontStyle: "italic", color: "var(--success)" }}>
                  ✓ All patient requests matched or resolved.
                </p>
              ) : (
                <div style={styles.transfersList}>
                  {unfulfilledRequests.map((req) => {
                    const matches = checkedMatches[req.id];
                    return (
                      <div key={req.id} style={{ ...styles.transferItem, borderColor: "#cbd5e1", backgroundColor: "rgba(0,0,0,0.01)", marginBottom: "12px", borderStyle: "solid" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <strong>{req.organ} ({req.blood})</strong>
                            <p style={{ margin: "4px 0 0 0", fontSize: "13px" }}>
                              Patient: <strong>{req.patient_name || `Case #${req.id}`}</strong> | Urgency: <span style={{ color: "#dc2626", fontWeight: "600" }}>{req.urgency}</span>
                            </p>
                          </div>
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => runNetworkCompatibilityCheck(req)}
                            disabled={checkingMatchId === req.id}
                            style={{ fontSize: "11px", padding: "6px 12px" }}
                          >
                            {checkingMatchId === req.id ? "Screening..." : "Scan Network Matches"}
                          </button>
                        </div>

                        {matches !== undefined && (
                          <div style={{ marginTop: "12px", borderTop: "1px dashed rgba(0,0,0,0.1)", paddingTop: "10px" }}>
                            {matches.length === 0 ? (
                              <div style={{ color: "#ef4444", fontSize: "12px", fontWeight: "600" }}>
                                ⚠️ No compatible organs found in the national network.
                              </div>
                            ) : (
                              <div>
                                <span style={{ fontSize: "12px", fontWeight: "700", color: "#166534", display: "block", marginBottom: "6px" }}>
                                  ✓ {matches.length} compatible network matches found:
                                </span>
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                  {matches.map((m) => (
                                    <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "6px 10px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                                      <span style={{ fontSize: "12px" }}>
                                        Organ #{m.id} at <strong>{m.hospital}</strong>
                                      </span>
                                      <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={() => handleRequestFromNetwork(req, m.hospital)}
                                        style={{ fontSize: "10px", padding: "4px 8px", minHeight: "auto" }}
                                      >
                                        Request Transfer
                                      </button>
                                    </div>
                                  ))}
                                </div>
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

            <div style={{ ...styles.card, marginTop: "24px" }} className="glass-card">
              <h3>📡 Request Organ from Network Hospital</h3>
              <p style={styles.mutedText}>
                When your hospital lacks a matching organ, request one from another facility in the network.
                The remote supervisor will review and ship compatible organs to you.
              </p>

              <form onSubmit={handleCreateTransfer} style={styles.form}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Request From (Source Hospital)</label>
                  <select value={targetHospital} onChange={(e) => setTargetHospital(e.target.value)} style={styles.select} required>
                    {hospitals.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <div style={{ ...styles.formGroup, flex: 1 }}>
                    <label style={styles.label}>Organ Type</label>
                    <select value={organType} onChange={(e) => setOrganType(e.target.value)} style={styles.select}>
                      <option>Kidney</option><option>Liver</option><option>Heart</option><option>Lung</option><option>Cornea</option>
                    </select>
                  </div>
                  <div style={{ ...styles.formGroup, flex: 1 }}>
                    <label style={styles.label}>Blood Group</label>
                    <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} style={styles.select}>
                      <option>O+</option><option>O-</option><option>A+</option><option>A-</option>
                      <option>B+</option><option>B-</option><option>AB+</option><option>AB-</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: "100%", justifyContent: "center", marginTop: "14px" }}>
                  {submitting ? "Sending Request..." : "Send Organ Request to Network"}
                </button>
              </form>
            </div>

            <div style={{ ...styles.card, marginTop: "24px" }} className="glass-card">
              <h3>📤 Outgoing Requests (We Requested)</h3>
              <p style={styles.mutedText}>Organs requested from other hospitals for our patients</p>
              {outgoingTransfers.length === 0 ? (
                <p style={{ fontSize: "14px", fontStyle: "italic" }}>No outgoing requests.</p>
              ) : (
                <div style={styles.transfersList}>
                  {outgoingTransfers.map((t) => (
                    <div key={t.id} style={styles.transferItem}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <strong>{t.organ_type} ({t.blood_group})</strong>
                        <span style={statusStyle(t.status)}>{t.status}</span>
                      </div>
                      <p style={{ margin: "4px 0 0 0", fontSize: "12px" }}>
                        From: <strong>{t.from_hospital}</strong>
                        {t.organ_id && <> | Organ #{t.organ_id}</>}
                      </p>
                      {t.status === "In Transit" && (
                        <button
                          className="btn btn-primary"
                          onClick={() => handleUpdateStatus(t.id, "Completed")}
                          style={{ marginTop: "10px", fontSize: "12px", padding: "6px 12px", width: "100%", justifyContent: "center" }}
                        >
                          Confirm Organ Received
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={styles.rightCol}>
            <div style={styles.card} className="glass-card">
              <h3>📥 Incoming Requests (Others Need From Us)</h3>
              <p style={styles.mutedText}>Other hospitals requesting organs from our inventory</p>
              {incomingTransfers.length === 0 ? (
                <p style={{ fontSize: "14px", fontStyle: "italic", color: "var(--success)" }}>No incoming requests.</p>
              ) : (
                <div style={styles.transfersList}>
                  {incomingTransfers.map((t) => {
                    const isAvailableLocally = localOrgans.some(
                      (o) =>
                        o.organ_type.toLowerCase() === t.organ_type.toLowerCase() &&
                        o.blood_group.toLowerCase() === t.blood_group.toLowerCase()
                    );
                    return (
                      <div key={t.id} style={styles.transferItem}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <strong>{t.organ_type} ({t.blood_group})</strong>
                          <span style={statusStyle(t.status)}>{t.status}</span>
                        </div>
                        <p style={{ margin: "4px 0", fontSize: "12px" }}>
                          Requested by: <strong>{t.to_hospital}</strong>
                          {t.organ_id && <> | Shipping Organ #{t.organ_id}</>}
                        </p>
                        <div style={{ marginTop: "8px", fontSize: "12px" }}>
                          Stock: {isAvailableLocally ? (
                            <strong style={{ color: "var(--success)" }}>Available locally</strong>
                          ) : (
                            <strong style={{ color: "#ef4444" }}>Not in stock</strong>
                          )}
                        </div>
                        {t.status === "Requested" && (
                          <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                            <button
                              className="btn btn-primary"
                              disabled={!isAvailableLocally}
                              onClick={() => handleUpdateStatus(t.id, "Accepted")}
                              style={{ flex: 1, fontSize: "11px", padding: "6px 12px", justifyContent: "center" }}
                            >
                              Approve & Ship Organ
                            </button>
                            <button
                              className="btn btn-outline"
                              onClick={() => handleUpdateStatus(t.id, "Declined")}
                              style={{ flex: 1, fontSize: "11px", padding: "6px 12px", justifyContent: "center" }}
                            >
                              Decline
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ ...styles.card, marginTop: "24px" }} className="glass-card">
              <h3>🏥 Our Hospital Inventory</h3>
              <p style={styles.mutedText}>Organs available for network sharing at {user.hospital}</p>
              {localOrgans.length === 0 ? (
                <p style={{ fontSize: "14px", fontStyle: "italic" }}>No available organs in stock.</p>
              ) : (
                <div style={styles.transfersList}>
                  {localOrgans.map((o) => (
                    <div key={o.id} style={{ ...styles.transferItem, borderColor: "#bbf7d0" }}>
                      <strong>#{o.id} — {o.organ_type} ({o.blood_group})</strong>
                      <span style={{ fontSize: "12px", color: "var(--success)" }}>Available for transfer</span>
                    </div>
                  ))}
                </div>
              )}
              {allOrgans.filter((o) => o.status === "In Transit").length > 0 && (
                <div style={{ marginTop: "12px" }}>
                  <p style={{ fontSize: "12px", fontWeight: "600", color: "var(--muted)" }}>In Transit:</p>
                  {allOrgans.filter((o) => o.status === "In Transit").map((o) => (
                    <p key={o.id} style={{ fontSize: "12px", margin: "4px 0" }}>#{o.id} {o.organ_type} ({o.blood_group})</p>
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

function statusStyle(status) {
  const map = {
    Requested: { background: "#fef3c7", color: "#d97706" },
    Accepted: { background: "#e0f2fe", color: "#0369a1" },
    "In Transit": { background: "#dbeafe", color: "#1d4ed8" },
    Completed: { background: "#dcfce7", color: "#166534" },
    Declined: { background: "#fee2e2", color: "#b91c1c" }
  };
  return { ...styles.statusBadge, ...(map[status] || map.Requested) };
}

const styles = {
  container: { maxWidth: "1200px", margin: "0 auto", padding: "20px" },
  profile: { padding: "20px 30px", borderRadius: "16px", marginBottom: "24px", backgroundColor: "rgba(255,255,255,0.7)" },
  badge: { background: "#dbeafe", color: "#1d4ed8", padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: "700", display: "inline-block", marginTop: "8px" },
  grid: { display: "flex", gap: "28px", flexWrap: "wrap", alignItems: "flex-start" },
  leftCol: { flex: "1 1 450px" },
  rightCol: { flex: "1 1 500px" },
  card: { padding: "24px", borderRadius: "16px", backgroundColor: "white" },
  mutedText: { fontSize: "13px", color: "var(--muted)", margin: "0 0 16px 0" },
  form: { display: "flex", flexDirection: "column", gap: "12px" },
  formGroup: { display: "flex", flexDirection: "column" },
  label: { fontWeight: "600", fontSize: "12px", color: "var(--accent)", display: "block", marginBottom: "4px" },
  select: { width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.12)", fontSize: "14px" },
  transfersList: { display: "flex", flexDirection: "column", gap: "12px" },
  transferItem: { padding: "16px", borderRadius: "10px", border: "1px solid #fee2e2", backgroundColor: "rgba(220, 38, 38, 0.01)" },
  statusBadge: { padding: "3px 8px", borderRadius: "8px", fontSize: "11px", fontWeight: "600" }
};

export default SupervisorDashboard;
