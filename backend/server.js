process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const pool = require('./db/pool');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// =====================
// RATE LIMITER
// =====================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Terlalu banyak percobaan, coba lagi nanti' },
});
app.use('/api/login', limiter);
app.use('/api/signin', limiter);

// =====================
// MIDDLEWARE AUTH
// =====================
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token tidak ada' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(403).json({ message: 'Token tidak valid' });
  }
};

const verifyAdmin = (req, res, next) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ message: 'Akses hanya untuk admin' });
  next();
};

const verifyCashier = (req, res, next) => {
  if (!['cashier', 'admin'].includes(req.user.role))
    return res.status(403).json({ message: 'Akses hanya untuk cashier atau admin' });
  next();
};

// =====================
// AUTH - LOGIN
// =====================
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

    if (result.rows.length === 0)
      return res.status(401).json({ message: 'Login Gagal' });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Login Gagal' });

    const token = jwt.sign(
      { id: user.id_user, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ message: 'Login Berhasil', token, username: user.username, role: user.role });
  } catch (err) {
    console.error('ERROR LOGIN:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// =====================
// AUTH - SIGNIN
// =====================
app.post('/api/signin', async (req, res) => {
  const { username, email, password, role } = req.body;

  if (!username?.trim()) return res.status(400).json({ message: 'username_empty' });
  if (!password || password.length < 6) return res.status(400).json({ message: 'password_short' });
  if (!['customer', 'admin', 'cashier'].includes(role)) return res.status(400).json({ message: 'role_invalid' });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'email_invalid' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const existingUsername = await pool.query('SELECT 1 FROM users WHERE username = $1', [username]);
    const existingEmail = email?.trim()
      ? await pool.query("SELECT 1 FROM users WHERE email = $1 AND email IS NOT NULL AND email != ''", [email])
      : { rows: [] };

    if (existingUsername.rows.length > 0 && existingEmail.rows.length > 0)
      return res.status(400).json({ message: 'both' });
    if (existingUsername.rows.length > 0) return res.status(400).json({ message: 'username' });
    if (existingEmail.rows.length > 0) return res.status(400).json({ message: 'email' });

    await pool.query(
      'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4)',
      [username, email?.trim() || null, hashedPassword, role]
    );

    res.json({ message: 'success' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'server error' });
  }
});

// =====================
// FORGOT PASSWORD
// =====================
app.post('/api/forgot/check-username', async (req, res) => {
  const { username } = req.body;
  if (!username?.trim()) return res.status(400).json({ message: 'invalid' });
  try {
    const result = await pool.query('SELECT 1 FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'not_found' });
    res.json({ message: 'ok' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'server error' });
  }
});

app.post('/api/forgot/check-email', async (req, res) => {
  const { username, email } = req.body;
  if (!username || !email) return res.status(400).json({ message: 'invalid' });
  try {
    const result = await pool.query(
      'SELECT 1 FROM users WHERE username = $1 AND email = $2',
      [username, email]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'not_match' });
    res.json({ message: 'ok' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'server error' });
  }
});

app.post('/api/forgot/reset-password', async (req, res) => {
  const { username, newPassword } = req.body;
  if (!username || !newPassword || newPassword.length < 6)
    return res.status(400).json({ message: 'invalid' });
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE username = $2',
      [hashedPassword, username]
    );
    res.json({ message: 'success' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'server error' });
  }
});

// =====================
// CATEGORIES
// =====================
app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY id_category ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

