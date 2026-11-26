"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Clock3,
  CreditCard,
  Eye,
  Loader2,
  PackageCheck,
  ReceiptText,
  Truck,
  XCircle,
} from "lucide-react";
import { cancelOrder, getMyOrders } from "@/app/api/api.js";
import { formatShortOrderId } from "@/app/utils/orderIds.js";
import { ordersPageStyles as s } from "@/app/assets/dummyStyles.js";
import Image from "next/image.js";
import Navbar from "@/app/components/Navbar.js"; 

const formatNaira = (value) => `₦${Number(value || 0).toLocaleString("en-NG")}`;

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

const toUiStatus = (status) => {
  const statusMap = {
    Processing: "processing",
    "On the way": "shipped",
    Delivered: "delivered",
    Cancelled: "cancelled",
  };

  return statusMap[status] || "processing";
};

const toUiOrder = (order) => {
  const items = (order.products || []).map((item, index) => {
    const live =
      item.product && typeof item.product === "object" ? item.product : {};
    const liveImage =
      typeof live.image === "string" ? live.image : live.image?.url;
    const price = item.sellingPrice ?? live.sellingPrice ?? 0;

    return {
      cartId: `${order._id}-${index}`,
      image: item.image || liveImage || "",
      name: item.name || live.name || "",
      company: item.company || live.company || "",
      size: item.size || live.size || "",
      price,
      oldPrice: item.oldPrice ?? live.oldPrice ?? 0,
      quantity: item.quantity || 0,
    };
  });

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const total = order.totalAmount ?? subtotal;
  const deliveryFee = Math.max(0, Math.round((total - subtotal) * 100) / 100);
  const status = toUiStatus(order.orderStatus);

  return {
    id: order._id,
    placedAt: order.createdAt,
    status,
    paymentMode: ["Online", "Stripe"].includes(order.paymentMethod)
      ? "online"
      : "cash",
    paymentStatus: order.paymentStatus,
    canCancel: status === "processing" && order.paymentStatus !== "Paid",
    items,
    totalItems,
    subtotal,
    deliveryFee,
    total,
  };
};

const getOrderDate = (date) => {
  const parsed = new Date(date);
  if (!date || Number.isNaN(parsed.getTime())) return "-";

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
};

const getPaymentDetails = (order) => {
  const isOnline = order.paymentMode === "online";
  const isPaid = order.paymentStatus === "Paid";

  return {
    icon: isOnline ? CreditCard : Banknote,
    label: isOnline ? "Online payment" : "Cash on delivery",
    status: isPaid ? "Paid" : "COD",
    className:
      isOnline || isPaid
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-yellow-300 bg-yellow-100 text-yellow-800",
  };
};

