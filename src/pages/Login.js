import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/glass.css";
import "../styles/global.css";

function Login({ onLoginSuccess }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Authentication failed");
            }

            localStorage.setItem("user", JSON.stringify(data.user));
            if (onLoginSuccess) onLoginSuccess(data.user);

            // Redirect depending on role
            if (data.user.role === "doctor") {
                navigate("/dashboard");
            } else if (data.user.role === "admin") {
                navigate("/admin");
            } else if (data.user.role === "supervisor") {
                navigate("/supervisor");
            } else {
                navigate("/");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={styles.page}>
            <div style={styles.loginContainer} className="glass-card fade-in">
                <h2 style={styles.title}>🔐 Portal Access</h2>
                <p style={styles.sub}>National Organ Coordination Grid Security Gateway</p>

                {error && <div style={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>National Portal Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="e.g. doctor1"
                            required
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Access Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            style={styles.input}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={styles.button}
                    >
                        {loading ? "Verifying Credentials..." : "Authenticate"}
                    </button>
                </form>

                <div style={styles.note}>
                    ⚠️ <b>Authorized Personnel Only:</b> Demo accounts (password: <code>password</code>):
                    <br />Care Hospital — <code>doctor1</code>, <code>admin1</code>, <code>supervisor1</code>
                    <br />Apollo Hospital — <code>doctor2</code>, <code>admin2</code>, <code>supervisor2</code>
                </div>
            </div>
        </div>
    );
}

const styles = {
    page: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "75vh",
        padding: "20px"
    },
    loginContainer: {
        width: "100%",
        maxWidth: "460px",
        padding: "36px",
        borderRadius: "16px"
    },
    title: {
        margin: "0 0 6px 0",
        color: "var(--accent)"
    },
    sub: {
        margin: "0 0 24px 0",
        color: "var(--muted)",
        fontSize: "14px"
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "18px"
    },
    inputGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "6px"
    },
    label: {
        fontWeight: "600",
        fontSize: "14px",
        color: "var(--accent)"
    },
    input: {
        padding: "12px",
        borderRadius: "10px",
        border: "1px solid rgba(0,0,0,0.12)",
        fontSize: "15px",
        outline: "none"
    },
    button: {
        justifyContent: "center",
        padding: "12px",
        fontSize: "16px",
        marginTop: "10px"
    },
    error: {
        background: "#fee2e2",
        color: "#b91c1c",
        padding: "10px",
        borderRadius: "8px",
        fontSize: "14px",
        marginBottom: "16px",
        textAlign: "center"
    },
    note: {
        marginTop: "24px",
        fontSize: "12px",
        color: "#6b7280",
        lineHeight: "1.5",
        borderTop: "1px solid rgba(0,0,0,0.06)",
        paddingTop: "16px"
    }
};

export default Login;
