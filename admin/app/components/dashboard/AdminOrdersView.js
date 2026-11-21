"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Banknote,
  Filter,
  PackageCheck,
  Search,
  ShoppingCart,
  XCircle,
} from "lucide-react";
import "@/app/components/dashboard/dashboard.css";
import {
  formatMoney,
  getVisibleOrders,
} from "@/app/components/dashboard/DashboardUtils.js";
import CancelConfirm from "./cards/CancelConfirm.js"; 
import OrderDetailsModal from "./cards/OrderDetailsModal.js"; 
import OrdersTable from "./cards/OrdersTable.js"; 
import StatsGrid from "./cards/StatsGrid.js"; 
import Toast from "./cards/Toast.js"; 
import {
  getAllOrders,
  getDashboard,
  getSingleOrder,
  updateOrderStatus as updateOrderStatusApi,
} from "@/app/api/adminApi.js";
import { adminOrdersViewStyles as s } from "@/app/assets/dummyStyles.js";

const statusOptions = [
  "All",
  "Processing",
  "On the way",
  "Delivered",
  "Cancelled",
];

const PAGE_SIZE = 10;

const getPaymentStatusForOrderStatus = (order, orderStatus) => {
  if (order.paymentMethod === "COD") {
    return orderStatus === "Delivered" ? "Paid" : "Pending";
  }
  return "Paid";
};

