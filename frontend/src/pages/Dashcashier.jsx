import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import Header from "../components/Header";
import { useDiscounts } from "../store/discountStore";
import "./Dashcashier.css";

function Dashcashier() {
  const navigate = useNavigate();
  const profileRef = useRef(null);
  const categoryRef = useRef(null);

  const [activeTab, setActiveTab] = useState("kelola");
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Semua");

  const [showProfile, setShowProfile] = useState(false);
  const [showCategory, setShowCategory] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
  document.title = "Website Toko Buku | Arbook.com";
  }, []);

  // ── State konfirmasi hapus (menggantikan window.confirm) ──
  // TEST: Klik hapus → harus muncul modal konfirmasi, bukan popup bawaan browser
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [formData, setFormData] = useState({
    name_product: "",
    price: "",
    stock: "",
    id_category: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const username = localStorage.getItem("username") || "Guest";
  const token = localStorage.getItem("token");

  const { getDiscount } = useDiscounts();

  // ── Fungsi tampilkan notifikasi ──
  // TEST: Semua error & sukses harus muncul sebagai popup di atas layar,
  //       bukan alert() bawaan browser
  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(""), 3000);
  };
  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    navigate("/login");
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target))
        setShowProfile(false);
      if (categoryRef.current && !categoryRef.current.contains(e.target))
        setShowCategory(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!token) navigate("/login");
  }, [navigate, token]);

  // ── Fetch semua produk (termasuk nonaktif) ──
  // TEST READ: Buka dashboard cashier → semua produk harus muncul di tabel
  const fetchProducts = async () => {
    try {
      const response = await fetch(
        "https://arbook-backend-v1.onrender.com/api/products/all",
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await response.json();
      setProducts(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch {
      showError("Gagal memuat produk");
      setLoading(false);
    }
  };

  // ── Fetch kategori ──
  // TEST READ: Dropdown kategori di modal harus terisi dari database
  const fetchCategories = async () => {
    try {
      const response = await fetch(
        "https://arbook-backend-v1.onrender.com/api/categories",
      );
      const data = await response.json();
      setCategories(data);
    } catch {
      showError("Gagal memuat kategori");
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const filteredProducts = products.filter(
    (p) =>
      p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const categoryList = [
    "Semua",
    ...Array.from(
      new Set(
        products
          .filter((p) => p.is_active)
          .map((p) => p.category)
          .filter(Boolean),
      ),
    ),
  ];

  const activeProducts = products.filter((p) => {
    const matchActive = p.is_active;
    const matchSearch =
      p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory =
      activeCategory === "Semua" || p.category === activeCategory;
    return matchActive && matchSearch && matchCategory;
  });

  // ── Buka modal tambah produk ──
  const openAddModal = () => {
    setModalMode("add");
    setFormData({ name_product: "", price: "", stock: "", id_category: "" });
    setSelectedProduct(null);
    setShowModal(true);
  };

  // ── Buka modal edit produk ──
  const openEditModal = (product) => {
    setModalMode("edit");
    setSelectedProduct(product);
    setFormData({
      name_product: product.title,
      price: product.price,
      stock: product.stock,
      id_category: product.id_category,
    });
    setShowModal(true);
  };

  // ── Submit tambah / edit produk ──
  const handleSubmit = async (e) => {
    e.preventDefault();

    // ── VALIDASI FRONTEND ──

    // TEST CREATE: Coba submit form kosong → harus muncul error
    if (!formData.name_product.trim()) {
      showError("Nama produk wajib diisi");
      return;
    }

    // TEST CREATE: Coba isi nama kurang dari 3 huruf → harus muncul error
    if (formData.name_product.trim().length < 3) {
      showError("Nama produk minimal 3 karakter");
      return;
    }

    // TEST CREATE: Coba submit tanpa pilih kategori → harus muncul error
    if (!formData.id_category) {
      showError("Kategori wajib dipilih");
      return;
    }

    // TEST CREATE: Coba isi harga 0 atau kosong → harus muncul error
    if (!formData.price || parseInt(formData.price) <= 0) {
      showError("Harga harus lebih dari 0");
      return;
    }

    // TEST CREATE: Coba isi stok negatif → harus muncul error
    if (parseInt(formData.stock) < 0) {
      showError("Stok tidak boleh negatif");
      return;
    }

    // ── VALIDASI DUPLIKAT (khusus mode tambah) ──
    // TEST CREATE: Coba tambah produk dengan nama yang SAMA PERSIS → harus muncul error
    // TEST CREATE: Coba tambah produk dengan nama SAMA tapi beda huruf besar/kecil
    //              (misal "naruto" padahal sudah ada "Naruto") → harus muncul error
    if (modalMode === "add") {
      const isDuplicate = products.some(
        (p) =>
          p.title?.toLowerCase().trim() ===
          formData.name_product.toLowerCase().trim(),
      );
      if (isDuplicate) {
        showError("Produk dengan nama ini sudah ada!");
        return;
      }
    }

    const url =
      modalMode === "add"
        ? "https://arbook-backend-v1.onrender.com/api/products"
        : `https://arbook-backend-v1.onrender.com/api/products/${selectedProduct.id}`;
    const method = modalMode === "add" ? "POST" : "PUT";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name_product: formData.name_product.trim(),
          price: parseInt(formData.price),
          stock: parseInt(formData.stock) || 0,
          id_category: parseInt(formData.id_category),
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        showError(err.message || "Gagal menyimpan produk");
        return;
      }

      // TEST CREATE: Tambah produk lengkap & valid → harus muncul notifikasi hijau sukses
      // TEST UPDATE: Edit produk & simpan → harus muncul notifikasi hijau sukses
      showSuccess(
        modalMode === "add"
          ? "Produk berhasil ditambahkan! ✅"
          : "Produk berhasil diupdate! ✅",
      );
      setShowModal(false);
      fetchProducts();
    } catch {
      showError("Terjadi kesalahan, coba lagi");
    }
  };

  // ── Hapus produk — pakai modal konfirmasi ──
  // TEST DELETE: Klik hapus → harus muncul modal konfirmasi dulu (bukan alert browser)
  // TEST DELETE: Klik "Batal" di modal → produk tidak terhapus
  // TEST DELETE: Klik "Ya, Hapus" → produk hilang dari tabel + notifikasi sukses
  const handleDelete = (product) => {
    setConfirmDelete(product);
  };

  const confirmDeleteProduct = async () => {
    const product = confirmDelete;
    setConfirmDelete(null);
    try {
      const response = await fetch(
        `https://arbook-backend-v1.onrender.com/api/products/${product.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) {
        showError("Gagal menghapus produk");
        return;
      }
      showSuccess(`Produk "${product.title}" berhasil dihapus! 🗑️`);
      fetchProducts();
    } catch {
      showError("Terjadi kesalahan, coba lagi");
    }
  };

  // ── Toggle aktif / nonaktif produk ──
  // TEST TOGGLE: Klik "Nonaktifkan" → status berubah jadi Nonaktif + notifikasi
  // TEST TOGGLE: Buka tab "Lihat" → produk nonaktif tidak muncul di sana
  // TEST TOGGLE: Klik "Aktifkan" → status kembali Aktif + notifikasi
  const handleToggleActive = async (product) => {
    try {
      const response = await fetch(
        `https://arbook-backend-v1.onrender.com/api/products/${product.id}/toggle`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) {
        showError("Gagal mengubah status produk");
        return;
      }
      showSuccess(
        product.is_active
          ? `"${product.title}" dinonaktifkan!`
          : `"${product.title}" diaktifkan! ✅`,
      );
      fetchProducts();
    } catch {
      showError("Terjadi kesalahan, coba lagi");
    }
  };

  return (
    <div className="dashboard-container">
      {/* Notifikasi error — muncul di atas layar */}
      {error && <div className="error-popup">{error}</div>}
      {/* Notifikasi sukses — muncul di atas layar */}
      {success && <div className="success-popup">{success}</div>}

      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showProfile={showProfile}
        setShowProfile={setShowProfile}
        showCategory={showCategory}
        setShowCategory={setShowCategory}
        profileRef={profileRef}
        categoryRef={categoryRef}
        username={username}
        handleLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="dashboard-main">
        <div className="tab-content" key={activeTab}>
          {/* ══════════════════════════════════
              TAB KELOLA — Manajemen Produk
              TEST READ: Semua produk (aktif+nonaktif) harus tampil di tabel ini
          ══════════════════════════════════ */}
          {activeTab === "kelola" && (
            <>
              <div className="cashier-toolbar">
                <h2 className="section-title">Manajemen Produk</h2>
                <button className="btn-add" onClick={openAddModal}>
                  + Tambah Produk
                </button>
              </div>

              {loading ? (
                <p className="loading">Memuat produk...</p>
              ) : filteredProducts.length === 0 ? (
                <div className="empty-state">
                  <span>📦</span>
                  <p>Tidak ada produk ditemukan.</p>
                </div>
              ) : (
                <table className="product-table">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Nama Produk</th>
                      <th>Kategori</th>
                      <th>Harga</th>
                      <th>Stok</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product, index) => (
                      <tr
                        key={product.id}
                        className={!product.is_active ? "row-inactive" : ""}
                      >
                        <td>{index + 1}</td>
                        <td>{product.title}</td>
                        <td>
                          {product.category === "Dasar"
                            ? "Sejarah"
                            : product.category}
                        </td>
                        <td>Rp {product.price.toLocaleString("id-ID")}</td>
                        <td>{product.stock}</td>
                        <td>
                          <span
                            className={`status-badge ${product.is_active ? "active" : "inactive"}`}
                          >
                            {product.is_active ? "Aktif" : "Nonaktif"}
                          </span>
                        </td>
                        <td className="action-btns">
                          {/* TEST UPDATE: Klik Edit → modal terbuka dengan data produk terisi */}
                          <button
                            className="btn-edit"
                            onClick={() => openEditModal(product)}
                          >
                            Edit
                          </button>
                          {/* TEST TOGGLE: Klik ini → status berubah */}
                          <button
                            className={
                              product.is_active
                                ? "btn-deactivate"
                                : "btn-activate"
                            }
                            onClick={() => handleToggleActive(product)}
                          >
                            {product.is_active ? "Nonaktifkan" : "Aktifkan"}
                          </button>
                          {/* TEST DELETE: Klik ini → muncul modal konfirmasi */}
                          <button
                            className="btn-delete"
                            onClick={() => handleDelete(product)}
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {/* ══════════════════════════════════
              TAB LIHAT — Tampilan Customer
              TEST TOGGLE: Produk nonaktif TIDAK boleh muncul di sini
          ══════════════════════════════════ */}
          {activeTab === "lihat" && (
            <>
              {!loading && categoryList.length > 1 && (
                <div className="category-tabs">
                  {categoryList.map((cat) => (
                    <button
                      key={cat}
                      className={`cat-tab ${activeCategory === cat ? "cat-tab--active" : ""}`}
                      onClick={() => setActiveCategory(cat)}
                    >
                      {cat === "Dasar" ? "Sejarah" : cat}
                    </button>
                  ))}
                </div>
              )}

              <div className="section-header">
                <div>
                  <h2 className="section-title">
                    {activeCategory === "Semua" ? "Semua Buku" : activeCategory}
                  </h2>
                  <p className="section-count">
                    {activeProducts.length} judul aktif
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="skeleton-grid">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="skeleton-card">
                      <div className="skeleton-cover" />
                      <div className="skeleton-line skeleton-line--short" />
                      <div className="skeleton-line" />
                      <div className="skeleton-line skeleton-line--price" />
                    </div>
                  ))}
                </div>
              ) : activeProducts.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📚</div>
                  <p className="empty-title">Tidak ada produk aktif</p>
                  <p className="empty-sub">Aktifkan produk di tab Kelola</p>
                </div>
              ) : (
                <div className="card-container">
                  {activeProducts.map((product, i) => (
                    <div
                      key={product.id}
                      className="card-wrapper"
                      style={{ animationDelay: `${i * 0.06}s` }}
                    >
                      <ProductCard
                        title={product.title}
                        description={product.description}
                        originalPrice={product.price}
                        category={
                          product.category === "Dasar"
                            ? "Sejarah"
                            : product.category
                        }
                        image={product.image}
                        stock={product.stock}
                        discount={getDiscount(product.id)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* ══════════════════════════════════
          MODAL KONFIRMASI HAPUS
          TEST DELETE: Harus muncul modal ini, bukan alert() browser
          TEST DELETE: Klik Batal → modal tutup, produk aman
          TEST DELETE: Klik Ya Hapus → produk terhapus + notifikasi sukses
      ══════════════════════════════════ */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 380, textAlign: "center" }}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ marginBottom: 10 }}>Hapus Produk?</h3>
            <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 28 }}>
              Produk <strong>"{confirmDelete.title}"</strong> akan dihapus
              permanen dan tidak bisa dikembalikan.
            </p>
            <div
              className="modal-actions"
              style={{ justifyContent: "center", gap: 12 }}
            >
              <button
                className="btn-cancel"
                onClick={() => setConfirmDelete(null)}
              >
                Batal
              </button>
              <button className="btn-delete" onClick={confirmDeleteProduct}>
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════
          MODAL CRUD — Tambah / Edit Produk
          TEST CREATE: Isi semua field lengkap → klik Tambah → berhasil
          TEST CREATE: Kosongkan salah satu field → klik Tambah → error
          TEST CREATE: Isi nama produk yang sudah ada → error duplikat
          TEST CREATE: Isi harga 0 atau negatif → error
          TEST UPDATE: Buka edit → ubah data → simpan → data terupdate di tabel
      ══════════════════════════════════ */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>
              {modalMode === "add" ? "➕ Tambah Produk" : "✏️ Edit Produk"}
            </h3>
            <form onSubmit={handleSubmit} noValidate>
              {/* Nama Produk */}
              <div className="modal-input-group floating">
                <input
                  type="text"
                  placeholder=" "
                  value={formData.name_product}
                  onChange={(e) =>
                    setFormData({ ...formData, name_product: e.target.value })
                  }
                />
                <label>Nama Produk</label>
              </div>

              {/* Kategori */}
              <div className="modal-input-group">
                <label className="select-label">Kategori</label>
                <select
                  value={formData.id_category}
                  onChange={(e) =>
                    setFormData({ ...formData, id_category: e.target.value })
                  }
                >
                  <option value="">-- Pilih Kategori --</option>
                  {categories.map((cat) => (
                    <option key={cat.id_category} value={cat.id_category}>
                      {cat.name_category === "Dasar"
                        ? "Sejarah"
                        : cat.name_category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Harga & Stok */}
              <div className="modal-row">
                <div className="modal-input-group floating">
                  <input
                    type="number"
                    placeholder=" "
                    min="1"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                  />
                  <label>Harga (Rp)</label>
                </div>
                <div className="modal-input-group floating">
                  <input
                    type="number"
                    placeholder=" "
                    min="0"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({ ...formData, stock: e.target.value })
                    }
                  />
                  <label>Stok</label>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowModal(false)}
                >
                  Batal
                </button>
                <button type="submit" className="btn-save">
                  {modalMode === "add" ? "Tambah" : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashcashier;
