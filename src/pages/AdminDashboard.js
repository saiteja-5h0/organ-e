import React, { useEffect, useState, useCallback } from "react";
import "../styles/glass.css";
import "../styles/global.css";

function AdminDashboard({ user }) {
    const [organs, setOrgans] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [allocatedRequests, setAllocatedRequests] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form block for adding new organs
    const [newOrganType, setNewOrganType] = useState("Kidney");
    const [newBloodGroup, setNewBloodGroup] = useState("O+");
    const [organSubmitting, setOrganSubmitting] = useState(false);

    // Allocation Modal State
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [selectedOrganId, setSelectedOrganId] = useState("");
    const [selectedDoctorId, setSelectedDoctorId] = useState("");
    const [generatedCode, setGeneratedCode] = useState("");
    const [allocating, setAllocating] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Fetch organs for this hospital
            const orgRes = await fetch(`/api/organs?hospital=${encodeURIComponent(user.hospital)}`);
            const orgData = await orgRes.json();
            setOrgans(orgData);

            // 2. Fetch requests (all)
            const reqRes = await fetch("/api/requests?limit=100");
            const reqData = await reqRes.json();
            const allRequests = reqData.items || [];

            // Separate pending vs allocated/completed
            setPendingRequests(allRequests.filter(r => r.status === "Pending"));
            setAllocatedRequests(allRequests.filter(r => r.status === "Allocated" || r.status === "Completed"));

            // 3. Fetch doctors
            const docRes = await fetch("/api/doctors");
            const docData = await docRes.json();
            setDoctors(docData);
        } catch (err) {
            console.error("Failed to load admin dashboard data", err);
        } finally {
            setLoading(false);
        }
    }, [user]);

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
            alert(`Organ stock registry successfully logged reference ID #${added.id}`);
        } catch (err) {
            alert("Error adding organ: " + err.message);
        } finally {
            setOrganSubmitting(false);
        }
    }, [user, newOrganType, newBloodGroup]);

    const openAllocateModal = useCallback((request) => {
        setSelectedRequest(request);
        const code = `ORE-${Math.floor(100000 + Math.random() * 900000)}`;
        setGeneratedCode(code);
        setSelectedOrganId("");
        setSelectedDoctorId("");
    }, []);

    const handleAllocate = useCallback(async (e) => {
        e.preventDefault();
        if (!selectedOrganId || !selectedDoctorId) {
            alert("Please select both a matching organ and an allocatee doctor");
            return;
        }
        setAllocating(true);
        try {
            const res = await fetch("/api/admit/allocate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    requestId: selectedRequest,
                    doctorId: Number(selectedDoctorId),
                    organId: Number(selectedOrganId),
                    verificationCode: generatedCode
                })
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Allocation failed");
            }
            setSelectedRequest(null);
            alert("Doctor and organ allocated successfully! Verification code is " + generatedCode);
            fetchData();
        } catch (err) {
            alert("Allocation error: " + err.message);
        } finally {
            setAllocating(false);
        }
    }, [
  fetchData,
  generatedCode,
  selectedDoctorId,
  selectedOrganId,
  selectedRequest
]);

    useEffect(() => {
        fetchData();
    }, [
    fetchData,
    generatedCode,
    selectedDoctorId,
    selectedOrganId,
    selectedRequest
]);

    // Filter available organs that match the selected request's organ and blood group
    const matchingOrgans = selectedRequest
        ? organs.filter(
            (o) =>
                o.status === "Available" &&
                o.organ_type.toLowerCase() === selectedRequest.organ.toLowerCase() &&
                o.blood_group.toLowerCase() === selectedRequest.blood.toLowerCase()
        )
        : [];

    return (
        <div style={styles.container}>
            {/* Profile summary banner */}
            <div style={styles.profile} className="glass-card fade-in">
                <div>
                    <h2>🏥 Admin Admit coordination workspace</h2>
                    <p>Logged in as: <strong>{user.name}</strong> ({user.hospital}, {user.location})</p>
                    <span style={styles.badge}>Admit Coordinator Admin</span>
                </div>
            </div>

            {loading ? (
                <p>Loading dashboard data...</p>
            ) : (
                <div style={styles.grid}>
                    {/* Column Left: Intake and Available Organs Inventory */}
                    <div style={styles.leftCol}>
                        {/* Intake Form */}
                        <div style={styles.card} className="glass-card">
                            <h3>📦 Add Received Organ to Stock</h3>
                            <p style={styles.mutedText}>Log incoming donor organ package received at ER</p>
                            <form onSubmit={handleAddOrgan} style={styles.organForm}>
                                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                    <div style={{ flex: 1, minWidth: "120px" }}>
                                        <label style={styles.label}>Organ Type</label>
                                        <select
                                            value={newOrganType}
                                            onChange={(e) => setNewOrganType(e.target.value)}
                                            style={styles.select}
                                        >
                                            <option>Kidney</option>
                                            <option>Liver</option>
                                            <option>Heart</option>
                                            <option>Lung</option>
                                            <option>Cornea</option>
                                        </select>
                                    </div>
                                    <div style={{ flex: 1, minWidth: "80px" }}>
                                        <label style={styles.label}>Blood Group</label>
                                        <select
                                            value={newBloodGroup}
                                            onChange={(e) => setNewBloodGroup(e.target.value)}
                                            style={styles.select}
                                        >
                                            <option>O+</option>
                                            <option>O-</option>
                                            <option>A+</option>
                                            <option>A-</option>
                                            <option>B+</option>
                                            <option>B-</option>
                                            <option>AB+</option>
                                            <option>AB-</option>
                                        </select>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={organSubmitting}
                                    style={{ width: "100%", justifyContent: "center", marginTop: "14px" }}
                                >
                                    {organSubmitting ? "Logging Stock..." : "Log Organ Stock Item"}
                                </button>
                            </form>
                        </div>

                        {/* Inventory table */}
                        <div style={{ ...styles.card, marginTop: "24px" }} className="glass-card">
                            <h3>📋 Local Organs in Stock</h3>
                            <p style={styles.mutedText}>Available at {user.hospital} storage vaults</p>
                            {organs.length === 0 ? (
                                <p style={{ fontSize: "14px", fontStyle: "italic" }}>No local organ stock logged yet.</p>
                            ) : (
                                <div style={styles.tableWrapper}>
                                    <table style={styles.table}>
                                        <thead>
                                            <tr style={styles.tr}>
                                                <th style={styles.th}>ID</th>
                                                <th style={styles.th}>Organ</th>
                                                <th style={styles.th}>Blood</th>
                                                <th style={styles.th}>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {organs.map((o) => (
                                                <tr key={o.id} style={styles.tr}>
                                                    <td style={styles.td}>#{o.id}</td>
                                                    <td style={styles.td}><strong>{o.organ_type}</strong></td>
                                                    <td style={styles.td}>{o.blood_group}</td>
                                                    <td style={styles.td}>
                                                        <span
                                                            style={{
                                                                ...styles.statusBadge,
                                                                backgroundColor:
                                                                    o.status === "Available"
                                                                        ? "#dcfce7"
                                                                        : o.status === "Sent to OR"
                                                                            ? "#fef3c7"
                                                                            : "#e2e8f0",
                                                                color:
                                                                    o.status === "Available"
                                                                        ? "#166534"
                                                                        : o.status === "Sent to OR"
                                                                            ? "#92400e"
                                                                            : "#475569"
                                                            }}
                                                        >
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

                    {/* Column Right: Requests and Allocations */}
                    <div style={styles.rightCol}>
                        {/* Pending Requests */}
                        <div style={styles.card} className="glass-card">
                            <h3>🚨 Pending Patient Transplant Requests</h3>
                            <p style={styles.mutedText}>Awaiting matching organ and surgeon allocation</p>

                            {pendingRequests.length === 0 ? (
                                <p style={{ fontSize: "14px", fontStyle: "italic", color: "var(--success)" }}>✔ No pending matching operations right now.</p>
                            ) : (
                                <div style={styles.requestList}>
                                    {pendingRequests.map((r) => (
                                        <div key={r.id} style={styles.requestListItem}>
                                            <div>
                                                <strong>{r.organ} Transplant Request (#{r.id})</strong>
                                                <p style={{ margin: "2px 0 0 0", fontSize: "13px" }}>
                                                    Hospital: {r.hospital} | Blood Group: <strong>{r.blood}</strong>
                                                </p>
                                                <span style={styles.urgencyLabel}>{r.urgency}</span>
                                            </div>
                                            <button
                                                className="btn btn-outline"
                                                onClick={() => openAllocateModal(r)}
                                                style={{ fontSize: "13px", padding: "6px 12px" }}
                                            >
                                                Match & Allocate
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Active Allocations / Audit logs */}
                        <div style={{ ...styles.card, marginTop: "24px" }} className="glass-card">
                            <h3>✅ Allocation & Transplant Audits</h3>
                            <p style={styles.mutedText}>Track status of assigned verification keys</p>
                            {allocatedRequests.length === 0 ? (
                                <p style={{ fontSize: "14px", fontStyle: "italic" }}>No allocations registered yet.</p>
                            ) : (
                                <div style={styles.requestList}>
                                    {allocatedRequests.map((r) => {
                                        const matchedDoc = doctors.find(d => d.id === r.allocated_doctor_id);
                                        return (
                                            <div key={r.id} style={styles.allocatedItem}>
                                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                    <strong>{r.organ} Request #{r.id}</strong>
                                                    <span
                                                        style={{
                                                            ...styles.statusBadge,
                                                            backgroundColor: r.status === "Completed" ? "#dcfce7" : "#e0f2fe",
                                                            color: r.status === "Completed" ? "#166534" : "#0369a1"
                                                        }}
                                                    >
                                                        {r.status}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: "13px", marginTop: "6px", color: "var(--text)" }}>
                                                    <p style={{ margin: "2px 0" }}>Patient Blood: <strong>{r.blood}</strong></p>
                                                    <p style={{ margin: "2px 0" }}>Surgeon: <strong>{matchedDoc ? matchedDoc.name : `Dr. ID #${r.allocated_doctor_id}`}</strong></p>
                                                    <p style={{ margin: "2px 0" }}>
                                                        Verification Key: <code style={styles.code}>{r.verification_code}</code>
                                                    </p>
                                                    <p style={{ margin: "2px 0" }}>
                                                        Confirmation State: {r.verification_confirmed ? "🟢 CONFIRMED IN OR" : "🟡 PENDING SURGEON SIGN-OFF"}
                                                    </p>
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

            {/* Allocation coordination Modal */}
            {selectedRequest && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent} className="glass-card fade-in">
                        <h3>⚙️ Match Allocation Gateway</h3>
                        <p style={{ fontSize: "13px", color: "var(--muted)", margin: "4px 0" }}>
                            Matching organ for: <strong>{selectedRequest.organ} ({selectedRequest.blood})</strong>
                        </p>

                        <form onSubmit={handleAllocate} style={styles.modalForm}>
                            <div style={styles.formGroup}>
                                <label>1. Select Matching Organ in Stock</label>
                                {matchingOrgans.length === 0 ? (
                                    <div style={styles.matchError}>
                                        🚨 <strong>No matching organ stock!</strong> Current hospital storage has no available {selectedRequest.organ} with blood type {selectedRequest.blood}.
                                    </div>
                                ) : (
                                    <select
                                        value={selectedOrganId}
                                        onChange={(e) => setSelectedOrganId(e.target.value)}
                                        required
                                        style={styles.select}
                                    >
                                        <option value="">-- Choose Matching Stock Organ --</option>
                                        {matchingOrgans.map((o) => (
                                            <option key={o.id} value={o.id}>
                                                Organ ID #{o.id} - {o.organ_type} ({o.blood_group}) at {o.hospital}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div style={styles.formGroup}>
                                <label>2. Allocate Verified Surgeon</label>
                                <select
                                    value={selectedDoctorId}
                                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                                    required
                                    style={styles.select}
                                >
                                    <option value="">-- Choose Surgeon --</option>
                                    {doctors.map((d) => (
                                        <option key={d.id} value={d.id}>
                                            {d.name} ({d.hospital})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={styles.formGroup}>
                                <label>3. Generated Verification Handshake Key</label>
                                <div style={styles.handshakeBox}>
                                    <code style={{ fontSize: "18px", letterSpacing: "1px" }}>{generatedCode}</code>
                                    <p style={{ fontSize: "11px", margin: "4px 0 0 0", color: "#b91c1c" }}>
                                        Copy this key. The surgeon needs this key in OR to perform operation.
                                    </p>
                                </div>
                            </div>

                            <div style={styles.modalActions}>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={allocating || matchingOrgans.length === 0}
                                    style={{ flex: 1, justifyContent: "center" }}
                                >
                                    {allocating ? "Allocating..." : "Allocate & Issue Key"}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => setSelectedRequest(null)}
                                    style={{ flex: 1, justifyContent: "center" }}
                                >
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
    container: {
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "20px"
    },
    profile: {
        padding: "20px 30px",
        borderRadius: "16px",
        marginBottom: "24px",
        backgroundColor: "rgba(255,255,255,0.7)"
    },
    badge: {
        background: "#fee2e2",
        color: "#b91c1c",
        padding: "4px 12px",
        borderRadius: "12px",
        fontSize: "12px",
        fontWeight: "700",
        display: "inline-block",
        marginTop: "8px"
    },
    grid: {
        display: "flex",
        gap: "28px",
        flexWrap: "wrap",
        alignItems: "flex-start"
    },
    leftCol: {
        flex: "1 1 450px"
    },
    rightCol: {
        flex: "1 1 500px"
    },
    card: {
        padding: "24px",
        borderRadius: "16px",
        backgroundColor: "white"
    },
    mutedText: {
        fontSize: "13px",
        color: "var(--muted)",
        margin: "0 0 16px 0"
    },
    organForm: {
        display: "flex",
        flexDirection: "column",
        gap: "12px"
    },
    label: {
        fontWeight: "600",
        fontSize: "12px",
        color: "var(--accent)",
        display: "block",
        marginBottom: "4px"
    },
    select: {
        width: "100%",
        padding: "10px",
        borderRadius: "8px",
        border: "1px solid rgba(0,0,0,0.12)",
        fontSize: "14px"
    },
    tableWrapper: {
        overflowX: "auto"
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
        fontSize: "13px"
    },
    tr: {
        borderBottom: "1px solid rgba(0,0,0,0.06)"
    },
    th: {
        textAlign: "left",
        padding: "8px",
        color: "var(--muted)",
        fontWeight: "600"
    },
    td: {
        padding: "10px 8px"
    },
    statusBadge: {
        padding: "3px 8px",
        borderRadius: "8px",
        fontSize: "11px",
        fontWeight: "600"
    },
    requestList: {
        display: "flex",
        flexDirection: "column",
        gap: "12px"
    },
    requestListItem: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px",
        borderRadius: "10px",
        border: "1px solid #fee2e2",
        backgroundColor: "rgba(220, 38, 38, 0.02)"
    },
    urgencyLabel: {
        background: "#fef3c7",
        color: "#92400e",
        fontSize: "10.5px",
        padding: "2px 8px",
        borderRadius: "8px",
        fontWeight: "700",
        display: "inline-block",
        marginTop: "4px"
    },
    allocatedItem: {
        padding: "16px",
        borderRadius: "10px",
        border: "1px solid #e2e8f0",
        backgroundColor: "#fcfdfe"
    },
    code: {
        background: "#fee2e2",
        padding: "2px 6px",
        borderRadius: "4px",
        color: "#b91c1c",
        fontFamily: "monospace",
        fontWeight: "600"
    },
    modalOverlay: {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000
    },
    modalContent: {
        backgroundColor: "white",
        width: "100%",
        maxWidth: "500px",
        padding: "30px",
        borderRadius: "16px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.2)"
    },
    modalForm: {
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        marginTop: "16px"
    },
    formGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "6px"
    },
    matchError: {
        background: "#fee2e2",
        color: "#991b1b",
        padding: "12px",
        borderRadius: "8px",
        fontSize: "13px",
        lineHeight: "1.4"
    },
    handshakeBox: {
        background: "#f8fafc",
        border: "1px dashed #cbd5e1",
        padding: "12px",
        borderRadius: "8px",
        textAlign: "center"
    },
    modalActions: {
        display: "flex",
        gap: "12px",
        marginTop: "10px"
    }
};

export default AdminDashboard;
