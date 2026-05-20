import React from "react";

function Home() {
  return (
    <div style={styles.hero}>
      <h1>Emergency Organ Coordination System</h1>

      <p>
        A regulated, government-approved platform connecting verified doctors
        and hospitals for emergency organ transplant coordination.
      </p>

      <div style={styles.buttons}>
        <button className="outline-btn">View Organ Requests</button>
        <button className="primary-btn">Doctor Login</button>
      </div>
    </div>
  );
}

const styles = {
  hero: {
  background: "linear-gradient(135deg, #dc2626, #b91c1c)",
  color: "white",
  padding: "100px 20px",
  textAlign: "center",
},
  buttons: {
    marginTop: 30,
    display: "flex",
    justifyContent: "center",
    gap: 16,
  },
};

export default Home;
