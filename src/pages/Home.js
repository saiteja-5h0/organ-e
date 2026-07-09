import React, { useState } from "react";
import Receipt from "../components/Receipt";
import { useNavigate } from "react-router-dom";
import "../styles/glass.css";
import "../styles/global.css";

function Home() {
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState(null); // 'money' or 'organ'
  const [donationReceipt, setDonationReceipt] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [organType, setOrganType] = useState("Kidney");
  const [bloodGroup, setBloodGroup] = useState("O+");
  const [hospital, setHospital] = useState("Care Hospital");

  async function handleDonateMoney(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donor_name: name,
          email: email,
          donation_type: "money",
          amount: Number(amount)
        })
      });
      if (!res.ok) throw new Error("Donation logs failure");
      const data = await res.json();
      setDonationReceipt(data);
      setActiveModal(null);
      resetForms();
    } catch (err) {
      alert("Failed to submit donation: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDonateOrgan(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donor_name: name,
          email: email,
          donation_type: "organ",
          organ_type: organType,
          blood_group: bloodGroup,
          hospital: hospital
        })
      });
      if (!res.ok) throw new Error("Pledge submission failure");
      const data = await res.json();
      setDonationReceipt(data);
      setActiveModal(null);
      resetForms();
    } catch (err) {
      alert("Failed to register pledge: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  function resetForms() {
    setName("");
    setEmail("");
    setPhone("");
    setAmount("");
    setOrganType("Kidney");
    setBloodGroup("O+");
  }

  return (
    <div style={styles.container}>
      {/* Hero Section */}
      <div style={styles.hero} className="fade-in">
        <h1 style={styles.heroTitle}>National Emergency Organ Procurement Grid</h1>
        <p style={styles.heroSub}>
          Connecting verified critical care units, medical professionals, and coordinating administrators to matching donors in real time. Saving lives through transparent oversight.
        </p>

        <div style={styles.heroButtons}>
          <button className="btn btn-primary" onClick={() => navigate("/requests")} style={styles.heroBtn}>
            🔍 Access Request Feeds
          </button>
          <button className="btn btn-outline" onClick={() => navigate("/login")} style={styles.heroBtnOutline}>
            🔐 Professional Gateway Login
          </button>
        </div>
      </div>

      {/* Stats Board */}
      <div style={styles.statsContainer}>
        <div style={styles.statCard} className="glass-card">
          <span style={styles.statIcon}>⏱️</span>
          <h3>&lt; 4 Hours</h3>
          <p>Average Match/Allocation Delay</p>
        </div>
        <div style={styles.statCard} className="glass-card">
          <span style={styles.statIcon}>🏥</span>
          <h3>148+</h3>
          <p>Participating Cardiac & Nephrology Sites</p>
        </div>
        <div style={styles.statCard} className="glass-card">
          <span style={styles.statIcon}>❤️</span>
          <h3>3,248+</h3>
          <p>Successful Transplants Conducted</p>
        </div>
      </div>

      {/* Donation Grid */}
      <div style={styles.mainWork}>
        <div style={styles.workColumn}>
          <div style={styles.donateBox} className="glass-card">
            <h2>🤝 PLEDGE AN ORGAN</h2>
            <p>
              Become an registered donor to save lives. You can pledge specific organs under regulated legal agreements, connecting you to hospitals in emergency situations.
            </p>
            <button className="btn btn-primary" onClick={() => setActiveModal("organ")} style={styles.wideBtn}>
              Pledge Organ Now
            </button>
          </div>
        </div>

        <div style={styles.workColumn}>
          <div style={styles.donateBox} className="glass-card">
            <h2>💳 SUPPORT TRANSPLANTS</h2>
            <p>
              Support economically disadvantaged patients who need transplants but cannot afford the operation expenses. All donations go directly to patient welfare funds.
            </p>
            <button className="btn btn-primary" onClick={() => setActiveModal("money")} style={styles.wideBtn}>
              Donate Funds Online
            </button>
          </div>
        </div>
      </div>

      {/* Money Donation Modal */}
      {activeModal === "money" && (
        <div style={styles.modalOverlay} className="no-print">
          <div style={styles.modalContent} className="glass-card fade-in">
            <h3>💳 Financial Support Campaign</h3>
            <p style={{ fontSize: 13, color: "var(--muted)" }}>Secure encrypted transaction gateway</p>

            <form onSubmit={handleDonateMoney} style={styles.modalForm}>
              <div style={styles.formGroup}>
                <label>Donor Full Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Rajesh Kumar" />
              </div>
              <div style={styles.formGroup}>
                <label>Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="e.g. rajesh@gmail.com" />
              </div>
              <div style={styles.formGroup}>
                <label>Contribution (INR)</label>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required min="100" placeholder="e.g. 5000" />
              </div>

              <div style={styles.modalActions}>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1, justifyContent: "center" }}>
                  {loading ? "Processing..." : "Complete Contribution"}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setActiveModal(null)} style={{ flex: 1, justifyContent: "center" }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Organ Pledge Modal */}
      {activeModal === "organ" && (
        <div style={styles.modalOverlay} className="no-print">
          <div style={styles.modalContent} className="glass-card fade-in">
            <h3>🤝 Organ Donation Registry Pledge</h3>
            <p style={{ fontSize: 13, color: "var(--muted)" }}>Official registry declaration form</p>

            <form onSubmit={handleDonateOrgan} style={styles.modalForm}>
              <div style={styles.formGroup}>
                <label>Pledger Full Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Rajesh Kumar" />
              </div>
              <div style={styles.formGroup}>
                <label>Pledger Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="e.g. rajesh@gmail.com" />
              </div>
              <div style={styles.formGroup}>
                <label>Contact Phone Number</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="e.g. 9876543210" />
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label>Organ Pledged</label>
                  <select value={organType} onChange={(e) => setOrganType(e.target.value)}>
                    <option>Kidney</option>
                    <option>Liver</option>
                    <option>Heart</option>
                    <option>Lung</option>
                    <option>Cornea</option>
                  </select>
                </div>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label>Blood Group</label>
                  <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
                    <option>A+</option>
                    <option>A-</option>
                    <option>B+</option>
                    <option>B-</option>
                    <option>AB+</option>
                    <option>AB-</option>
                    <option>O+</option>
                    <option>O-</option>
                  </select>
                </div>
              </div>
              <div style={styles.formGroup}>
                <label>Preferred Coordinator Hospital</label>
                <select value={hospital} onChange={(e) => setHospital(e.target.value)}>
                  <option>Care Hospital</option>
                  <option>Apollo Hospital</option>
                  <option>Yashoda Hospital</option>
                  <option>AIG Hospitals</option>
                </select>
              </div>

              <div style={styles.modalActions}>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1, justifyContent: "center" }}>
                  {loading ? "Registering..." : "Submit Registry Pledge"}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setActiveModal(null)} style={{ flex: 1, justifyContent: "center" }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Render Donation Receipt Modal */}
      {donationReceipt && (
        <Receipt donation={donationReceipt} onClose={() => setDonationReceipt(null)} />
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "40px 20px"
  },
  hero: {
    background: "linear-gradient(135deg, #450a0a, #020617)",
    borderRadius: "20px",
    padding: "60px 40px",
    textAlign: "center",
    color: "white",
    marginBottom: "50px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.15)"
  },
  heroTitle: {
    fontSize: "36px",
    fontWeight: "800",
    margin: "0 0 16px 0",
    letterSpacing: "-0.5px"
  },
  heroSub: {
    fontSize: "17px",
    maxWidth: "780px",
    margin: "0 auto 30px auto",
    lineHeight: "1.6",
    opacity: 0.9
  },
  heroButtons: {
    display: "flex",
    justifyContent: "center",
    gap: "16px",
    flexWrap: "wrap"
  },
  heroBtn: {
    padding: "12px 28px",
    fontSize: "16px"
  },
  heroBtnOutline: {
    padding: "12px 28px",
    fontSize: "16px",
    color: "white",
    border: "1px solid rgba(255,255,255,0.3)"
  },
  statsContainer: {
    display: "flex",
    gap: "24px",
    marginBottom: "50px",
    flexWrap: "wrap"
  },
  statCard: {
    flex: 1,
    minWidth: "250px",
    padding: "28px",
    borderRadius: "14px",
    textAlign: "center",
    backgroundColor: "rgba(255, 255, 255, 0.75)"
  },
  statIcon: {
    fontSize: "32px",
    display: "block",
    marginBottom: "12px"
  },
  mainWork: {
    display: "flex",
    gap: "30px",
    flexWrap: "wrap"
  },
  workColumn: {
    flex: 1,
    minWidth: "300px"
  },
  donateBox: {
    padding: "36px",
    borderRadius: "16px",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.7)"
  },
  wideBtn: {
    marginTop: "20px",
    width: "100%",
    justifyContent: "center",
    padding: "12px"
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    padding: "20px"
  },
  modalContent: {
    backgroundColor: "white",
    width: "100%",
    maxWidth: "500px",
    padding: "30px",
    borderRadius: "16px",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)"
  },
  modalForm: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    marginTop: "20px"
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px"
  },
  modalActions: {
    display: "flex",
    gap: "12px",
    marginTop: "10px"
  }
};

export default Home;
