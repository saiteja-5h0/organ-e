import React, { useEffect, useState, useCallback } from "react";
import "../styles/glass.css";
import "../styles/global.css";

const LIFECYCLE_STEPS = ["Pending", "Allocated", "Authorized", "Completed"];

function lifecycleIndex(status) {
  const idx = LIFECYCLE_STEPS.indexOf(status);
  return idx === -1 ? 0 : idx;
}

function AdminDashboard({ user }) {
  const [organs, setOrgans] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [trackedRequests, setTrackedRequests] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newOrganType, setNewOrganType] = useState("Kidney");
  const [newBloodGroup, setNewBloodGroup] = useState("O+");
  const [organSubmitting, setOrganSubmitting] = useState(false);

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedOrganId, setSelectedOrganId] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [allocating, setAllocating] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const orgRes = await fetch(`/api/organs?hospital=${encodeURIComponent(user.hospital)}`);
      setOrgans(await orgRes.json());

      const reqRes = await fetch("/api/requests?limit=100");
      const reqData = await reqRes.json();
      const allRequests = reqData.items || [];

      setPendingRequests(allRequests.filter((r) => r.status === "Pending"));
      setTrackedRequests(allRequests.filter((r) => r.status !== "Pending"));

      const docRes = await fetch("/api/doctors");
      setDoctors(await docRes.json());
    } catch (err) {
      console.error("Failed to load admin dashboard data", err);
    } finally {
      setLoading(false);
    }
  }, [user.hospital]);

  const handleAddOrgan = useCallback(async (e) => {
    e.preventDefault();
    setOrganSubmitting(true);
    try {
      const res = await fetch("/api/organs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organ_type: newOrganType,
          blood_group: newBloodGroup,
          status: "Available",
          hospital: user.hospital
        })
      });
      if (!res.ok) throw new Error("Failed to add organ");
      const added = await res.json();
      setOrgans((prev) => [added, ...prev]);
      alert(`Organ logged — Reference ID #${added.id}`);
    } catch (err) {
      alert("Error adding organ: " + err.message);
    } finally {
      setOrganSubmitting(false);
    }
  }, [user.hospital, newOrganType, newBloodGroup]);

  const openAllocateModal = useCallback((request) => {
    setSelectedRequest(request);
    setGeneratedCode("");
    setSelectedOrganId("");
    setSelectedDoctorId("");
  }, []);

  const handleAllocate = useCallback(async (e) => {
    e.preventDefault();
    if (!selectedOrganId || !selectedDoctorId) {
      alert("Please select both a matching organ and a surgeon");
      return;
    }
    setAllocating(true);
    try {
      const res = await fetch("/api/admit/allocate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          doctorId: Number(selectedDoctorId),
          organId: Number(selectedOrganId)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Allocation failed");
      setGeneratedCode(data.verification_code);
      alert(`Allocation successful!\n\nSurgical Verification Code: ${data.verification_code}\n\nShare this code with the assigned surgeon — they must enter it before starting surgery.`);
      setSelectedRequest(null);
      fetchData();
    } catch (err) {
      alert("Allocation error: " + err.message);
    } finally {
      setAllocating(false);
    }
  }, [fetchData, selectedDoctorId, selectedOrganId, selectedRequest]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const matchingOrgans = selectedRequest
    ? organs.filter(
        (o) =>
          o.status === "Available" &&
          o.organ_type.toLowerCase() === selectedRequest.organ.toLowerCase() &&
          o.blood_group.toLowerCase() === selectedRequest.blood.toLowerCase()
      )
    : [];

  function renderLifecycle(status) {
    const current = lifecycleIndex(status);
    return (
      <div style={styles.lifecycle}>
        {LIFECYCLE_STEPS.map((step, i) => (
          <div key={step} style={styles.lifecycleStep}>
            <div style={{
              ...styles.lifecycleDot,
              background: i <= current ? (i === current ? "#dc2626" : "#16a34a") : "#e2e8f0",
              color: i <= current ? "white" : "#94a3b8"
            }}>
              {i < current ? "✓" : i + 1}
            </div>
            <span style={{ ...styles.lifecycleLabel, fontWeight: i === current ? "700" : "400", color: i <= current ? "var(--text)" : "var(--muted)" }}>
              {step}
            </span>
            {i < LIFECYCLE_STEPS.length - 1 && <div style={{ ...styles.lifecycleLine, background: i < current ? "#16a34a" : "#e2e8f0" }} />}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.profile} className="glass-card fade-in">
        <div>
          <h2>🏥 Admin Coordination Portal</h2>
          <p>Logged in as: <strong>{user.name}</strong> ({user.hospital}, {user.location})</p>
          <span style={styles.badge}>Admit Coordinator — Organ Lifecycle Management</span>
        </div>
      </div>

      {loading ? (
        <p>Loading dashboard data...</p>
      ) : (
        <div style={styles.grid}>
          <div style={styles.leftCol}>
            <div style={styles.card} className="glass-card">
              <h3>📦 Receive Organ into Stock</h3>
              <p style={styles.mutedText}>Log incoming donor organ from receipt to storage vault</p>
              <form onSubmit={handleAddOrgan} style={styles.organForm}>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: "120px" }}>
                    <label style={styles.label}>Organ Type</label>
                    <select value={newOrganType} onChange={(e) => setNewOrganType(e.target.value)} style={styles.select}>
                      <option>Kidney</option><option>Liver</option><option>Heart</option><option>Lung</option><option>Cornea</option>
                    </select>
                  </div>
                  <div style={{ flex: 1, minWidth: "80px" }}>
                    <label style={styles.label}>Blood Group</label>
                    <select value={newBloodGroup} onChange={(e) => setNewBloodGroup(e.target.value)} style={styles.select}>
                      <option>O+</option><option>O-</option><option>A+</option><option>A-</option>
                      <option>B+</option><option>B-</option><option>AB+</option><option>AB-</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" disabled={organSubmitting} style={{ width: "100%", justifyContent: "center", marginTop: "14px" }}>
                  {organSubmitting ? "Logging..." : "Log Organ to Inventory"}
                </button>
              </form>
            </div>

            <div style={{ ...styles.card, marginTop: "24px" }} className="glass-card">
              <h3>📋 Organ Inventory — {user.hospital}</h3>
              <p style={styles.mutedText}>Track organs from receipt through operating theatre</p>
              {organs.length === 0 ? (
                <p style={{ fontSize: "14px", fontStyle: "italic" }}>No organ stock logged yet.</p>
              ) : (
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.tr}>
                        <th style={styles.th}>ID</th>
                        <th style={styles.th}>Organ</th>
                        <th style={styles.th}>Blood</th>
                        <th style={styles.th}>Lifecycle Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {organs.map((o) => (
                        <tr key={o.id} style={styles.tr}>
                          <td style={styles.td}>#{o.id}</td>
                          <td style={styles.td}><strong>{o.organ_type}</strong></td>
                          <td style={styles.td}>{o.blood_group}</td>
                          <td style={styles.td}>
                            <span style={{
                              ...styles.statusBadge,
                              backgroundColor: o.status === "Available" ? "#dcfce7" : o.status === "Sent to OR" ? "#fef3c7" : o.status === "In Transit" ? "#e0f2fe" : "#e2e8f0",
                              color: o.status === "Available" ? "#166534" : o.status === "Sent to OR" ? "#92400e" : o.status === "In Transit" ? "#0369a1" : "#475569"
                            }}>
                              {o.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div style={styles.rightCol}>
            <div style={styles.card} className="glass-card">
              <h3>🚨 Pending Transplant Requests</h3>
              <p style={styles.mutedText}>Allocate matching organ and surgeon for each patient</p>
              {pendingRequests.length === 0 ? (
                <p style={{ fontSize: "14px", fontStyle: "italic", color: "var(--success)" }}>No pending requests.</p>
              ) : (
                <div style={styles.requestList}>
                  {pendingRequests.map((r) => (
                    <div key={r.id} style={styles.requestListItem}>
                      <div>
                        <strong>{r.organ} — {r.patient_name || `Case #${r.id}`}</strong>
                        <p style={{ margin: "2px 0 0 0", fontSize: "13px" }}>
                          {r.hospital} | Blood: <strong>{r.blood}</strong> | {r.urgency}
                        </p>
                        {r.patient_report && (
                          <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--muted)" }}>
                            Report: {r.patient_report.slice(0, 80)}{r.patient_report.length > 80 ? "..." : ""}
                          </p>
                        )}
                      </div>
                      <button className="btn btn-outline" onClick={() => openAllocateModal(r)} style={{ fontSize: "13px", padding: "6px 12px" }}>
                        Match & Allocate
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ ...styles.card, marginTop: "24px" }} className="glass-card">
              <h3>✅ Coordination & Lifecycle Tracking</h3>
              <p style={styles.mutedText}>Monitor organ journey from allocation to completed transplant</p>
              {trackedRequests.length === 0 ? (
                <p style={{ fontSize: "14px", fontStyle: "italic" }}>No active allocations yet.</p>
              ) : (
                <div style={styles.requestList}>
                  {trackedRequests.map((r) => {
                    const matchedDoc = doctors.find((d) => d.id === r.allocated_doctor_id);
                    return (
                      <div key={r.id} style={styles.allocatedItem}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <strong>{r.organ} — {r.patient_name || `Case #${r.id}`}</strong>
                          <span style={{
                            ...styles.statusBadge,
                            backgroundColor: r.status === "Completed" ? "#dcfce7" : r.status === "Authorized" ? "#fef3c7" : "#e0f2fe",
                            color: r.status === "Completed" ? "#166534" : r.status === "Authorized" ? "#92400e" : "#0369a1"
                          }}>
                            {r.status}
                          </span>
                        </div>
                        {renderLifecycle(r.status)}
                        <div style={{ fontSize: "13px", marginTop: "10px", color: "var(--text)" }}>
                          <p style={{ margin: "2px 0" }}>Patient Blood: <strong>{r.blood}</strong></p>
                          <p style={{ margin: "2px 0" }}>Surgeon: <strong>{matchedDoc ? matchedDoc.name : "Unassigned"}</strong></p>
                          {r.verification_code && (
                            <p style={{ margin: "2px 0" }}>
                              Verification Code: <code style={styles.code}>{r.verification_code}</code>
                              {r.status === "Allocated" && <span style={{ color: "#d97706", fontSize: "11px" }}> — awaiting surgeon entry</span>}
                              {r.status === "Authorized" && <span style={{ color: "#16a34a", fontSize: "11px" }}> — verified, surgery in progress</span>}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedRequest && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent} className="glass-card fade-in">
            <h3>⚙️ Match & Allocate</h3>
            <p style={{ fontSize: "13px", color: "var(--muted)", margin: "4px 0" }}>
              Patient: <strong>{selectedRequest.patient_name || `Case #${selectedRequest.id}`}</strong> — {selectedRequest.organ} ({selectedRequest.blood})
            </p>

            <form onSubmit={handleAllocate} style={styles.modalForm}>
              <div style={styles.formGroup}>
                <label>1. Select Matching Organ</label>
                {matchingOrgans.length === 0 ? (
                  <div style={styles.matchError}>
                    No matching organ in local stock. Contact Supervisor to request organ from network hospitals.
                  </div>
                ) : (
                  <select value={selectedOrganId} onChange={(e) => setSelectedOrganId(e.target.value)} required style={styles.select}>
                    <option value="">-- Choose Organ --</option>
                    {matchingOrgans.map((o) => (
                      <option key={o.id} value={o.id}>Organ #{o.id} — {o.organ_type} ({o.blood_group})</option>
                    ))}
                  </select>
                )}
              </div>

              <div style={styles.formGroup}>
                <label>2. Assign Surgeon</label>
                <select value={selectedDoctorId} onChange={(e) => setSelectedDoctorId(e.target.value)} required style={styles.select}>
                  <option value="">-- Choose Surgeon --</option>
                  {doctors.filter((d) => d.hospital === user.hospital).map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label>3. Surgical Verification Code</label>
                <div style={styles.handshakeBox}>
                  <p style={{ fontSize: "13px", margin: 0, color: "var(--muted)" }}>
                    A unique verification code will be generated automatically when you allocate.
                    The surgeon must enter this code <strong>before starting surgery</strong>.
                  </p>
                  {generatedCode && <code style={{ fontSize: "18px", letterSpacing: "1px", display: "block", marginTop: "8px" }}>{generatedCode}</code>}
                </div>
              </div>

              <div style={styles.modalActions}>
                <button type="submit" className="btn btn-primary" disabled={allocating || matchingOrgans.length === 0} style={{ flex: 1, justifyContent: "center" }}>
                  {allocating ? "Allocating..." : "Allocate & Generate Code"}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setSelectedRequest(null)} style={{ flex: 1, justifyContent: "center" }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: "1200px", margin: "0 auto", padding: "20px" },
  profile: { padding: "20px 30px", borderRadius: "16px", marginBottom: "24px", backgroundColor: "rgba(255,255,255,0.7)" },
  badge: { background: "#fee2e2", color: "#b91c1c", padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: "700", display: "inline-block", marginTop: "8px" },
  grid: { display: "flex", gap: "28px", flexWrap: "wrap", alignItems: "flex-start" },
  leftCol: { flex: "1 1 450px" },
  rightCol: { flex: "1 1 500px" },
  card: { padding: "24px", borderRadius: "16px", backgroundColor: "white" },
  mutedText: { fontSize: "13px", color: "var(--muted)", margin: "0 0 16px 0" },
  organForm: { display: "flex", flexDirection: "column", gap: "12px" },
  label: { fontWeight: "600", fontSize: "12px", color: "var(--accent)", display: "block", marginBottom: "4px" },
  select: { width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.12)", fontSize: "14px" },
  tableWrapper: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "13px" },
  tr: { borderBottom: "1px solid rgba(0,0,0,0.06)" },
  th: { textAlign: "left", padding: "8px", color: "var(--muted)", fontWeight: "600" },
  td: { padding: "10px 8px" },
  statusBadge: { padding: "3px 8px", borderRadius: "8px", fontSize: "11px", fontWeight: "600" },
  requestList: { display: "flex", flexDirection: "column", gap: "12px" },
  requestListItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", borderRadius: "10px", border: "1px solid #fee2e2", backgroundColor: "rgba(220, 38, 38, 0.02)" },
  allocatedItem: { padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", backgroundColor: "#fcfdfe" },
  code: { background: "#fee2e2", padding: "2px 6px", borderRadius: "4px", color: "#b91c1c", fontFamily: "monospace", fontWeight: "600" },
  lifecycle: { display: "flex", alignItems: "center", marginTop: "12px", gap: "4px" },
  lifecycleStep: { display: "flex", alignItems: "center", flex: 1 },
  lifecycleDot: { width: "22px", height: "22px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "700", flexShrink: 0 },
  lifecycleLabel: { fontSize: "10px", marginLeft: "4px", whiteSpace: "nowrap" },
  lifecycleLine: { flex: 1, height: "2px", margin: "0 4px" },
  modalOverlay: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  modalContent: { backgroundColor: "white", width: "100%", maxWidth: "500px", padding: "30px", borderRadius: "16px", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" },
  modalForm: { display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" },
  formGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  matchError: { background: "#fee2e2", color: "#991b1b", padding: "12px", borderRadius: "8px", fontSize: "13px", lineHeight: "1.4" },
  handshakeBox: { background: "#f8fafc", border: "1px dashed #cbd5e1", padding: "12px", borderRadius: "8px", textAlign: "center" },
  modalActions: { display: "flex", gap: "12px", marginTop: "10px" }
};

export default AdminDashboard;
