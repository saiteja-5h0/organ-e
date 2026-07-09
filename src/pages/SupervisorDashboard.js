import React, { useEffect, useState, useCallback } from "react";
import "../styles/glass.css";
import "../styles/global.css";

function SupervisorDashboard({ user }) {
    const [transfers, setTransfers] = useState([]);
    const [localOrgans, setLocalOrgans] = useState([]);
    const [loading, setLoading] = useState(true);

    // Request Transfer Form State
    const [targetHospital, setTargetHospital] = useState("Apollo Hospital");
    const [organType, setOrganType] = useState("Kidney");
    const [bloodGroup, setBloodGroup] = useState("O+");
    const [submitting, setSubmitting] = useState(false);

    const fetchTransfersData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch all transfers related to supervisor hospital
            const transRes = await fetch(`/api/supervisor/transfers?hospital=${encodeURIComponent(user)}`);
            const transData = await transRes.json();
            setTransfers(transData);

            // Fetch local organs to check if we can fulfill incoming requests
            const orgRes = await fetch(`/api/organs?hospital=${encodeURIComponent(user)}`);
            const orgData = await orgRes.json();
            setLocalOrgans(orgData.filter(o => o.status === "Available"));
        } catch (err) {
            console.error("Error loading supervisor transfer registry", err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const handleCreateTransfer = useCallback(async (e) => {
        e.preventDefault();
        if (targetHospital === user) {
            alert("Error: Destination hospital cannot match source hospital.");
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
                    from_hospital: targetHospital,      // requested from this target hospital
                    to_hospital: user          // transferring to us
                })
            });

            if (!res.ok) throw new Error("Failed to post network transfer");
            const added = await res.json();
            setTransfers((prev) => [added, ...prev]);
            alert("Organ shifting request broadcast succeeded!");
            fetchTransfersData();
        } catch (err) {
            alert("Error requesting transfer: " + err.message);
        } finally {
            setSubmitting(false);
        }
    }, [
    fetchTransfersData,
    bloodGroup,
    organType,
    targetHospital,
    user
]);

    const handleUpdateStatus = useCallback(async (transferId, newStatus) => {
        try {
            const res = await fetch(`/api/supervisor/transfers/${transferId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus })
            });
            if (!res.ok) throw new Error("Failed to update shifting status");
            alert(`Transfer request status successfully set to: ${newStatus.toUpperCase()}`);
            fetchTransfersData();
        } catch (err) {
            alert("Error updating transfer: " + err.message);
        }
    }, [fetchTransfersData]);

    useEffect(() => {
        fetchTransfersData();
    }, [fetchTransfersData]);


    // Filter incoming (requested FROM us) vs outgoing (requested BY us)
    // outgoing: transfers where we are to_hospital (i.e. we requested it to come to our hospital)
    // incoming: transfers where we are from_hospital (i.e. they requested us to send them an organ)
    const outgoingTransfers = transfers.filter((t) => t.to_hospital === user);
    const incomingTransfers = transfers.filter((t) => t.from_hospital === user);

    return (
        <div style={styles.container}>
            {/* Supervisor Header */}
            <div style={styles.profile} className="glass-card fade-in">
                <div>
                    <h2>📡 Supervisor regional network coordination grid</h2>
                    <p>
                        Welcome, Coordinator <strong>{user.name}</strong> | Regional Operations, {user}
                    </p>
                    <span style={styles.badge}>Regional Supervisor (Grid Coordination)</span>
                </div>
            </div>

            {loading ? (
                <p>Loading network transaction grid...</p>
            ) : (
                <div style={styles.grid}>
                    {/* Column Left: Request new organ shift */}
                    <div style={styles.leftCol}>
                        <div style={styles.card} className="glass-card">
                            <h3>📡 Broadcast Organ Relocation Request</h3>
                            <p style={styles.mutedText}>Request an organ package from a networked facility</p>

                            <form onSubmit={handleCreateTransfer} style={styles.form}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Requested From (Source Facility)</label>
                                    <select
                                        value={targetHospital}
                                        onChange={(e) => setTargetHospital(e.target.value)}
                                        style={styles.select}
                                    >
                                        <option>Care Hospital</option>
                                        <option>Apollo Hospital</option>
                                        <option>Yashoda Hospital</option>
                                        <option>AIG Hospitals</option>
                                    </select>
                                </div>

                                <div style={{ display: "flex", gap: "10px" }}>
                                    <div style={{ ...styles.formGroup, flex: 1 }}>
                                        <label style={styles.label}>Organ Type Required</label>
                                        <select
                                            value={organType}
                                            onChange={(e) => setOrganType(e.target.value)}
                                            style={styles.select}
                                        >
                                            <option>Kidney</option>
                                            <option>Liver</option>
                                            <option>Heart</option>
                                            <option>Lung</option>
                                            <option>Cornea</option>
                                        </select>
                                    </div>
                                    <div style={{ ...styles.formGroup, flex: 1 }}>
                                        <label style={styles.label}>Blood Group</label>
                                        <select
                                            value={bloodGroup}
                                            onChange={(e) => setBloodGroup(e.target.value)}
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
                                    disabled={submitting}
                                    style={{ width: "100%", justifyContent: "center", marginTop: "14px" }}
                                >
                                    {submitting ? "Broadcasting..." : "Broadcast Relocation Request"}
                                </button>
                            </form>
                        </div>

                        {/* Outgoing Requests list */}
                        <div style={{ ...styles.card, marginTop: "24px" }} className="glass-card">
                            <h3>📤 Outgoing Requests (Requested by Us)</h3>
                            <p style={styles.mutedText}>Organs we requested from other hospitals</p>
                            {outgoingTransfers.length === 0 ? (
                                <p style={{ fontSize: "14px", fontStyle: "italic" }}>No outgoing network requests.</p>
                            ) : (
                                <div style={styles.transfersList}>
                                    {outgoingTransfers.map((t) => (
                                        <div key={t.id} style={styles.transferItem}>
                                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                <strong>{t.organ_type} ({t.blood_group})</strong>
                                                <span
                                                    style={{
                                                        ...styles.statusBadge,
                                                        backgroundColor:
                                                            t.status === "Accepted"
                                                                ? "#dcfce7"
                                                                : t.status === "Declined"
                                                                    ? "#fee2e2"
                                                                    : "#e0f2fe",
                                                        color:
                                                            t.status === "Accepted"
                                                                ? "#166534"
                                                                : t.status === "Declined"
                                                                    ? "#b91c1c"
                                                                    : "#0369a1"
                                                    }}
                                                >
                                                    {t.status}
                                                </span>
                                            </div>
                                            <p style={{ margin: "4px 0 0 0", fontSize: "12px" }}>
                                                Requested from: <strong>{t.from_hospital}</strong>
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Column Right: Incoming requests (Requested from us) */}
                    <div style={styles.rightCol}>
                        <div style={styles.card} className="glass-card">
                            <h3>📥 Incoming Relocation Cases (Requested from Us)</h3>
                            <p style={styles.mutedText}>Hospitals requesting organ shifting packages from our inventory</p>
                            {incomingTransfers.length === 0 ? (
                                <p style={{ fontSize: "14px", fontStyle: "italic", color: "var(--success)" }}>✔ No incoming shift requests.</p>
                            ) : (
                                <div style={styles.transfersList}>
                                    {incomingTransfers.map((t) => {
                                        // Check if we have this matching organ available locally
                                        const isAvailableLocally = localOrgans.some(
                                            (o) =>
                                                o.organ_type.toLowerCase() === t.organ_type.toLowerCase() &&
                                                o.blood_group.toLowerCase() === t.blood_group.toLowerCase()
                                        );
                                        return (
                                            <div key={t.id} style={styles.transferItem}>
                                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                    <strong>{t.organ_type} ({t.blood_group})</strong>
                                                    <span
                                                        style={{
                                                            ...styles.statusBadge,
                                                            backgroundColor:
                                                                t.status === "Accepted"
                                                                    ? "#dcfce7"
                                                                    : t.status === "Declined"
                                                                        ? "#fee2e2"
                                                                        : "#fef3c7",
                                                            color:
                                                                t.status === "Accepted"
                                                                    ? "#166534"
                                                                    : t.status === "Declined"
                                                                        ? "#b91c1c"
                                                                        : "#d97706"
                                                        }}
                                                    >
                                                        {t.status}
                                                    </span>
                                                </div>
                                                <p style={{ margin: "4px 0", fontSize: "12px" }}>
                                                    Requested by: <strong>{t.to_hospital}</strong>
                                                </p>

                                                <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--muted)" }}>
                                                    Inventory Check:{" "}
                                                    {isAvailableLocally ? (
                                                        <strong style={{ color: "var(--success)" }}>✔ Organ Stock Available locally</strong>
                                                    ) : (
                                                        <strong style={{ color: "#ef4444" }}>❌ Not in our local stock</strong>
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
                                                            Approve Shift
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
    form: {
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
    transfersList: {
        display: "flex",
        flexDirection: "column",
        gap: "12px"
    },
    transferItem: {
        padding: "16px",
        borderRadius: "10px",
        border: "1px solid #fee2e2",
        backgroundColor: "rgba(220, 38, 38, 0.01)"
    },
    statusBadge: {
        padding: "3px 8px",
        borderRadius: "8px",
        fontSize: "11px",
        fontWeight: "600"
    }
};

export default SupervisorDashboard;
