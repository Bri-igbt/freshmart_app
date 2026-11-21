import AdminOrdersView from "@/app/components/dashboard/AdminOrdersView.js";

export default function DashboardPage() {
  return <AdminOrdersView limit={10} showAllButton />;
}
