"use client";

import { AlertTriangle, Eye, Phone } from "lucide-react";
import { formatMoney } from "../DashboardUtils";
import StatusDropdown from "./StatusDropdown";
import { formatShortOrderId } from "@/app/utils/orderIds.js"; 
import { ordersTableStyles as s } from "@/app/assets/dummyStyles.js";

const OrdersTable = ({ orders = [], onSelectOrder, onStatusChange }) => (
  <div className={s.container}>
    <table className={s.table}>
      <thead>
        <tr className={s.headerRow}>
          <th className={`${s.headerCell} text-left`}>Customer</th>
          <th className={`${s.headerCell} text-left`}>Order ID</th>
          <th className={`${s.headerCell} text-left`}>Amount</th>
          <th className={`${s.headerCell} text-left`}>Payment</th>
          <th className={`${s.headerCell} text-left`}>Status</th>
          <th className={`${s.headerCell} text-right`}>Action</th>
        </tr>
      </thead>

      <tbody className={s.body}>
        {orders.map((order) => (
          <tr key={order.orderId} className={s.row}>
            <td className={s.cell}>
              <div className={s.customerName}>
                {order.customer?.name || order.customerName}
              </div>
              <div className={s.customerPhone}>
                <Phone className={s.phoneIcon} />
                {order.customer?.phone || order.phone}
              </div>
            </td>

            <td className={s.cellOrderId}>
              {formatShortOrderId(order.orderId)}
            </td>

            <td className={`${s.cell} font-semibold`}>
              {formatMoney(order.totalAmount)}
            </td>

            <td className={s.cell}>
              <span className={s.paymentBadge}>{order.paymentMethod}</span>
            </td>

            <td className={s.cellStatus}>
              <div className={s.statusWrapper}>
                <StatusDropdown order={order} onStatusChange={onStatusChange} />
              </div>
            </td>

            <td className={s.cellAction}>
              <button
                type="button"
                onClick={() => onSelectOrder?.(order)}
                className={s.viewButton}
              >
                <Eye className={s.viewIcon} />
                View
              </button>
            </td>
          </tr>
        ))}

        {orders.length === 0 && (
          <tr>
            <td colSpan={6} className={s.emptyCell}>
              <AlertTriangle className={s.emptyIcon} />
              <p className={s.emptyTitle}>No orders found</p>
              <p className={s.emptySubtext}>
                Try another search or status filter
              </p>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

export default OrdersTable;
