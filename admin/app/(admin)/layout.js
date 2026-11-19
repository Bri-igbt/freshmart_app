import Navbar from "@/app/components/Navbar";
import { ProtectedRoute } from "@/app/components/RouteGuards";

export default function AdminLayout({ children }) {
  return (
    <ProtectedRoute>
      <Navbar />
      {children}
    </ProtectedRoute>
  );
}
