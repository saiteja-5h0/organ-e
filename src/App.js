import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import OrganRequests from "./pages/OrganRequests";
import Fundraising from "./pages/Fundraising";
import DoctorDashboard from "./pages/DoctorDashboard";

function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/requests" element={<OrganRequests />} />
        <Route path="/fundraising" element={<Fundraising />} />
        <Route path="/dashboard" element={<DoctorDashboard />} />
      </Routes>

      <Footer />
    </>
  );
}

export default App;
