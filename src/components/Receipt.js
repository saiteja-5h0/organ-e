import React from "react";

function Receipt({ donation, onClose }) {
    if (!donation) return null;

    const isMoney = donation.donation_type === "money";
    const dateStr = new Date(donation.created_at || Date.now()).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });

    return (
        <div style={styles.overlay} className="no-print">
            <div style={styles.modal} className="glass-card fade-in">
                {/* Certificate Border layout */}
                <div style={styles.borderInner} id="printable-receipt">
                    <div style={styles.header}>
                        <span style={styles.seal}>❤️</span>
                        <h2 style={styles.title}>ORGAN-E NATIONAL COORDINATION GRID</h2>
                        <p style={styles.subtitle}>Ministry of Health & Family Welfare Oversight</p>
                    </div>

                    <div style={styles.certificateBody}>
                        <h3 style={styles.certHeading}>DONATION CERTIFICATE OF APPRECIATION</h3>
                        <p style={styles.intro}>This document serves as clean legal and medical validation for:</p>

                        <h1 style={styles.donorName}>{donation.donor_name}</h1>
                        <p style={styles.email}>({donation.email})</p>

                        <div style={styles.detailsBox}>
                            {isMoney ? (
                                <div>
                                    <p style={styles.detailText}>
                                        Contribution Category: <strong style={{ color: "var(--success)" }}>Financial Campaign Donation</strong>
                                    </p>
                                    <p style={styles.detailText}>
                                        Amount Contributed: <strong>₹{Number(donation.amount).toLocaleString("en-IN")} INR</strong>
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <p style={styles.detailText}>
                                        Contribution Category: <strong style={{ color: "var(--primary)" }}>Emergency Organ Donation Pledge</strong>
                                    </p>
                                    <p style={styles.detailText}>
                                        Organ Pledged: <strong>{donation.organ_type}</strong>
                                    </p>
                                    <p style={styles.detailText}>
                                        Blood Group: <strong>{donation.blood_group}</strong>
                                    </p>
                                    <p style={styles.detailText}>
                                        Designated Hospital: <strong>{donation.hospital || "Any Verified Hospital"}</strong>
                                    </p>
                                </div>
                            )}
                            <p style={styles.detailText}>
                                Date & Time of Record: <strong>{dateStr}</strong>
                            </p>
                            <p style={styles.detailText}>
                                Receipt Reference ID: <code style={styles.code}>ORE-{donation.id || "TEMP"}-{Math.floor(1000 + Math.random() * 9000)}</code>
                            </p>
                        </div>

                        <p style={styles.thankyou}>
                            "Your contribution directly aids our collective network in accelerating transplant success and saving lives."
                        </p>
                    </div>

                    <div style={styles.footerSignatures}>
                        <div style={styles.sigBlock}>
                            <div style={styles.sigLine}>Approved Autograph</div>
                            <div style={styles.sigSub}>Organ-E Registrar</div>
                        </div>
                        <div style={styles.sigBlock}>
                            <div style={styles.sigLine}>Digital Audit Pass</div>
                            <div style={styles.sigSub}>System Cryptographic Seal</div>
                        </div>
                    </div>
                </div>

                <div style={styles.actionButtons}>
                    <button
                        className="btn btn-primary"
                        onClick={() => window.print()}
                        style={{ flex: 1, justifyContent: "center" }}
                    >
                        🖨️ Print Certificate
                    </button>
                    <button
                        className="btn btn-outline"
                        onClick={onClose}
                        style={{ flex: 1, justifyContent: "center" }}
                    >
                        Close Gateway
                    </button>
                </div>
            </div>

            {/* Embedded CSS style for printing to only print the certificate body */}
            <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-receipt, #printable-receipt * {
            visibility: visible;
          }
          #printable-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: 4px double #dc2626 !important;
            padding: 30px !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
          }
          .no-print {
            background: none !important;
            position: relative !important;
          }
        }
      `}</style>
        </div>
    );
}

const styles = {
    overlay: {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
        padding: "20px",
        overflowY: "auto"
    },
    modal: {
        backgroundColor: "white",
        width: "100%",
        maxWidth: "600px",
        padding: "24px",
        borderRadius: "16px",
        boxShadow: "0 20px 50px rgba(0,0,0,0.3)"
    },
    borderInner: {
        border: "3px double var(--primary)",
        padding: "24px",
        borderRadius: "10px",
        textAlign: "center",
        backgroundColor: "#fffdfd"
    },
    header: {
        marginBottom: "20px",
        borderBottom: "1px solid #fee2e2",
        paddingBottom: "16px"
    },
    seal: {
        fontSize: "36px",
        display: "block",
        marginBottom: "8px"
    },
    title: {
        fontSize: "18px",
        fontWeight: "700",
        color: "var(--accent)",
        margin: "0 0 4px 0"
    },
    subtitle: {
        fontSize: "11px",
        margin: 0,
        color: "#ef4444",
        letterSpacing: "1px",
        fontWeight: "600"
    },
    certificateBody: {
        margin: "20px 0"
    },
    certHeading: {
        fontSize: "16px",
        color: "var(--accent)",
        margin: "0 0 16px 0",
        fontWeight: "800",
        letterSpacing: "0.5px"
    },
    intro: {
        fontSize: "13px",
        color: "var(--muted)",
        margin: "0 0 8px 0"
    },
    donorName: {
        fontSize: "28px",
        fontWeight: "700",
        color: "var(--primary)",
        margin: "4px 0"
    },
    email: {
        fontSize: "13px",
        color: "var(--muted)",
        margin: "0 0 20px 0"
    },
    detailsBox: {
        background: "rgba(220, 38, 38, 0.03)",
        border: "1px solid #fee2e2",
        padding: "16px",
        borderRadius: "8px",
        textAlign: "left",
        marginBottom: "16px"
    },
    detailText: {
        fontSize: "14px",
        margin: "6px 0",
        color: "var(--text)"
    },
    code: {
        background: "#fee2e2",
        padding: "2px 6px",
        borderRadius: "4px",
        fontSize: "12px",
        color: "#b91c1c",
        fontFamily: "monospace"
    },
    thankyou: {
        fontSize: "13px",
        fontStyle: "italic",
        color: "var(--muted)",
        margin: "20px 0 0 0",
        lineHeight: "1.4"
    },
    footerSignatures: {
        display: "flex",
        justifyContent: "space-between",
        marginTop: "30px",
        paddingTop: "20px",
        borderTop: "1px dashed rgba(0,0,0,0.08)"
    },
    sigBlock: {
        width: "45%"
    },
    sigLine: {
        borderBottom: "1px solid #ccc",
        paddingBottom: "4px",
        fontSize: "12px",
        fontFamily: "Courier, monospace",
        color: "#4b5563"
    },
    sigSub: {
        fontSize: "10px",
        color: "var(--muted)",
        marginTop: "4px"
    },
    actionButtons: {
        display: "flex",
        gap: "12px",
        marginTop: "20px"
    }
};

export default Receipt;
