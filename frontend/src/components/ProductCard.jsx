import "./ProductCard.css";

function ProductCard({
  id,
  title,
  description,
  originalPrice,
  category,
  image,
  stock,
  discount,
  onClick,
}) {
  const hasDiscount = discount && discount.percent > 0;
  const discountedPrice = hasDiscount
    ? Math.round(originalPrice * (1 - discount.percent / 100))
    : null;

  const formatRp = (val) =>
    "Rp" + Number(val).toLocaleString("id-ID", { maximumFractionDigits: 0 });

  const handleBuyClick = (e) => {
    e.stopPropagation();
      onClick?.({
        id,
        title,
        description,
        originalPrice,
        category,
        image,
        stock,
        discount,
        mode: "cart",
      });
  };

  return (
    <div
      className="product-card"
      onClick={() =>
        onClick?.({
          id,
          title,
          description,
          originalPrice,
          category,
          image,
          stock,
          discount,
          mode: "detail",
        })
      }
    >
      <div className="card-cover-wrap">
        {hasDiscount && <span className="card-badge">{discount.percent}%</span>}
        <div className="card-frame">
          {image ? (
            <img src={image} alt={title} className="card-img" loading="lazy" />
          ) : (
            <div className="card-placeholder">
              <svg
                width="28"
                height="28"
                fill="none"
                stroke="rgba(139,94,42,0.35)"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              <p className="card-placeholder-text">{title}</p>
            </div>
          )}
        </div>
      </div>

      <div className="card-info">
        <div className="card-info-top">
          {category && <span className="card-category">{category}</span>}
          <h3 className="card-title">{title}</h3>
          {description && <p className="card-description">{description}</p>}
        </div>
        <div className="card-info-bottom">
          <div className="card-price-section">
            {hasDiscount ? (
              <>
                <span className="card-price card-price--sale">
                  {formatRp(discountedPrice)}
                </span>
                <span className="card-price-old">
                  {formatRp(originalPrice)}
                </span>
              </>
            ) : (
              <span className="card-price">{formatRp(originalPrice)}</span>
            )}
          </div>
          <button className="buy-btn" onClick={handleBuyClick}>
            Beli Sekarang
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
