import { PublicOnlyRoute } from "@/app/components/RouteGuards";

export default function LoginLayout({ children }) {
  return <PublicOnlyRoute>{children}</PublicOnlyRoute>;
}
