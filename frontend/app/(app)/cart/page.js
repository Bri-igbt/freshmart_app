"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  CreditCard,
  Loader2,
  Minus,
  Plus,
  ShoppingBag,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { useCart } from "@/app/context/CartContext";
import {
  createCheckoutSession,
  getAddress as getAddresses,
  placeOrder,
} from "@/app/api/api.js";
import { cartPageStyles as s } from "@/app/assets/dummyStyles.js";

const DELIVERY_FEE = Number(process.env.NEXT_PUBLIC_DELIVERY_FEE) || 0;
const SELECTED_ADDRESS_KEY = "freshmart-selected-address";

const formatNaira = (value) => `₦${Number(value || 0).toLocaleString("en-NG")}`;

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

const getDeliveryAddressId = async () => {
  const { data } = await getAddresses();
  const addresses = data.addresses || [];
  const savedId = localStorage.getItem(SELECTED_ADDRESS_KEY);
  const chosen =
    addresses.find((address) => address._id === savedId) || addresses[0];

  return chosen?._id || "";
};

const CartPage = () => {
  const router = useRouter();
  const {
    cartItems,
    totalItems,
    subTotal,
    addItem,
    decreaseItem,
    removeItem,
    clearCart,
  } = useCart();
  const [paymentMode, setPaymentMode] = useState("cash");
  const [toast, setToast] = useState(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [removingCartId, setRemovingCartId] = useState(null);

  const toastTimer = useRef(null);
  const removeTimer = useRef(null);
  const checkoutLock = useRef(false);

  useEffect(
    () => () => {
      clearTimeout(toastTimer.current);
      clearTimeout(removeTimer.current);
    },
    []
  );

  const orderTotal = subTotal > 0 ? subTotal + DELIVERY_FEE : 0;

  const showToast = (message, redirectTo, type = "success") => {
    clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(
      () => {
        if (redirectTo) router.push(redirectTo);
        setToast(null);
      },
      type === "error" ? 3500 : 900
    );
  };

  const handleRemoveItem = (cartId) => {
    setRemovingCartId(cartId);
    removeTimer.current = setTimeout(() => {
      removeItem(cartId);
      setRemovingCartId(null);
    }, 250);
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0 || checkoutLock.current) return;

    if (!localStorage.getItem("token")) {
      showToast(
        "Login first",
        `/login?redirect=${encodeURIComponent("/cart")}`
      );
      return;
    }

    checkoutLock.current = true;
    setIsCheckingOut(true);
    let isRedirectingToPayment = false;

    try {
      let addressId = "";
      try {
        addressId = await getDeliveryAddressId();
      } catch (error) {
        console.log(error);
        showToast(
          getErrorMessage(error, "Couldn't load your delivery address"),
          null,
          "error"
        );
        return;
      }

      if (!addressId) {
        showToast(
          "Add delivery address first",
          `/address?redirect=${encodeURIComponent("/cart")}`
        );
        return;
      }

      const order = {
        address: addressId,
        products: cartItems.map((item) => ({
          product: item.id,
          productModel: item.productModel || "Product",
          quantity: item.quantity,
        })),
      };

      if (paymentMode === "online") {
        const { data } = await createCheckoutSession(order);
        isRedirectingToPayment = true;
        window.location.href = data.url;
        return;
      }

      await placeOrder(order);

      clearCart();
      showToast("Order placed successfully", "/orders");
    } catch (error) {
      console.log(error);
      showToast(
        getErrorMessage(error, "Couldn't place your order"),
        null,
        "error"
      );
    } finally {
      if (!isRedirectingToPayment) {
        checkoutLock.current = false;
        setIsCheckingOut(false);
      }
    }
  };

  return (
    <main className={s.mainContainer}>
      <div className="pointer-events-none absolute inset-0">
        <div className={s.bgGradient1} />
        <div className={s.bgLine} />
      </div>

      {toast ? (
        <div className={s.toast} role="status">
          {toast.type === "error" ? (
            <AlertTriangle className={s.iconMd} />
          ) : (
            <CheckCircle2 className={s.iconMd} />
          )}
          {toast.message}
        </div>
      ) : null}

      <section className={s.section}>
        <div className={s.headerWrapper}>
          <div>
            <p className={s.badge}>
              <ShoppingCart className={s.iconSm} />
              FreshMart cart
            </p>
            <h1 className={s.heading}>Your selected items</h1>
            <p className={s.itemCount}>
              {totalItems} {totalItems === 1 ? "item" : "items"} ready for
              checkout
            </p>
          </div>

          <Link href="/" className={s.continueButton}>
            Continue shopping
          </Link>
        </div>

        {cartItems.length === 0 ? (
          <div className={s.emptyContainer}>
            <div className={s.emptyIconWrapper}>
              <ShoppingBag className={s.iconLg} />
            </div>
            <h2 className={s.emptyTitle}>Your cart is empty</h2>
            <p className={s.emptySubtext}>
              Add grocery or hookah products and they will appear here with full
              details.
            </p>
          </div>
        ) : (
          <div className={s.cartGrid}>
            <div className={s.productGrid}>
              {cartItems.map((item) => (
                <article key={item.cartId} className={s.productCard}>
                  <div className={`${s.productImageWrapper} relative`}>
                    {item.image && (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 240px"
                        className={`${s.productImage} object-cover`}
                      />
                    )}
                  </div>

                  <div className={s.productContent}>
                    <div className={s.productHeader}>
                      <div className={s.productInfo}>
                        <p className={s.productCategory}>{item.category}</p>
                        <h2 className={s.productName}>{item.name}</h2>
                        <p className={s.productCompany}>{item.company}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.cartId)}
                        disabled={removingCartId === item.cartId}
                        className={s.removeButton}
                        aria-label={`Remove ${item.name}`}
                      >
                        {removingCartId === item.cartId ? (
                          <Loader2 className={`${s.iconSm} animate-spin`} />
                        ) : (
                          <Trash2 className={s.iconSm} />
                        )}
                      </button>
                    </div>

                    <div className={s.sizeWrapper}>
                      <span className={s.sizeBadge}>{item.size}</span>
                    </div>

                    <div className={s.priceContainer}>
                      <div className={s.priceRow}>
                        <span className={s.priceCurrent}>
                          {formatNaira(item.price)}
                        </span>
                        {item.oldPrice > item.price ? (
                          <span className={s.priceOld}>
                            {formatNaira(item.oldPrice)}
                          </span>
                        ) : null}
                      </div>
                      <p className={s.priceTotal}>
                        Item total: {formatNaira(item.price * item.quantity)}
                      </p>
                    </div>

                    <div className={s.quantityControls}>
                      <button
                        type="button"
                        onClick={() => decreaseItem(item.cartId)}
                        className={s.qtyButton}
                        aria-label={`Decrease ${item.name} quantity`}
                      >
                        <Minus size={14} />
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => addItem(item)}
                        className={s.qtyButton}
                        aria-label={`Increase ${item.name} quantity`}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <aside className={s.summaryAside}>
              <p className={s.summaryLabel}>Checkout</p>
              <h2 className={s.summaryTitle}>Order summary</h2>

              <div className={s.summaryDetails}>
                <div className={s.summaryRow}>
                  <span>Subtotal</span>
                  <span>{formatNaira(subTotal)}</span>
                </div>
                <div className={s.summaryRow}>
                  <span>Delivery fee</span>
                  <span>{formatNaira(DELIVERY_FEE)}</span>
                </div>
                <div className={s.summaryDivider} />
                <div className={s.summaryTotal}>
                  <span>Total</span>
                  <span>{formatNaira(orderTotal)}</span>
                </div>
              </div>

              <div className={s.paymentSection}>
                <p className={s.paymentLabel}>Payment mode</p>
                <div className={s.paymentOptions}>
                  {[
                    { id: "cash", label: "Cash on delivery", icon: Banknote },
                    { id: "online", label: "Online payment", icon: CreditCard },
                  ].map((option) => {
                    const Icon = option.icon;
                    const isActive = paymentMode === option.id;

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setPaymentMode(option.id)}
                        className={`${s.paymentButtonBase} ${
                          isActive
                            ? s.paymentButtonActive
                            : s.paymentButtonInactive
                        }`}
                      >
                        <Icon className={s.iconMd} />
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={isCheckingOut}
                className={s.checkoutButton}
              >
                {isCheckingOut ? (
                  <Loader2 className={`${s.iconMd} animate-spin`} />
                ) : (
                  <CheckCircle2 className={s.iconMd} />
                )}
                {isCheckingOut
                  ? paymentMode === "online"
                    ? "Redirecting..."
                    : "Placing..."
                  : "Checkout"}
              </button>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
};

export default CartPage;
