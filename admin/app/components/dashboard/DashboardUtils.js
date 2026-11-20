const moneyFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-NG", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export const formatMoney = (value) => moneyFormatter.format(Number(value) || 0);

export const formatDateOnly = (date) => {
  if (!date) return "-";

  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? "-" : dateFormatter.format(parsed);
};

export const getOrderTotals = (order) => Number(order?.totalAmount) || 0;

const getOrderTime = (order) =>
  new Date(order?.createdAt || order?.orderDate).getTime() || 0;

export const getVisibleOrders = ({
  orders = [],
  search = "",
  status = "All",
  limit,
}) => {
  const list = Array.isArray(orders) ? orders : [];
  const query = String(search ?? "")
    .toLowerCase()
    .trim();

  const filtered = list
    .filter((order) => {
      const orderId = String(order?.orderId || "").toLowerCase();
      const customerName = String(
        order?.customer?.name || order?.customerName || ""
      ).toLowerCase();
      const email = String(order?.customer?.email || "").toLowerCase();
      const phone = String(
        order?.customer?.phone || order?.phone || ""
      ).toLowerCase();

      const matchesSearch =
        orderId.includes(query) ||
        customerName.includes(query) ||
        email.includes(query) ||
        phone.includes(query);

      const matchesStatus = status === "All" || order?.orderStatus === status;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => getOrderTime(b) - getOrderTime(a));

  return limit > 0 ? filtered.slice(0, limit) : filtered;
};
