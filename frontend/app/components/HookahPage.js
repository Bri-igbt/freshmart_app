"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingCart, ArrowRight, Minus, Plus } from "lucide-react";
import { useCart } from "@/app/context/CartContext";
import { getHookahs } from "@/app/api/api.js";
import { hookahPageStyles as s } from "@/app/assets/dummyStyles.js";

const PREVIEW_COUNT = 12;

const formatNaira = (value) => `₦${Number(value || 0).toLocaleString("en-NG")}`;

const HookahPage = ({ expanded = false }) => {
  const { addItem, decreaseItem, getQuantity } = useCart();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHookah = async () => {
      try {
        const { data } = await getHookahs();
        setProducts(data.hookahs || []);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHookah();
  }, []);

  const visibleProducts = expanded
    ? products
    : products.slice(0, PREVIEW_COUNT);
  // Only offer "View More" when there is actually more to see
  const hasMoreProducts = !expanded && products.length > PREVIEW_COUNT;

  // Nothing to show yet (or no hookahs added): hide the whole section
  if (!isLoading && products.length === 0) return null;

  return (
    <section className={s.section}>
      <div className={s.container}>
        <div className={s.headerWrapper}>
          <p className={s.badge}>Premium Hookah Style</p>
          <h1 className={s.heading}>
            Signature <span className={s.highlight}>Hookah Picks</span>
          </h1>
          <div className={s.divider} />
        </div>

        <div className={s.productGrid}>
          {visibleProducts.map((item) => {
            // At checkout send only { product: item.id, productModel, quantity }:
            // the server looks up the real name and price itself.
            const cartItem = {
              cartId: `hookah-${item._id}`,
              source: "Hookah",
              category: "Hookah Products",
              id: item._id,
              productModel: "Hookah",
              image: item.image?.url,
              name: item.name,
              company: item.company,
              price: item.sellingPrice,
              oldPrice: item.oldPrice,
              size: item.size,
            };
            const quantity = getQuantity(cartItem.cartId);

            return (
              <div key={cartItem.cartId} className={s.productCard}>
                <div className={s.cardOverlay1} />
                <div className={s.cardOverlay2} />
                <div className={s.cardOverlay3} />

                <div className={s.cardContent}>
                  <div className={s.imageWrapper}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image?.url}
                      alt={item.name}
                      loading="lazy"
                      className={s.productImage}
                    />
                  </div>

                  <div className={s.productInfo}>
                    <h3 className={s.productName}>{item.name}</h3>
                    <p className={s.productCompany}>{item.company}</p>

                    <div className={s.sizeBadge}>{item.size}</div>

                    <div className={s.priceContainer}>
                      <div className={s.priceRow}>
                        <span className={s.priceCurrent}>
                          {formatNaira(item.sellingPrice)}
                        </span>
                        {item.oldPrice > item.sellingPrice && (
                          <span className={s.priceOld}>
                            {formatNaira(item.oldPrice)}
                          </span>
                        )}
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
                          <span className={s.qtyValue}>{quantity}</span>
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

        {hasMoreProducts && (
          <div className={s.viewMoreWrapper}>
            <Link href="/hookah-products" className={s.viewMoreLink}>
              View More Products
              <ArrowRight size={18} className={s.viewMoreArrow} />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default HookahPage;