app.post('/api/categories', verifyToken, verifyAdmin, async (req, res) => {
  const { name_category, description } = req.body;
  if (!name_category) return res.status(400).json({ message: 'Nama kategori wajib diisi' });
  try {
    const result = await pool.query(
      'INSERT INTO categories (name_category, description) VALUES ($1, $2) RETURNING *',
      [name_category, description || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

app.put('/api/categories/:id', verifyToken, verifyAdmin, async (req, res) => {
  const { name_category, description } = req.body;
  if (!name_category) return res.status(400).json({ message: 'Nama kategori wajib diisi' });
  try {
    const result = await pool.query(
      'UPDATE categories SET name_category = $1, description = $2, updated_at = NOW() WHERE id_category = $3 RETURNING *',
      [name_category, description || null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Kategori tidak ditemukan' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

app.delete('/api/categories/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM categories WHERE id_category = $1 RETURNING *',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Kategori tidak ditemukan' });
    res.json({ message: 'Kategori berhasil dihapus' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// =====================
// PRODUCTS
// =====================
const productSelect = `
  SELECT
    p.id_product AS id,
    p.name_product AS title,
    p.price,
    p.stock,
    p.is_active,
    c.id_category,
    c.name_category AS category,
    c.description
  FROM products p
  LEFT JOIN categories c ON p.id_category = c.id_category
`;

// Semua produk aktif (customer)
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query(productSelect + 'WHERE p.is_active = true ORDER BY p.id_product ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Semua produk termasuk nonaktif (cashier & admin)
app.get('/api/products/all', async (req, res) => {
  try {
    const result = await pool.query(productSelect + 'ORDER BY p.id_product ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Produk by ID
app.get('/api/products/:id', async (req, res) => {
  try {
    const result = await pool.query(productSelect + 'WHERE p.id_product = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Produk tidak ditemukan' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

app.post('/api/products', verifyToken, verifyCashier, async (req, res) => {
  const { name_product, price, stock, id_category } = req.body;
  if (!name_product || !price || !id_category)
    return res.status(400).json({ message: 'Nama, harga, dan kategori wajib diisi' });
  try {
    const result = await pool.query(
      'INSERT INTO products (name_product, price, stock, id_category) VALUES ($1, $2, $3, $4) RETURNING *',
      [name_product, price, stock || 0, id_category]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

app.put('/api/products/:id', verifyToken, verifyCashier, async (req, res) => {
  const { name_product, price, stock, id_category } = req.body;
  if (!name_product || !price || !id_category)
    return res.status(400).json({ message: 'Nama, harga, dan kategori wajib diisi' });
  try {
    const result = await pool.query(
      'UPDATE products SET name_product = $1, price = $2, stock = $3, id_category = $4, updated_at = NOW() WHERE id_product = $5 RETURNING *',
      [name_product, price, stock || 0, id_category, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Produk tidak ditemukan' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

app.patch('/api/products/:id/toggle', verifyToken, verifyCashier, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE products SET is_active = NOT is_active, updated_at = NOW() WHERE id_product = $1 RETURNING *',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Produk tidak ditemukan' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

app.delete('/api/products/:id', verifyToken, verifyCashier, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM products WHERE id_product = $1 RETURNING *',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Produk tidak ditemukan' });
    res.json({ message: 'Produk berhasil dihapus' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// =====================
// USERS (admin)
// =====================
app.get('/api/users', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id_user, username, email, role, created_at, updated_at, is_active FROM users ORDER BY id_user ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

app.put('/api/users/:id', verifyToken, verifyAdmin, async (req, res) => {
  const { username, email, role, is_active } = req.body;
  if (!username || !role) return res.status(400).json({ message: 'Username dan role wajib diisi' });
  try {
    const result = await pool.query(
      'UPDATE users SET username = $1, email = $2, role = $3, is_active = $4, updated_at = NOW() WHERE id_user = $5 RETURNING id_user, username, email, role, is_active',
      [username, email || null, role, is_active ?? true, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'User tidak ditemukan' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

app.delete('/api/users/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM users WHERE id_user = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'User tidak ditemukan' });
    res.json({ message: 'User berhasil dihapus' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// =====================
// TRANSACTIONS
// =====================
app.get('/api/transactions', verifyToken, async (req, res) => {
  try {
    const isAdminOrCashier = ['admin', 'cashier'].includes(req.user.role);
    const query = isAdminOrCashier
      ? 'SELECT t.*, u.username FROM transactions t JOIN users u ON t.id_user = u.id_user ORDER BY t.id_transaction DESC'
      : 'SELECT t.*, u.username FROM transactions t JOIN users u ON t.id_user = u.id_user WHERE t.id_user = $1 ORDER BY t.id_transaction DESC';
    const params = isAdminOrCashier ? [] : [req.user.id];
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

app.get('/api/transactions/:id', verifyToken, async (req, res) => {
  try {
    const transaction = await pool.query(
      'SELECT * FROM transactions WHERE id_transaction = $1',
      [req.params.id]
    );
    if (transaction.rows.length === 0) return res.status(404).json({ message: 'Transaksi tidak ditemukan' });

    const items = await pool.query(
      'SELECT ti.*, p.name_product FROM transaction_items ti JOIN products p ON ti.id_product = p.id_product WHERE ti.id_transaction = $1',
      [req.params.id]
    );
    res.json({ ...transaction.rows[0], items: items.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

app.post('/api/transactions', verifyToken, async (req, res) => {
  const { total, payment_method, items } = req.body;
  if (!total || !payment_method || !items?.length)
    return res.status(400).json({ message: 'Data transaksi tidak lengkap' });
  try {
    const transResult = await pool.query(
      'INSERT INTO transactions (id_user, total, payment_method) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, total, payment_method]
    );
    const transaction = transResult.rows[0];

    for (const item of items) {
      await pool.query(
        'INSERT INTO transaction_items (id_transaction, id_product, qty, price, subtotal) VALUES ($1, $2, $3, $4, $5)',
        [transaction.id_transaction, item.id_product, item.qty, item.price, item.qty * item.price]
      );
      await pool.query(
        'UPDATE products SET stock = stock - $1 WHERE id_product = $2',
        [item.qty, item.id_product]
      );
    }

    res.status(201).json({ message: 'Transaksi berhasil', transaction });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

app.delete('/api/transactions/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM transaction_items WHERE id_transaction = $1', [req.params.id]);
    const result = await pool.query(
      'DELETE FROM transactions WHERE id_transaction = $1 RETURNING *',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
    res.json({ message: 'Transaksi berhasil dihapus' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// =====================
// START SERVER
// =====================
app.listen(3000, () => {
  console.log('Server berjalan di http://localhost:3000/api');
});