const page = ({
  limit,
  showAllButton = false,
  title = "Admin Dashboard",
  subtitle = "Track orders, revenue, customer details, and delivery progress in one clean workspace.",
  eyebrow = "Store Control",
  showSummary = true,
}) => {
  const isPaged = !limit;
  const needsDashboard = showSummary || !isPaged;

  const [orders, setOrders] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [toast, setToast] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancelConfirmOrder, setCancelConfirmOrder] = useState(null);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);

  const showError = useCallback((error, fallback) => {
    setToast({
      type: "warning",
      message: error.response?.data?.message || fallback,
    });
  }, []);

  const fetchDashboard = useCallback(async () => {
    try {
      const { data } = await getDashboard();
      setDashboard(data.dashboard);
      if (!isPaged) setOrders(data.dashboard.latestOrders || []);
    } catch (error) {
      console.log(error);
      showError(error, "Failed to load the dashboard");
    }
  }, [isPaged, showError]);

  const fetchOrders = useCallback(async () => {
    if (!isPaged) return;

    try {
      setOrdersLoading(true);
      const { data } = await getAllOrders({
        search: debouncedSearch,
        status: filterStatus,
        page,
        limit: PAGE_SIZE,
      });

      setOrders(data.orders || []);
      setTotalOrders(data.totalOrders || 0);
      setTotalPages(data.totalPages || 1);

      if (data.totalPages > 0 && page > data.totalPages) {
        setPage(data.totalPages);
      }
    } catch (error) {
      console.log(error);
      showError(error, "Failed to load orders");
    } finally {
      setOrdersLoading(false);
    }
  }, [isPaged, debouncedSearch, filterStatus, page, showError]);

  const refreshData = async () => {
    await Promise.all([
      needsDashboard ? fetchDashboard() : null,
      fetchOrders(),
    ]);
  };

  useEffect(() => {
    const load = async () => {
      if (needsDashboard) await fetchDashboard();
      setInitialLoading(false);
    };
    load();
  }, [needsDashboard, fetchDashboard]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleViewOrder = async (order) => {
    try {
      const { data } = await getSingleOrder(order.orderId);
      setSelectedOrder(data.order);
    } catch (error) {
      console.log(error);
      showError(error, "Failed to load the order");
    }
  };

  const requestOrderStatusChange = async (orderId, status) => {
    if (status === "Cancelled") {
      const order =
        orders.find((item) => item.orderId === orderId) ||
        (selectedOrder?.orderId === orderId ? selectedOrder : null);
      if (order) {
        setCancelConfirmOrder(order);
        return;
      }
    }

    try {
      const { data } = await updateOrderStatusApi(orderId, status);
      if (!data.success) return;

      setOrders((prev) =>
        prev.map((order) =>
          order.orderId === orderId
            ? {
                ...order,
                orderStatus: status,
                paymentStatus: getPaymentStatusForOrderStatus(order, status),
              }
            : order
        )
      );
      setSelectedOrder((prev) =>
        prev?.orderId === orderId
          ? {
              ...prev,
              orderStatus: status,
              paymentStatus: getPaymentStatusForOrderStatus(prev, status),
            }
          : prev
      );
      await refreshData();
      setToast({
        type: status === "Cancelled" ? "warning" : "success",
        message: `Order ${status.toLowerCase()} successfully.`,
      });
    } catch (error) {
      console.log(error.response?.data || error);
      showError(error, "Failed to update the order");
    }
  };

  const visibleOrders = useMemo(() => {
    if (isPaged) return orders;

    return getVisibleOrders({
      orders,
      search,
      status: filterStatus,
      limit,
    });
  }, [isPaged, orders, search, filterStatus, limit]);

  const statCards = [
    {
      title: "Total Revenue",
      value: formatMoney(dashboard?.totalRevenue || 0),
      sub: "Successful Payments",
      icon: Banknote,
    },
    {
      title: "Active Orders",
      value: dashboard?.totalActive || 0,
      sub: "In Progress",
      icon: ShoppingCart,
    },
    {
      title: "Cancelled",
      value: dashboard?.totalCancelled || 0,
      sub: "Needs Attention",
      icon: XCircle,
    },
    {
      title: "Delivered",
      value: dashboard?.totalDelivered || 0,
      sub: "Completed Orders",
      icon: PackageCheck,
    },
  ];

  const confirmCancel = async () => {
    if (!cancelConfirmOrder) return;

    try {
      setCancellingOrderId(cancelConfirmOrder.orderId);
      const { data } = await updateOrderStatusApi(
        cancelConfirmOrder.orderId,
        "Cancelled"
      );
      if (!data.success) return;

      setOrders((prev) =>
        prev.map((order) =>
          order.orderId === cancelConfirmOrder.orderId
            ? {
                ...order,
                orderStatus: "Cancelled",
                paymentStatus: getPaymentStatusForOrderStatus(
                  order,
                  "Cancelled"
                ),
              }
            : order
        )
      );
      setSelectedOrder((prev) =>
        prev?.orderId === cancelConfirmOrder.orderId
          ? {
              ...prev,
              orderStatus: "Cancelled",
              paymentStatus: getPaymentStatusForOrderStatus(prev, "Cancelled"),
            }
          : prev
      );
      await refreshData();
      setCancelConfirmOrder(null);
      setToast({
        type: "warning",
        message: "Order cancelled successfully.",
      });
    } catch (error) {
      console.log(error.response?.data || error);
      showError(error, "Failed to cancel the order");
    } finally {
      setCancellingOrderId(null);
    }
  };

  if (initialLoading) {
    return <div className={s.loadingState}>Loading Dashboard...</div>;
  }

  return (
    <main className={s.main}>
      <section className={s.section}>
        {showSummary && (
          <div className={s.summaryCard}>
            <div className={s.summaryHeader}>
              <div>
                <p className={s.eyebrow}>{eyebrow}</p>
                <h1 className={s.title}>{title}</h1>
                <p className={s.subtitle}>{subtitle}</p>
              </div>
            </div>
            <div className={s.statsWrapper}>
              <StatsGrid cards={statCards} />
            </div>
          </div>
        )}

        <div
          className={`${s.ordersCard} ${
            showSummary ? s.ordersCardWithSummary : ""
          }`}
        >
          <div className={s.ordersHeader}>
            <div>
              <h2 className={s.ordersTitle}>
                {limit ? `Latest ${limit} Orders` : "All Orders"}
              </h2>
              <p className={s.ordersSubtext}>
                Search, filter, inspect items, and update order status.
              </p>
            </div>

            <div className={s.ordersFilters}>
              <label className={s.searchLabel}>
                <Search className={s.searchIcon} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={
                    isPaged
                      ? "Search customer, email, or mobile"
                      : "Search customer, mobile, or order id"
                  }
                  className={s.searchInput}
                />
              </label>
              <label className={s.filterLabel}>
                <Filter className={s.filterIcon} />
                <select
                  value={filterStatus}
                  onChange={(event) => {
                    setFilterStatus(event.target.value);
                    setPage(1);
                  }}
                  className={s.filterSelect}
                >
                  {statusOptions.map((status) => (
                    <option
                      key={status}
                      value={status}
                      className={s.filterOption}
                    >
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <OrdersTable
            orders={visibleOrders}
            onSelectOrder={handleViewOrder}
            onStatusChange={requestOrderStatusChange}
          />

          {isPaged && totalPages > 1 && (
            <div className="flex items-center justify-between gap-3 px-4 py-4 text-sm">
              <span>
                Page {page} of {totalPages} · {totalOrders} orders
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || ordersLoading}
                  className="rounded-lg border border-white/15 px-3 py-1.5 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || ordersLoading}
                  className="rounded-lg border border-white/15 px-3 py-1.5 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {showAllButton && (
            <div className={s.showAllWrapper}>
              <Link href="/orders" className={s.showAllLink}>
                Show All Orders
              </Link>
            </div>
          )}
        </div>
      </section>

      <Toast toast={toast} />
      <CancelConfirm
        order={cancelConfirmOrder}
        onClose={() => setCancelConfirmOrder(null)}
        onConfirm={confirmCancel}
        isLoading={cancellingOrderId === cancelConfirmOrder?.orderId}
      />
      <OrderDetailsModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onCancelOrder={setCancelConfirmOrder}
        onStatusChange={requestOrderStatusChange}
      />
    </main>
  );
};

export default page;
