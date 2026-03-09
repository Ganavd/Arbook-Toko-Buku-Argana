import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ProductCard from "../components/ProductCard";
  import Header from "../components/Header";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const profileRef = useRef(null);
  const categoryRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showProfile, setShowProfile] = useState(false);
  const [showCategory, setShowCategory] = useState(false);

  const username = localStorage.getItem("username") || "Guest";

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
      if (categoryRef.current && !categoryRef.current.contains(e.target)) {
        setShowCategory(false);
      }
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
        const response = await fetch("http://localhost:3000/api/products");
        const data = await response.json();
        setProducts(data);
        setLoading(false);
      } catch {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(
    (product) =>
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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
        {loading ? (
          <p className="loading">Memuat produk...</p>
        ) : (
          <div className="card-container">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                title={product.title}
                description={product.description}
                originalPrice={product.price}
                category={product.category}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
export default Dashboard;
