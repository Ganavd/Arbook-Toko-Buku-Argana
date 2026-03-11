import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import Header from "../components/Header";
import { useDiscounts } from "../store/discountStore";
// import ProductModal from "../components/ProductModal"; // detail
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
  const [selectedProduct, setSelectedProduct] = useState(null); // untuk CRUD edit

  // const [previewProduct, setPreviewProduct] = useState(null); // untuk modal detail tab lihat

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

  const fetchProducts = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/products/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setProducts(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/categories");
      const data = await response.json();
      setCategories(data);
    } catch {
      console.log("gagal fetch kategori");
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

  // ── CRUD handlers ──
  const openAddModal = () => {
    setModalMode("add");
    setFormData({ name_product: "", price: "", stock: "", id_category: "" });
    setSelectedProduct(null);
    setShowModal(true);
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name_product || !formData.price || !formData.id_category) {
      showError("Nama, harga, dan kategori wajib diisi");
      return;
    }
    const url =
      modalMode === "add"
        ? "http://localhost:3000/api/products"
        : `http://localhost:3000/api/products/${selectedProduct.id}`;
    const method = modalMode === "add" ? "POST" : "PUT";
    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name_product: formData.name_product,
          price: parseInt(formData.price),
          stock: parseInt(formData.stock) || 0,
          id_category: parseInt(formData.id_category),
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        showError(err.message || "Gagal menyimpan");
        return;
      }
      showSuccess(
        modalMode === "add"
          ? "Produk berhasil ditambahkan!"
          : "Produk berhasil diupdate!",
      );
      setShowModal(false);
      fetchProducts();
    } catch {
      showError("Terjadi kesalahan, coba lagi");
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Hapus produk "${product.title}"?`)) return;
    try {
      const response = await fetch(
        `http://localhost:3000/api/products/${product.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) {
        showError("Gagal menghapus produk");
        return;
      }
      showSuccess("Produk berhasil dihapus!");
      fetchProducts();
    } catch {
      showError("Terjadi kesalahan, coba lagi");
    }
  };

  const handleToggleActive = async (product) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/products/${product.id}/toggle`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) {
        showError("Gagal mengubah status");
        return;
      }
      showSuccess(
        product.is_active ? "Produk dinonaktifkan!" : "Produk diaktifkan!",
      );
      fetchProducts();
    } catch {
      showError("Terjadi kesalahan, coba lagi");
    }
  };

  return (
    <div className="dashboard-container">
      {error && <div className="error-popup">{error}</div>}
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
          {/* ── TAB KELOLA ── */}
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
                <p className="loading">Tidak ada produk.</p>
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
                        <td>{product.category}</td>
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
                          <button
                            className="btn-edit"
                            onClick={() => openEditModal(product)}
                          >
                            Edit
                          </button>
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

          {/* ── TAB LIHAT ── */}
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
                      {cat}
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
                        category={product.category}
                        image={product.image}
                        stock={product.stock}
                        discount={getDiscount(product.id)}
                        // onClick={(p) => setPreviewProduct(p)} // buka kalau mau aktifkan modal detail
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* ── MODAL CRUD (tambah/edit produk) ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>{modalMode === "add" ? "Tambah Produk" : "Edit Produk"}</h3>
            <form onSubmit={handleSubmit} noValidate>
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
                      {cat.name_category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-row">
                <div className="modal-input-group floating">
                  <input
                    type="number"
                    placeholder=" "
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

      {/* ── MODAL DETAIL PRODUK (tab lihat) — buka jika pakai ──
      <ProductModal
        product={previewProduct}
        onClose={() => setPreviewProduct(null)}
      />
      */}
    </div>
  );
}

export default Dashcashier;
