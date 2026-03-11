import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
  document.title = "Masuk ke Akun Arbook | Arganabook Accounts";
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "https://arbook-backend-v1.onrender.com/api/login",
        {
          username,
          password,
        },
      );

      console.log("RESPONSE:", response.data);
      console.log("ROLE:", response.data.role);

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("username", response.data.username);
      localStorage.setItem("role", response.data.role);

      const role = response.data.role;
      if (role === "admin") navigate("/admin");
      else if (role === "cashier") navigate("/cashier");
      else navigate("/dashboard");
    } catch (err) {
      console.log("ERROR:", err);
      setError(
        "Akun tidak ditemukan. Periksa username dan password kamu atau daftar.",
      );
      setTimeout(() => {
        setError("");
      }, 3000);
    }
  };

  return (
    <div className="login-container">
      {error && <div className="error-popup">{error}</div>}
      <form className="login-form" onSubmit={handleLogin}>
        <h2>Masuk Akun Arbook</h2>

        <div className="input-group">
          <input
            type="text"
            placeholder=" "
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <label>Username</label>
        </div>

        <div className="input-group password-input-group">
          <input
            type={showPassword ? "text" : "password"}
            placeholder=" "
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <label>Password</label>

          <button
            type="button"
            className="toggle-password-btn"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "📖" : "📕"}
          </button>
        </div>

        <div className="forgot-password">
          <a href="#">Lupa Kata Sandi</a>
        </div>

        <button type="submit">Masuk</button>

        <div className="register-text">
          Belum punya akun?
          <span onClick={() => navigate("/signin")}> Daftar</span>
        </div>
        <div className="copyright">
          © 2026 Teamvd Arganabook
          <br />
          <a href="mailto:arganavd@gmail.com" className="copyright-email">
            arganavd@gmail.com
          </a>
        </div>
      </form>
    </div>
  );
}

export default Login;
