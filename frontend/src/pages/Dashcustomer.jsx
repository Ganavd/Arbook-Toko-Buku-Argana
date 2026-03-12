// Dashcustomer.jsx
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import Header from "../components/Header";
import { useDiscounts } from "../store/discountStore";
import ProductModal from "../components/Productmodal";
import "./Dashcustomer.css";

function Dashboard() {
  const navigate = useNavigate();
  const profileRef = useRef(null);
  const categoryRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [showProfile, setShowProfile] = useState(false);
  const [showCategory, setShowCategory] = useState(false);

  useEffect(() => {
  document.title = "Website Toko Buku | Arbook.com";
  }, []);

  const username = localStorage.getItem("username") || "Guest";

  // ── Diskon dari store (diisi admin, otomatis sync) ──
  const { getDiscount } = useDiscounts();

  const handleLogout = () => {
    localStorage.removeItem("token");
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
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(
          "https://arbook-backend-v1.onrender.com/api/products",
        );
        const data = await response.json();
        setProducts(data);
      } catch {
        // handle silently
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const categories = [
    "Semua",
    ...Array.from(new Set(products.map((p) => p.category).filter(Boolean))),
  ];

  const filteredProducts = products.filter((product) => {
    const matchSearch =
      product.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory =
      activeCategory === "Semua" || product.category === activeCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div className="dashboard-container">
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
      />

      <main className="dashboard-main">
        {/* ── Hero Banner ── */}
        <div className="hero-banner">
          <div className="hero-text">
            <span className="hero-eyebrow">Koleksi Pilihan</span>
            <h1 className="hero-title">
              Temukan Buku
              <br />
              Favoritmu
            </h1>
            <p className="hero-sub">
              Ribuan judul tersedia — dari novel lokal hingga buku impor.
            </p>
          </div>
          <div className="hero-decoration">
            <div className="hero-book hero-book--1" />
            <div className="hero-book hero-book--2" />
            <div className="hero-book hero-book--3" />
          </div>
        </div>

        {/* ── Category Filter Tabs ── */}
        {!loading && categories.length > 1 && (
          <div className="category-tabs">
            {categories.map((cat) => (
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

        {/* ── Section Header ── */}
        {!loading && (
          <div className="section-header">
            <div>
              <h2 className="section-title">
                {activeCategory === "Semua" ? "Semua Buku" : activeCategory}
              </h2>
              <p className="section-count">
                {filteredProducts.length} judul ditemukan
              </p>
            </div>
          </div>
        )}

        {/* ── Product Grid ── */}
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
        ) : filteredProducts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <p className="empty-title">Buku tidak ditemukan</p>
            <p className="empty-sub">Coba kata kunci atau kategori lain</p>
          </div>
        ) : (
          <div className="card-container">
            {filteredProducts.map((product, i) => (
              <div
                key={product.id}
                className="card-wrapper"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <ProductCard
                  title={product.title}
                  id={product.id}
                  description={product.description}
                  category={
                    product.category === "Dasar" ? "Sejarah" : product.category
                  }
                  originalPrice={product.price}
                  image={product.image}
                  stock={product.stock}
                  discount={getDiscount(product.id)}
                  onClick={(p) => setSelectedProduct(p)}
                />
              </div>
            ))}
          </div>
        )}
      </main>
      <ProductModal
        product={selectedProduct}
        mode={selectedProduct?.mode}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}

export default Dashboard;
