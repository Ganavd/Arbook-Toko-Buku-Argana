import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post("http://localhost:3000/api/login", {
        username,
        password,
      });

      localStorage.setItem("token", response.data.token);
      navigate("/dashboard");
    } catch {
      setError("Akun tidak ditemukan. Periksa username dan password kamu atau daftar.");
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
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <label>Username</label>
        </div>

        <div className="input-group password-input-group">
          <input
            type={showPassword ? "text" : "password"}
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
      </form>
    </div>
  );
}

export default Login;
