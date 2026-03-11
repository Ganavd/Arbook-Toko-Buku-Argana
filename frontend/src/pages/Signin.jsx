import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Signin.css";

function Signin() {
  const navigate = useNavigate();
  const roleRef = useRef(null);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [role, setRole] = useState("customer");
  const [showRole, setShowRole] = useState(false);

  const [token, setToken] = useState("");
  const [tokenStatus, setTokenStatus] = useState("empty");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordStatus, setPasswordStatus] = useState("empty");

  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    document.title = "Daftar Akun Arbook | Arganabook Accounts";
  }, []);

  /* CLOSE DROPDOWN SAAT KLIK LUAR */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (roleRef.current && !roleRef.current.contains(e.target)) {
        setShowRole(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* VALIDASI PASSWORD */
  useEffect(() => {
    if (confirmPassword === "") {
      setPasswordStatus("empty");
    } else if (password === confirmPassword) {
      setPasswordStatus("correct");
    } else {
      setPasswordStatus("wrong");
    }
  }, [password, confirmPassword]);

  /* VALIDASI TOKEN */
  useEffect(() => {
    if (token === "") {
      setTokenStatus("empty");
    } else if (role === "admin" && token === "AdminArbook") {
      setTokenStatus("correct");
    } else if (role === "cashier" && token === "CashierArbook") {
      setTokenStatus("correct");
    } else {
      setTokenStatus("wrong");
    }
  }, [token, role]);

  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(""), 3000);
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (username.trim().length < 3) {
      showError("Username minimal 3 karakter");
      return;
    }

    if (password.length < 6) {
      showError("Password minimal 6 karakter");
      return;
    }

    if (password !== confirmPassword) {
      showError("Password tidak sama");
      return;
    }

    if (role === "customer" && !agree) {
      showError("Kamu harus menyetujui Syarat & Ketentuan");
      return;
    }

    if (role === "admin" && token !== "AdminArbook") {
      showError("Token admin salah");
      return;
    }

    if (role === "cashier" && token !== "CashierArbook") {
      showError("Token cashier salah");
      return;
    }

    try {
      await axios.post("https://arbook-backend-v1.onrender.com/api/signin", {
        username,
        email,
        password,
        role,
      });

      setSuccess("Akun berhasil dibuat! Mengalihkan ke halaman login...");
      setTimeout(() => {
        navigate("/login");
      }, 2500);
    } catch (err) {
      const msg = err.response?.data?.message;

      if (msg === "username") {
        showError("Username sudah terdaftar");
      } else if (msg === "email") {
        showError("Email sudah terdaftar");
      } else if (msg === "both") {
        showError("Username dan email sudah terdaftar");
      } else {
        showError("Eror, gagal membuat akun");
      }
    }
  };

  return (
    <div className="login-container">
      {error && <div className="error-popup">{error}</div>}
      {success && <div className="success-popup">{success}</div>}

      <form className="login-form" onSubmit={handleRegister} noValidate>
        <h2>Daftar Akun Arbook</h2>
        {/* USERNAME */}
        <div className="input-group role-input" ref={roleRef}>
          <input
            type="text"
            placeholder=" "
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError("");
            }}
          />

          <label>Username</label>

          <button
            type="button"
            className="role-btn"
            onClick={() => setShowRole(!showRole)}
          >
            👤
          </button>

          {showRole && (
            <div className="role-dropdown">
              {["customer", "admin", "cashier"].map((r) => (
                <div
                  key={r}
                  className={`role-item ${role === r ? "active" : ""}`}
                  onClick={() => {
                    setRole(r);
                    setShowRole(false);
                    setToken("");
                  }}
                >
                  {r}
                  {role === r && <span>✔</span>}
                </div>
              ))}
            </div>
          )}
        </div>
        {/* EMAIL */}
        <div className="input-group">
          <input
            type="email"
            placeholder=" "
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
          />

          <label>Email (opsional)</label>
        </div>
        {/* PASSWORD */}
        <div className="input-group password-input-group">
          <input
            type={showPassword ? "text" : "password"}
            placeholder=" "
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
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
        {/* CONFIRM PASSWORD */}
        <div className="input-group password-input-group">
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder=" "
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <label>Konfirmasi Password</label>

          <button
            type="button"
            className="toggle-password-btn"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? "📖" : "📕"}
          </button>
        </div>
        <small className={`password-hint ${passwordStatus}`}>
          {passwordStatus === "wrong" && "*password salah"}
          {passwordStatus === "correct" && "*password benar"}
        </small>
        {/* TOKEN */}
        {(role === "admin" || role === "cashier") && (
          <div className="input-group">
            <input
              type="text"
              placeholder=" "
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />

            <label>{role === "admin" ? "Token Admin" : "Token Cashier"}</label>

            <small className={`token-hint ${tokenStatus}`}>
              {tokenStatus === "empty" && "*masukan token"}
              {tokenStatus === "wrong" && "*token salah"}
              {tokenStatus === "correct" && "*token benar"}
            </small>
          </div>
        )}
        {/* TERMS */}
        {role === "customer" && (
          <div className="terms">
            <input
              type="checkbox"
              checked={agree}
              onChange={() => setAgree(!agree)}
            />

            <span>
              Saya menyetujui
              <a href="/terms"> Syarat & Ketentuan </a>
              dan
              <a href="/privacy"> Kebijakan Privasi </a>
              Arbook.com
            </span>
          </div>
        )}
        <button type="submit">Daftar</button>
        <div className="register-text">
          Sudah punya akun?
          <span onClick={() => navigate("/login")}> Masuk</span>
        </div>
        <div className="copyright">
          © 2026 Team Arganabook
          <br />
          <a href="mailto:arganavd9@gmail.com" className="copyright-email">
            arganavd9@gmail.com
          </a>
        </div>
      </form>
    </div>
  );
}

export default Signin;
