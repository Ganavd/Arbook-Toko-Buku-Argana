import "./Header.css";
import logo from "../assets/Logo.png";

function Header({
  searchQuery,
  setSearchQuery,
  showProfile,
  setShowProfile,
  showCategory,
  setShowCategory,
  profileRef,
  categoryRef,
  username,
  handleLogout,
}) {
  // POINT SYSTEM (hanya visual, tidak ada auto tambah)
  const points = parseInt(localStorage.getItem("points")) || 0;
  const level = Math.floor(points / 100);
  const progress = points % 100;

  // Warna level dinamis
  const getLevelColor = () => {
    if (progress <= 49) return "#22c55e"; // hijau
    if (progress <= 89) return "#facc15"; // kuning
    return "#ef4444"; // merah
  };
  return (
    <header className="dashboard-header">
      <div className="logo">
        <img src={logo} alt="Arbook Logo" className="logo-img" />
        <span className="brand-name">Arbook</span>
      </div>

      <div className="header-center">
        <div
          className="category-filter"
          ref={categoryRef}
          onClick={() => setShowCategory(!showCategory)}
        >
          Kategori ▾
          {showCategory && (
            <div className="category-dropdown">
              <div onClick={() => setSearchQuery("Novel")}>Novel</div>
              <div onClick={() => setSearchQuery("Komik")}>Komik</div>
              <div onClick={() => setSearchQuery("Sejarah")}>Sejarah</div>
              <div onClick={() => setSearchQuery("")}>Semua</div>
            </div>
          )}
        </div>

        <input
          type="text"
          placeholder="Cari buku favoritmu..."
          className="search-bar"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* Keranjang hanya visual */}
        <div className="cart-icon">
          🛒
          <span className="cart-badge-static">0</span>
        </div>
      </div>

      <div
        className="profile-wrapper"
        ref={profileRef}
        onClick={() => setShowProfile(!showProfile)}
      >
        👤
        {showProfile && (
          <div className="profile-dropdown">
            <div className="profile-header">
              <div className="profile-name">{username}</div>
              <div className="profile-level">Level {level}</div>
            </div>

            <div className="level-section">
              <div className="level-bar">
                <div
                  className="level-progress"
                  style={{
                    width: `${progress}%`,
                    background: getLevelColor(),
                  }}
                ></div>
              </div>
              <div className="level-points">{progress}/100 XP</div>
            </div>

            <div className="logout-btn" onClick={handleLogout}>
              Logout
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
