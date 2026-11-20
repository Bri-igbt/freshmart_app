"use client";

import { useEffect } from "react";
import {
  Banknote,
  Building2,
  CalendarClock,
  Home,
  Landmark,
  MapPinned,
  Package,
  PackageCheck,
  Phone,
  ReceiptText,
  ShoppingCart,
  User,
  X,
} from "lucide-react";
import { formatDateOnly, formatMoney } from "../DashboardUtils";
import InfoRow from "./InfoRow";
import OrderItemCard from "./OrderItemCard";
import StatusTimeline from "./StatusTimeline";
import { formatShortOrderId } from "@/app/utils/OrderIds.js";
import { orderDetailsModalStyles as s } from "@/app/assets/dummyStyles.js";

const OrderTotalPill = ({ value }) => (
  <div className={s.totalPillContainer}>
    <div className={s.totalPillHeader}>
      <Banknote className={s.totalPillIcon} />
      <span>Order Total</span>
    </div>
    <div className={s.totalPillValueWrapper}>
      <span className={s.totalPillValue}>{value}</span>
    </div>
  </div>
);

const getActions = (status) => ({
  onWay: status === "Processing",
  deliver: status === "Processing" || status === "On the way",
  cancel: status === "Processing" || status === "On the way",
});

const OrderDetailsModal = ({
  order,
  onClose,
  onCancelOrder,
  onStatusChange,
}) => {
  useEffect(() => {
    if (!order) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [order, onClose]);

  if (!order) return null;

  const customerName = order.customer?.name || order.customerName;
  const customerPhone = order.customer?.phone || order.phone;
  const orderDate = order.createdAt || order.orderDate;
  const address = order.address || {};
  const products = order.products || [];

  const actions = getActions(order.orderStatus);
  const hasActions = actions.onWay || actions.deliver || actions.cancel;

  return (
    <div
      className={s.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-details-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className={s.modal}>
        <div className={s.header}>
          <div>
            <h2 id="order-details-title" className={s.headerTitle}>
              Order Details
            </h2>
            <p className={s.headerSubtext}>
              {formatShortOrderId(order.orderId)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={s.closeButton}
          >
            <X className={s.closeIcon} />
          </button>
        </div>

        <div className={s.content}>
          <div className={s.mainGrid}>
            <section className={s.section}>
              <h3 className={s.sectionTitle}>
                <ReceiptText className={s.sectionIcon} />
                Order Information
              </h3>
              <div className={s.infoGrid3}>
                <InfoRow
                  icon={CalendarClock}
                  label="Order Date"
                  value={formatDateOnly(orderDate)}
                />
                <InfoRow
                  icon={Banknote}
                  label="Payment Status"
                  value={order.paymentStatus}
                />
                <InfoRow
                  icon={PackageCheck}
                  label="Delivery Status"
                  value={order.orderStatus}
                />
                <InfoRow
                  icon={ShoppingCart}
                  label="Total Items"
                  value={products.length}
                />
                <OrderTotalPill value={formatMoney(order.totalAmount)} />
              </div>
            </section>

            <section className={s.section}>
              <h3 className={s.sectionTitle}>
                <User className={s.sectionIcon} />
                Customer Information
              </h3>
              <div className={s.infoGrid2}>
                <InfoRow
                  icon={User}
                  label="Customer Name"
                  value={customerName}
                />
                <InfoRow icon={Phone} label="Mobile" value={customerPhone} />
                <InfoRow
                  icon={Home}
                  label="Address Type"
                  value={address.addressType}
                />
                <InfoRow icon={Building2} label="City" value={address.city} />
                <InfoRow
                  icon={Landmark}
                  label="Landmark"
                  value={address.landmark}
                />
                <InfoRow
                  icon={MapPinned}
                  label="Postal Code"
                  value={address.pinCode}
                />
                <InfoRow
                  icon={Home}
                  label="Full Address"
                  value={address.address}
                  wide
                />
              </div>
            </section>
          </div>

          <section className={s.progressSection}>
            <h3 className={s.progressTitle}>Order Progress</h3>
            <div className={s.progressContent}>
              <StatusTimeline status={order.orderStatus} />
            </div>
          </section>

          <section className={s.itemsSection}>
            <h3 className={s.sectionTitle}>
              <Package className={s.sectionIcon} />
              Ordered Items
            </h3>
            <div className={s.itemsGrid}>
              {products.map((item, index) => (
                <OrderItemCard
                  key={`${item.productId ?? "item"}-${index}`}
                  item={item}
                />
              ))}
            </div>
          </section>

          {hasActions && (
            <section className={s.actionsSection}>
              <h3 className={s.actionsTitle}>Admin Actions</h3>
              <div className={s.actionsButtons}>
                {actions.onWay && (
                  <button
                    type="button"
                    onClick={() =>
                      onStatusChange?.(order.orderId, "On the way")
                    }
                    className={s.actionButtonOnWay}
                  >
                    Mark On the way
                  </button>
                )}
                {actions.deliver && (
                  <button
                    type="button"
                    onClick={() => onStatusChange?.(order.orderId, "Delivered")}
                    className={s.actionButtonDeliver}
                  >
                    Mark Delivered
                  </button>
                )}
                {actions.cancel && (
                  <button
                    type="button"
                    onClick={() => onCancelOrder?.(order)}
                    className={s.actionButtonCancel}
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;
