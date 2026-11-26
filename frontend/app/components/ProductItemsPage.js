"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Minus, Plus, ShoppingCart } from "lucide-react";
import { useCart } from "@/app/context/CartContext";
import { getProducts } from "@/app/api/api.js";
import { productItemsPageStyles as s } from "@/app/assets/dummyStyles.js";

const formatNaira = (value) => `₦${Number(value || 0).toLocaleString("en-NG")}`;

// A malformed URL like /product/100% would make decodeURIComponent throw
const safeDecode = (value) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const ProductItemsPage = () => {
  const { id } = useParams();
  const categoryName = safeDecode(id || "");
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const { addItem, decreaseItem, getQuantity } = useCart();

  useEffect(() => {
    // Ignores the response if the user changed category before it arrived
    let cancelled = false;

    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        setError("");

        const { data } = await getProducts({ category: categoryName });

        if (!cancelled) setProducts(data.products || []);
      } catch (err) {
        console.log(err);
        if (!cancelled) {
          setProducts([]);
          setError(
            err.response?.data?.message || "Couldn't load products right now"
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchProducts();

    return () => {
      cancelled = true;
    };
  }, [categoryName, reloadKey]);

  if (isLoading) {
    return (
      <section className={s.emptySection}>
        <h1 className={s.emptyHeading}>Loading products...</h1>
      </section>
    );
  }

  if (error) {
    return (
      <section className={s.emptySection}>
        <h1 className={s.emptyHeading}>{error}</h1>
        <button
          type="button"
          onClick={() => setReloadKey((key) => key + 1)}
          className={s.emptyLink}
        >
          Try again
        </button>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section className={s.emptySection}>
        <h1 className={s.emptyHeading}>No Products Found</h1>
        <Link href="/" className={s.emptyLink}>
          Back to Home
        </Link>
      </section>
    );
  }

  return (
    <section className={s.section}>
      <div className={s.container}>
        <Link href="/" className={s.backLink}>
          <ArrowLeft size={17} />
          Back to store
        </Link>

        <div className={s.contentWrapper}>
          <div>
            <p className={s.categoryLabel}>{categoryName}</p>
            <h2 className={s.categoryTitle}>
              {products.length} Related{" "}
              {products.length === 1 ? "Product" : "Products"}
            </h2>
          </div>

          <div className={s.productGrid}>
            {products.map((item) => {
              const cartItem = {
                cartId: item._id,
                source: "Product",
                category: categoryName,
                id: item._id,
                productModel: "Product",
                image: item.image?.url,
                name: item.name,
                company: item.company,
                price: item.sellingPrice,
                oldPrice: item.oldPrice,
                size: item.size,
              };

              const quantity = getQuantity(cartItem.cartId);
              const hasDiscount = item.oldPrice > item.sellingPrice;

              return (
                <div key={item._id} className={s.productCard}>
                  <div className={s.cardOverlay1} />
                  <div className={s.cardOverlay2} />
                  <div className={s.cardOverlay3} />

                  <div className={s.cardContent}>
                    <div className={s.imageWrapper}>
                      {item.image?.url && (
                        <img
                          src={item.image.url}
                          alt={item.name}
                          loading="lazy"
                          className={s.productImage}
                        />
                      )}
                    </div>

                    <div className={s.productInfo}>
                      <h3 className={s.productName}>{item.name}</h3>
                      <p className={s.productCompany}>{item.company}</p>
                      {item.size ? (
                        <div className={s.sizeBadge}>{item.size}</div>
                      ) : null}

                      <div className={s.priceContainer}>
                        <div className={s.priceRow}>
                          <span className={s.priceCurrent}>
                            {formatNaira(item.sellingPrice)}
                          </span>
                          {hasDiscount ? (
                            <span className={s.priceOld}>
                              {formatNaira(item.oldPrice)}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className={s.actionWrapper}>
                        {quantity > 0 ? (
                          <div className={s.quantityControls}>
                            <button
                              type="button"
                              onClick={() => decreaseItem(cartItem.cartId)}
                              className={s.qtyButton}
                              aria-label={`Decrease ${item.name} quantity`}
                            >
                              <Minus size={16} />
                            </button>
                            <span>{quantity}</span>
                            <button
                              type="button"
                              onClick={() => addItem(cartItem)}
                              className={s.qtyButton}
                              aria-label={`Increase ${item.name} quantity`}
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => addItem(cartItem)}
                            className={s.addButton}
                          >
                            <ShoppingCart size={16} />
                            Add to Cart
                            <ArrowRight size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className={s.cardBottomBar} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductItemsPage;
