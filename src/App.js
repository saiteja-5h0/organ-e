import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import OrganRequests from "./pages/OrganRequests";
import Fundraising from "./pages/Fundraising";
import DoctorDashboard from "./pages/DoctorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import SupervisorDashboard from "./pages/SupervisorDashboard";
import Login from "./pages/Login";

function App() {
  const [user, setUser] = useState(null);

  // Sync user state with localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem("user");
      }
    }
  }, []);

  function handleLoginSuccess(loggedInUser) {
    setUser(loggedInUser);
  }

  function handleLogout() {
    localStorage.removeItem("user");
    setUser(null);
  }

  return (
    <>
      <Navbar user={user} onLogout={handleLogout} />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/requests" element={<OrganRequests />} />
        <Route path="/fundraising" element={<Fundraising />} />

        {/* Doctor Dashboard */}
        <Route
          path="/dashboard"
          element={user && user.role === "doctor" ? <DoctorDashboard user={user} /> : <Navigate to="/login" />}
        />

        {/* Admin Dashboard */}
        <Route
          path="/admin"
          element={user && user.role === "admin" ? <AdminDashboard user={user} /> : <Navigate to="/login" />}
        />

        {/* Supervisor Dashboard */}
        <Route
          path="/supervisor"
          element={user && user.role === "supervisor" ? <SupervisorDashboard user={user} /> : <Navigate to="/login" />}
        />

        <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      <Footer />
    </>
  );
}

export default App;
