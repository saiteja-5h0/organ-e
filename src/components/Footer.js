import React from "react";
import "../styles/global.css";

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div>
          <h4>❤️ ORGAN-E</h4>
          <p className="footer-text">Emergency Organ Coordination System</p>
          <p className="footer-small">
            This is a <b>prototype demonstration</b> built for educational and
            research purposes only.
          </p>
        </div>

        <div>
          <h4>Prototype Notice</h4>
          <p className="footer-small">
            • No real organ buying or selling is supported  
            <br />
            • All workflows are simulated  
            <br />
            • Designed to prevent illegal organ trade  
            <br />
            • Hospital & doctor verification only
          </p>
        </div>

        <div>
          <h4>Legal & Ethics</h4>
          <p className="footer-small">
            This demo follows ethical organ donation principles.
            Actual implementation requires compliance with
            national transplant laws and government regulations.
          </p>
        </div>
      </div>

      <div className="footer-bottom">
        © 2025 ORGAN-E | Prototype Demo | Built for Learning & Innovation
      </div>
    </footer>
  );
}

export default Footer;
