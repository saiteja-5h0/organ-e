import React, { useEffect, useState } from "react";
import FundraisingCard from "../components/FundraisingCard";

function Fundraising() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/fundraising')
      .then((r) => r.json())
      .then((data) => setCampaigns(data))
      .catch((err) => console.error('Failed to load campaigns', err))
      .finally(() => setLoading(false));
  }, []);

  async function handleDonate(id, amount) {
    try {
      const res = await fetch(`/api/fundraising/${id}/donate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });
      if (!res.ok) throw new Error('donation failed');
      const updated = await res.json();
      setCampaigns((s) => s.map((c) => (c.id === updated.id ? updated : c)));
      return updated;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  return (
    <div className="container">
      <h2>Fundraising Campaigns</h2>
      <p>Verified medical fundraisers for emergency cases</p>

      {/* Stats */}
      <div style={styles.stats}>
        <div style={styles.statCard}>💰 ₹2.1 Cr Raised</div>
        <div style={styles.statCard}>❤️ 1,240 Donors</div>
        <div style={styles.statCard}>🏥 320 Patients Helped</div>
      </div>

      {/* Campaign Cards */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        campaigns.map((c) => <FundraisingCard key={c.id} data={c} onDonate={handleDonate} />)
      )}
    </div>
  );
}

const styles = {
  stats: {
    display: "flex",
    gap: 20,
    margin: "20px 0",
  },
  statCard: {
    background: "#f0fdf4",
    padding: 16,
    borderRadius: 12,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
};

export default Fundraising;