const getOrderStatusDetails = (status) => {
  const details = {
    processing: {
      icon: Clock3,
      label: "Processing",
      className: "border-yellow-300 bg-yellow-300 text-black",
    },
    shipped: {
      icon: Truck,
      label: "On the way",
      className: "border-sky-200 bg-sky-50 text-sky-700",
    },
    delivered: {
      icon: CheckCircle2,
      label: "Delivered",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    cancelled: {
      icon: XCircle,
      label: "Cancelled",
      className: "border-red-200 bg-red-50 text-red-700",
    },
  };

  return details[status] || details.processing;
};

const getOrderProgress = (status) => {
  const steps = ["processing", "shipped", "delivered"];

  if (status === "cancelled") return 0;

  return Math.max(1, steps.indexOf(status) + 1);
};

const updateCancelledOrder = (orders, orderId) =>
  orders.map((order) =>
    order.id === orderId
      ? {
          ...order,
          status: "cancelled",
          canCancel: false,
          cancelledAt: new Date().toISOString(),
        }
      : order
  );

const page = () => {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [confirmOrderId, setConfirmOrderId] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  const toastTimer = useRef(null);

  const showToast = (message, type = "success") => {
    clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchOrders = async () => {
      if (!localStorage.getItem("token")) {
        localStorage.setItem("freshmart-redirect-after-login", "/orders");
        router.push("/login");
        return;
      }

      try {
        setLoading(true);
        const { data } = await getMyOrders();
        setOrders((data.orders || []).map(toUiOrder));
      } catch (error) {
        console.log(error);
        showToast(
          getErrorMessage(error, "Failed to load your orders"),
          "error"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
    return () => clearTimeout(toastTimer.current);
  }, [router]);

  const totalOrders = orders.length;
  const activeOrders = useMemo(
    () =>
      orders.filter(
        (order) => !["delivered", "cancelled"].includes(order.status)
      ).length,
    [orders]
  );

  const totalSpent = useMemo(
    () =>
      orders
        .filter((order) => order.status === "delivered")
        .reduce((total, order) => total + (order.total || 0), 0),
    [orders]
  );

  const handleCancelAsk = (orderId) => {
    setConfirmOrderId(orderId);
  };

  const handleCancelClose = () => {
    setConfirmOrderId(null);
  };

  const handleToggleItems = (orderId) => {
    setExpandedOrderId((currentId) => (currentId === orderId ? null : orderId));
  };

  const handleCancelOrder = async () => {
    try {
      setCancellingId(confirmOrderId);
      await cancelOrder(confirmOrderId);
      setOrders((currentOrders) =>
        updateCancelledOrder(currentOrders, confirmOrderId)
      );
      setConfirmOrderId(null);
      showToast("Order cancelled successfully");
    } catch (error) {
      console.log(error);
      setConfirmOrderId(null);
      showToast(getErrorMessage(error, "Couldn't cancel this order"), "error");
    } finally {
      setCancellingId(null);
    }
  };

  const confirmOrder = orders.find((order) => order.id === confirmOrderId);

  return (
    <>
      <Navbar />
      <main className={s.mainContainer}>
        <div className="pointer-events-none absolute inset-0">
          <div className={s.bgGradient1} />
          <div className={s.bgLine} />
        </div>

        {toast ? (
          <div className={s.toastContainer} role="status">
            {toast.type === "error" ? (
              <AlertTriangle className={s.iconMd} />
            ) : (
              <CheckCircle2 className={s.iconMd} />
            )}
            {toast.message}
          </div>
        ) : null}

        {confirmOrder ? (
          <div className={s.confirmModal} role="alertdialog" aria-modal="true">
            <div className="flex items-start gap-3">
              <span className={s.confirmIconWrapper}>
                <AlertTriangle className={s.iconMd} />
              </span>
              <div>
                <p className={s.confirmTitle}>
                  Cancel order {formatShortOrderId(confirmOrder.id)}?
                </p>
                <p className={s.confirmSubtext}>
                  This will mark the complete order as cancelled.
                </p>
              </div>
            </div>

            <div className={s.confirmActions}>
              <button
                type="button"
                onClick={handleCancelClose}
                disabled={cancellingId === confirmOrder.id}
                className={s.confirmKeepButton}
              >
                Keep order
              </button>
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={cancellingId === confirmOrder.id}
                className={s.confirmCancelButton}
              >
                {cancellingId === confirmOrder.id
                  ? "Cancelling..."
                  : "Cancel now"}
              </button>
            </div>
          </div>
        ) : null}

        <section className={s.section}>
          <div className={s.headerGrid}>
            <div>
              <p className={s.badge}>
                <PackageCheck className={s.iconSm} />
                FreshMart orders
              </p>
              <h1 className={s.heading}>My orders</h1>
              <p className={s.subheading}>
                Track every checkout with product details, payment status, item
                totals, and cancellation control in one clean place.
              </p>
            </div>

            <div className={s.statsGrid}>
              {[
                { label: "Orders", value: totalOrders, icon: ReceiptText },
                { label: "Active", value: activeOrders, icon: Truck },
                {
                  label: "Spent",
                  value: formatNaira(totalSpent),
                  icon: Banknote,
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.label} className={s.statCard}>
                    <Icon className={s.statIcon} />
                    <p className={s.statValue}>{item.value}</p>
                    <p className={s.statLabel}>{item.label}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {loading ? (
            <div className={s.loadingContainer}>
              <Loader2 className={s.loadingSpinner} />
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-lg font-semibold">No orders yet</p>
              <p className="mt-1 opacity-70">
                When you place an order, it will show up here.
              </p>
              <Link href="/" className="mt-4 inline-block underline">
                Start shopping
              </Link>
            </div>
          ) : (
            <div className={s.ordersGrid}>
              {orders.map((order) => {
                const payment = getPaymentDetails(order);
                const status = getOrderStatusDetails(order.status);
                const PaymentIcon = payment.icon;
                const StatusIcon = status.icon;
                const progress = getOrderProgress(order.status);
                const isExpanded = expandedOrderId === order.id;
                const shortId = formatShortOrderId(order.id);

                return (
                  <article key={order.id} className={s.orderCard}>
                    <div className={s.orderHeader}>
                      <div className={s.orderBadges}>
                        <span className={s.orderIdBadge}>
                          <ReceiptText className={s.iconXs} />
                          {shortId}
                        </span>
                        <span className={`${s.badgeBase} ${status.className}`}>
                          <StatusIcon className={s.iconXs} />
                          {status.label}
                        </span>
                        <span className={`${s.badgeBase} ${payment.className}`}>
                          <PaymentIcon className={s.iconXs} />
                          {payment.status}
                        </span>
                      </div>

                      <h2 className={s.orderItemCount}>
                        {order.totalItems}{" "}
                        {order.totalItems === 1 ? "item" : "items"} ordered
                      </h2>
                      <p className={s.orderDate}>
                        Placed on {getOrderDate(order.placedAt)}
                      </p>

                      <div className={s.orderActions}>
                        <button
                          type="button"
                          onClick={() => handleToggleItems(order.id)}
                          className={`${s.eyeButtonBase} ${
                            isExpanded ? s.eyeButtonActive : s.eyeButtonInactive
                          }`}
                          aria-label={`${
                            isExpanded ? "Hide" : "Show"
                          } ${shortId} items`}
                        >
                          <Eye className={s.iconMd} />
                        </button>

                        {order.status === "cancelled" ? (
                          <div className={s.statusCancelled}>
                            <XCircle className={s.iconMd} />
                            Cancelled
                          </div>
                        ) : order.status === "delivered" ? (
                          <div className={s.statusDelivered}>
                            <CheckCircle2 className={s.iconMd} />
                            Delivered
                          </div>
                        ) : order.canCancel ? (
                          <button
                            type="button"
                            onClick={() => handleCancelAsk(order.id)}
                            className={s.cancelButton}
                          >
                            <XCircle className={s.iconMd} />
                            Cancel order
                          </button>
                        ) : (
                          <p className="text-sm opacity-70">
                            {order.status === "shipped"
                              ? "On its way: can't be cancelled"
                              : "Paid online: contact support to cancel"}
                          </p>
                        )}
                      </div>
                    </div>

                    {isExpanded ? (
                      <div className={s.expandedContainer}>
                        <div className={s.expandedItemsGrid}>
                          {order.items.map((item) => (
                            <div key={item.cartId} className={s.expandedItem}>
                              <div className={s.expandedItemImageWrapper}>
                                {item.image && (
                                  <Image
                                    src={item.image}
                                    alt={item.name}
                                    loading="lazy"
                                    className={s.expandedItemImage}
                                    width={120}
                                    height={120}
                                  />
                                )}
                              </div>

                              <div className={s.expandedItemContent}>
                                <h3 className={s.expandedItemName}>
                                  {item.name}
                                </h3>
                                <p className={s.expandedItemCompany}>
                                  {item.company}
                                </p>
                                <p className={s.expandedItemSize}>
                                  {item.size}
                                </p>
                                <div className={s.expandedItemFooter}>
                                  <span className={s.expandedItemPrice}>
                                    {formatNaira(item.price)}
                                  </span>
                                  <span className={s.expandedItemQty}>
                                    x{item.quantity}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <aside className={s.orderSummary}>
                          <p className={s.summaryTitle}>Order summary</p>
                          <div className={s.summaryDetails}>
                            <div className={s.summaryRow}>
                              <span>Subtotal</span>
                              <span>{formatNaira(order.subtotal)}</span>
                            </div>
                            <div className={s.summaryRow}>
                              <span>Delivery fee</span>
                              <span>{formatNaira(order.deliveryFee)}</span>
                            </div>
                            <div className={s.summaryRow}>
                              <span>Payment</span>
                              <span>{payment.label}</span>
                            </div>
                            <div className={s.summaryDivider} />
                            <div className={s.summaryTotal}>
                              <span>Total</span>
                              <span>{formatNaira(order.total)}</span>
                            </div>
                          </div>

                          <div className={s.progressContainer}>
                            <div className={s.progressLabels}>
                              <span>Processing</span>
                              <span>Delivery</span>
                            </div>
                            <div className={s.progressBar}>
                              {[1, 2, 3].map((step) => (
                                <span
                                  key={step}
                                  className={`${s.progressStep} ${
                                    step <= progress
                                      ? s.progressStepActive
                                      : s.progressStepInactive
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </aside>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </>
  );
};

export default page;
