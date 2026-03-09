import "./ProductCard.css";

function ProductCard({
  title,
  description,
  originalPrice,
  discountedPrice,
  category,
  hasDiscount,
}) {
  return (
    <div className="product-card">
      {/* Discount Ribbon
      {hasDiscount && <div className="discount-ribbon">Diskon 20%</div>} */}
      {/* Category */}
      <span className="card-category">{category}</span>
      {/* Title */}
      <h3 className="card-title">{title}</h3>
      {/* Description */}
      {description && <p className="card-description">{description}</p>}
      {/* Price */}
      {/* <div className="card-price-section">
        {hasDiscount ? (
          <>
            // <div className="original-price">
            //   Rp.{originalPrice.toLocaleString("id-ID")}
            // </div>
            <div className="discounted-price">
              Rp.{discountedPrice.toLocaleString("id-ID")}
            </div>
          </>
        ) : (
          <div className="price">
            Rp.{originalPrice.toLocaleString("id-ID")}
          </div>
        )}
      </div> */}

        <div className="card-price-section"></div>
            <div className="original-price">
              Rp.{originalPrice.toLocaleString("id-ID")}
 

      </div>
      {/* Buy Button */}
      <button className="buy-btn">Beli Sekarang</button>
    </div>
  );
}

export default ProductCard;
