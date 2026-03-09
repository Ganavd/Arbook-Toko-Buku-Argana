const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const pool = require('./db/pool');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());


const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 10, // max 10 request per IP
  message: { message: "Terlalu banyak percobaan, coba lagi nanti" }
});

app.use("/api/login", limiter);
app.use("/api/signin", limiter);

app.post("/api/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        const result = await pool.query(
            "SELECT * FROM users WHERE username = $1",
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ message: "Login Gagal" });
        }

        const user = result.rows[0];

        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({ message: "Login Gagal" });
        }

        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({
            message: "Login Berhasil",
            token: token,
        });

    } catch (error) {
        console.error("ERROR LOGIN:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

app.post("/api/signin", async (req, res) => {
  const { username, email, password, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    // cek username
    const existingUsername = await pool.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );

    // cek email
    const existingEmail =
    email && email.trim() !== ""
        ? await pool.query(
            "SELECT * FROM users WHERE email = $1 AND email IS NOT NULL AND email != ''",
            [email]
        )
        : { rows: [] };

    // VALIDASI
    if (existingUsername.rows.length > 0 && existingEmail.rows.length > 0) {
      return res.status(400).json({ message: "both" });
    }

    if (existingUsername.rows.length > 0) {
      return res.status(400).json({ message: "username" });
    }

    if (existingEmail.rows.length > 0) {
      return res.status(400).json({ message: "email" });
    }

      // VALIDASI INPUT
    if (!username || username.trim() === "") {
        return res.status(400).json({ message: "Username wajib diisi" });
    }
    if (!password || password.length < 6) {
        return res.status(400).json({ message: "Password minimal 6 karakter" });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: "Format email tidak valid" });
    }

    // simpan ke DB
    await pool.query(
    "INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4)",
    [username, email && email.trim() !== "" ? email : null, hashedPassword, role]
    );

    res.json({ message: "success" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "server error" });
  }
});

// Endpoint GET - Mengambil semua produk dari database dengan kategori
app.get("/api/products", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                p.id_product as id,
                p.name_product as title,
                p.price,
                p.stock,
                c.id_category,
                c.name_category as category,
                c.description
            FROM products p
            LEFT JOIN categories c ON p.id_category = c.id_category
            ORDER BY p.id_product ASC`
        );
        res.json(result.rows);
    } catch (error) {
        console.error("ERROR GET PRODUCTS:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

app.listen(3000, () => {
    console.log("Server berjalan di http://localhost:3000/api");
});