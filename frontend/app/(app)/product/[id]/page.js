import { Suspense } from "react";
import ProductItemsView from "@/app/components/ProductItemsView.js"

export default function ProductItemsRoute() {
  return (
    <Suspense
      fallback={<p style={{ padding: 40, textAlign: "center" }}>Loading...</p>}
    >
      <ProductItemsView />
    </Suspense>
  );
}
