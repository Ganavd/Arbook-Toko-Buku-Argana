import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import "./Productmodal.css";

// Dipanggil dari Dashcustomer dengan:
// <ProductModal product={selectedProduct} mode="detail"|"cart" onClose={() => setSelectedProduct(null)} />

function ProductModal({ product, mode: initialMode, onClose }) {
  const [mode, setMode] = useState(initialMode || "detail");
  const [qty, setQty] = useState(1);

  // Tutup modal saat tekan Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!product) return null;

  const {
    title,
    description,
    originalPrice,
    category,
    image,
    stock,
    discount,
  } = product;

  const hasDiscount = discount && discount.percent > 0;
  const discountedPrice = hasDiscount
    ? Math.round(originalPrice * (1 - discount.percent / 100))
    : null;
  const finalPrice = hasDiscount ? discountedPrice : originalPrice;

  const formatRp = (val) =>
    "Rp" + Number(val).toLocaleString("id-ID", { maximumFractionDigits: 0 });

  const Cover = () =>
    image ? (
      <img src={image} alt={title} className="pm-cover-img" />
    ) : (
      <div className="pm-cover-placeholder">
        <svg
          width="48"
          height="48"
          fill="none"
          stroke="rgba(139,94,42,0.3)"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
        >
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
        <p>{title}</p>
      </div>
    );

  return createPortal(
    <div className="pm-overlay" onClick={onClose}>
      <div className="pm-box" onClick={(e) => e.stopPropagation()}>
        <button className="pm-close" onClick={onClose}>
          ✕
        </button>

        {/* ── MODE DETAIL ── */}
        {mode === "detail" && (
          <div className="pm-detail">
            <div className="pm-detail-cover">
              <Cover />
            </div>
            <div className="pm-detail-info">
              {category && <span className="pm-category">{category}</span>}
              <h2 className="pm-title">{title}</h2>

              <div className="pm-price-row">
                {hasDiscount ? (
                  <>
                    <span className="pm-price">
                      {formatRp(discountedPrice)}
                    </span>
                    <span className="pm-price-old">
                      {formatRp(originalPrice)}
                    </span>
                    <span className="pm-badge">{discount.percent}% OFF</span>
                  </>
                ) : (
                  <span className="pm-price">{formatRp(originalPrice)}</span>
                )}
              </div>

              <div className="pm-meta">
                <div className="pm-meta-item">
                  <span className="pm-meta-label">Stok</span>
                  <span
                    className={`pm-meta-value ${stock === 0 ? "out" : stock < 5 ? "low" : ""}`}
                  >
                    {stock === 0
                      ? "Habis"
                      : stock < 5
                        ? `Sisa ${stock}`
                        : `${stock} tersedia`}
                  </span>
                </div>
                <div className="pm-meta-item">
                  <span className="pm-meta-label">Kategori</span>
                  <span className="pm-meta-value">{category || "-"}</span>
                </div>
              </div>

              {description && (
                <div className="pm-desc">
                  <p className="pm-desc-label">Deskripsi</p>
                  <p className="pm-desc-text">{description}</p>
                </div>
              )}

              <button
                className="pm-buy-btn"
                disabled={stock === 0}
                onClick={() => {
                  setMode("cart");
                  setQty(1);
                }}
              >
                {stock === 0 ? "Stok Habis" : "Beli Sekarang"}
              </button>
            </div>
          </div>
        )}

        {/* ── MODE CART ── */}
        {mode === "cart" && (
          <div className="pm-cart">
            <h3 className="pm-cart-title">Tambah ke Keranjang</h3>

            <div className="pm-cart-preview">
              <div className="pm-cart-thumb">
                {image ? (
                  <img src={image} alt={title} />
                ) : (
                  <div className="pm-cart-thumb-placeholder">📚</div>
                )}
              </div>
              <div className="pm-cart-preview-info">
                <p className="pm-cart-name">{title}</p>
                <p className="pm-cart-cat">{category}</p>
                <p className="pm-cart-price">{formatRp(finalPrice)}</p>
              </div>
            </div>

            <div className="pm-qty-row">
              <span className="pm-qty-label">Jumlah</span>
              <div className="pm-qty-picker">
                <button
                  className="pm-qty-btn"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                >
                  −
                </button>
                <span className="pm-qty-val">{qty}</span>
                <button
                  className="pm-qty-btn"
                  onClick={() => setQty((q) => Math.min(stock, q + 1))}
                  disabled={qty >= stock}
                >
                  +
                </button>
              </div>
              <span className="pm-qty-stock">Stok: {stock}</span>
            </div>

            <div className="pm-total-row">
              <span className="pm-total-label">Estimasi Total</span>
              <span className="pm-total-val">{formatRp(finalPrice * qty)}</span>
            </div>

            {hasDiscount && (
              <div className="pm-saving">
                Hemat {formatRp((originalPrice - finalPrice) * qty)} (
                {discount.percent}% off)
              </div>
            )}

            <div className="pm-cart-actions">
              <button className="pm-back-btn" onClick={() => setMode("detail")}>
                ← Kembali
              </button>
              <button
                className="pm-confirm-btn"
                onClick={() => {
                  alert(`${qty} "${title}" masuk keranjang!`);
                  onClose();
                }}
              >
                🛒 Masuk Keranjang
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

export default ProductModal;
